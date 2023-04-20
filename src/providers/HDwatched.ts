import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://www.hdwatched.xyz';

function getStreamFromEmbed(stream: string) {
	const embedPage = load(stream);
	const source = embedPage('#vjsplayer > source');
	if (!source) {
		throw new Error('No stream found');
	}

	const streamSrc = source.attr('src');
	const streamRes = source.attr('res');

	if (!streamSrc || !streamRes) throw new Error('No stream found');

	return {
		url: streamSrc,
		quality: parseInt(streamRes),
	};
}

async function fetchMovie({ id }: { id: number }) {
	const stream = await ofetch(`/embed/${id}`, {
		baseURL: BASE_URL,
	});

	const embedPage = load(stream);
	const source = embedPage('#vjsplayer > source');
	if (!source) {
		throw new Error('No stream found');
	}

	return getStreamFromEmbed(stream);
}

async function fetchSeries({
	setProgress,
	href,
	season,
	episode,
}: {
	setProgress: Progress;
	href: string;
	season: number;
	episode: number;
}) {
	const seriesPage = await ofetch(`${href}?season=${season}`, {
		baseURL: BASE_URL,
	});

	const seasonPage = load(seriesPage);
	const pageElements = seasonPage('div.i-container').toArray();

	const seriesList: {
		title: string;
		href: string;
		id: string;
	}[] = [];
	pageElements.forEach((pageElement) => {
		const href = seasonPage(pageElement).find('a')?.attr('href') || '';
		const title =
			seasonPage(pageElement).find('span.content-title')?.text() || '';

		if (!href || !title) {
			throw new Error('No stream found');
		}

		seriesList.push({
			title: title.toString(),
			href,
			id: href.split('/')[2], // Format: /free/{id}/{series-slug}-season-{season-number}-episode-{episode-number}
		});
	});

	const targetEpisode = seriesList.find(
		(episodeEl: any) =>
			episodeEl.title.trim().toLowerCase() === `episode ${episode}`
	);

	if (!targetEpisode) {
		throw new Error('No stream found');
	}

	setProgress(70);

	const stream = await ofetch(`/embed/${targetEpisode.id}`, {
		baseURL: BASE_URL,
	});

	const embedPage = load(stream);
	const source = embedPage('#vjsplayer > source');
	if (!source) {
		throw new Error('No stream found');
	}

	return getStreamFromEmbed(stream);
}

async function execute({
	movieInfo,
	setProgress,
}: {
	movieInfo: MovieInfo;
	setProgress: Progress;
}) {
	const search = await ofetch(`/search/${movieInfo.imdbID}`, {
		baseURL: BASE_URL,
	});

	const searchPage = load(search);
	const pageElements = searchPage('div.i-container').toArray();

	const searchList: any = [];
	pageElements.forEach((movieElement) => {
		const href = searchPage(movieElement).find('a').attr('href') || '';
		const title =
			searchPage(movieElement).find('span.content-title').text() || '';
		const year =
			parseInt(
				searchPage(movieElement)
					.find('div.duration')
					.text()
					.trim()
					.split(' ')
					.pop() || '',
				10
			) || 0;

		searchList.push({
			title,
			year,
			id: href.split('/')[2], // Format: /free/{id}}/{movie-slug} | Example: /free/18804/iron-man-231
			href: href,
		});
	});

	setProgress(20);

	const targetSource = searchList.find(
		(source: any) => source.year === (movieInfo.year ? +movieInfo.year : 0)
	);

	if (!targetSource) {
		throw new Error('No stream found');
	}

	setProgress(40);

	if (movieInfo.type === MediaType.SERIES) {
		const series = await fetchSeries({
			setProgress,
			href: targetSource.href,
			season: movieInfo.season ?? 1,
			episode: movieInfo.episode ?? 1,
		});

		if (!series?.url || !series?.quality) {
			throw new Error('No stream found');
		}

		return [
			{
				url: series.url,
				quality: series.quality,
			},
		];
	} else if (movieInfo.type === MediaType.MOVIE) {
		const movie = await fetchMovie({
			id: targetSource.id,
		});

		if (!movie?.url || !movie?.quality) {
			throw new Error('No stream found');
		}

		return [
			{
				url: movie.url,
				quality: movie.quality,
			},
		];
	}
}

registerProvider({
	name: 'HDwatched',
	rank: 2,
	types: [MediaType.MOVIE, MediaType.SERIES],
	execute,
});
