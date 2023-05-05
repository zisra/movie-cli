import { registerProvider, TitleInfo, Progress, MediaType } from '../provider';
import { compareTitle } from '@/utils/compareTitle';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://xemovie.net';

async function execute({
	setProgress,
	titleInfo,
}: {
	setProgress: Progress;
	titleInfo: TitleInfo;
}) {
	const homepage = await ofetch(BASE_URL);

	setProgress(0.3);

	const homepageDocument = load(homepage);

	const token = homepageDocument('input[name="_token"]').attr('value');

	const searchResults = await ofetch(
		`${BASE_URL}/search?_token=${token}&q=${titleInfo.title.replace(/ /g, '+')}`
	);

	setProgress(0.5);

	const searchResultsDocument = load(searchResults);

	const searchResult = searchResultsDocument('.star-name')
		.toArray()
		.map((el) => ({
			href: el.attribs.href,
			title: el.children[1].children[0].data,
		}))
		.find((el) => compareTitle(el.title, titleInfo.title));

	if (!searchResult?.href) {
		throw new Error('No stream found');
	}

	const url =
		titleInfo.type === MediaType.MOVIE
			? `${searchResult.href}/watch`
			: `${searchResult.href}-season-${titleInfo.season}-episode-${titleInfo.episode}/watch`;

	const moviePage = await ofetch(url).catch(() => {
		throw new Error('No stream found');
	});

	setProgress(0.7);

	const moviePageDocument = load(moviePage);

	const streamUrl = moviePageDocument('#player')
		.next()
		.text()
		.match(/"playlist":\s*\[\s*{\s*"file":\s*"(.*?)"/)?.[1];

	if (!streamUrl) {
		throw new Error('No stream found');
	}

	return [
		{
			url: streamUrl,
			quality: 'Unknown',
		},
	];
}

registerProvider({
	name: 'XeMovie',
	rank: 9,
	types: [MediaType.MOVIE, MediaType.SHOW],
	disabled: false,
	execute,
});
