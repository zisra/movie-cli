import { ofetch } from 'ofetch';
import { load } from 'cheerio';
import { unzip } from 'unzipit';

type SearchResult = {
	title: string;
	path: string;
	count: number;
};

type SearchResults = {
	exact: SearchResult[];
	close: SearchResult[];
	popular: SearchResult[];
};
enum Rating {
	POSITIVE = 'positive',
	NEUTRAL = 'neutral',
	BAD = 'bad',
	UNKNOWN = 'unknown',
}
async function unzipFiles(url: string): Promise<string> {
	const { entries } = await unzip(url);

	const arrayBuffer = await entries[Object.keys(entries)[0]].arrayBuffer();
	const decoder = new TextDecoder('utf-8');
	const string = decoder.decode(arrayBuffer);
	return string;
}

function checkRating(subtitleElement) {
	if (subtitleElement.find('.positive-icon').length !== 0) {
		return Rating.POSITIVE;
	} else if (subtitleElement.find('.bad-icon').length !== 0) {
		return Rating.BAD;
	} else if (subtitleElement.find('.neutral-icon').length !== 0) {
		return Rating.NEUTRAL;
	} else {
		return Rating.UNKNOWN;
	}
}

export async function search({
	query,
}: {
	query: string;
}): Promise<SearchResults> {
	const res = await ofetch('https://subscene.com/subtitles/searchbytitle', {
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			Referer: 'https://subscene.com/',
		},
		body: `query=${encodeURIComponent(query).replaceAll(' ', '+')}&l=`,
		method: 'POST',
	});
	const searchResultsDocument = load(res);

	const searchResultsContainer = searchResultsDocument('.search-result');

	function processSearchResult(searchResults): SearchResult[] {
		return [...searchResults].map((searchResult) => {
			searchResult = searchResultsDocument(searchResult);
			return {
				title: searchResult.find('.title > a').text(),
				path: searchResult.find('.title > a').attr('href'),
				count: parseInt(searchResult.find('.subtle.count').text()),
			};
		});
	}

	const results = {
		tv: processSearchResult(
			searchResultsContainer.find('h2:Contains("TV-Series") + ul > li')
		),
		exact: processSearchResult(searchResultsContainer.find('.exact + ul > li')),
		close: processSearchResult(searchResultsContainer.find('.close + ul > li')),
		popular: processSearchResult(
			searchResultsContainer.find('.popular + ul > li')
		),
	};

	return results;
}

type Subtitle = {
	language: string;
	path?: string;
	filename: string;
	hearingImpaired: boolean;
	comment: string;
	files?: number;
	owner: {
		name?: string;
		path?: string;
	};
	rating: Rating;
};
type Details = Subtitle[];

export async function details({ path }: { path: string }): Promise<Details> {
	const res = await ofetch(`https://subscene.com${path}`);

	const detailsDocument = load(res);

	const table = [
		...detailsDocument(detailsDocument('table').first()).find('tbody > tr'),
	]
		.map((subtitle) => {
			const subtitlePart = detailsDocument(subtitle);
			return {
				language: detailsDocument(subtitlePart.find('a'))
					.find('.l.r')
					.text()
					.trim(),
				path: subtitlePart.find('a').attr('href'),
				filename: detailsDocument(subtitlePart.find('a'))
					.find('.l.r')
					.next()
					.text()
					.trim(),
				hearingImpaired: subtitlePart.find('.a41').length === 1,
				comment: subtitlePart.find('.a6').text().trim(),
				files: parseInt(subtitlePart.find('.a3').text().trim()) || undefined,
				owner: {
					name: detailsDocument(subtitlePart.find('.a5'))
						.find('a')
						.text()
						.trim(),
					path: detailsDocument(subtitlePart.find('.a5'))
						.find('a')
						.attr('href'),
				},
				rating: checkRating(subtitlePart),
			};
		})
		.filter((subtitle) => subtitle.path);

	return table;
}

export async function download({ path }: { path: string }): Promise<string> {
	const res = await ofetch(`https://subscene.com${path}`);
	const subtitleDocument = load(res);
	const link = subtitleDocument('.download > a').attr('href');

	const subtitleData = await unzipFiles(`https://subscene.com${link}`);

	return subtitleData;
}
