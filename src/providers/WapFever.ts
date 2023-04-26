import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';
import { compareTitle } from '@/utils/compareTitle';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://wapfever.com';

async function execute({
	setProgress,
	movieInfo,
}: {
	setProgress: Progress;
	movieInfo: MovieInfo;
}) {
	const search = await ofetch(
		`${BASE_URL}/search_elastic?s=${movieInfo.title}`
	);

	setProgress(0.4);

	const searchDocument = load(search);
	const results: {
		href?: string;
		title?: string;
	}[] = [];

	searchDocument('.single-video')
		.toArray()
		.forEach((item) => {
			results.push({
				href: searchDocument(item)?.find('a')?.attr('href'),
				title: searchDocument(item)?.find('.video-item-content')?.text(),
			});
		});

	if (!results && results?.length === 0) {
		throw new Error('No stream found');
	}

	const result = results.find((res) => {
		if (!res.title || !res.href) {
			throw new Error('No stream found');
		}
		return compareTitle(res.title, movieInfo.title);
	});

	if (!result?.href) {
		throw new Error('No stream found');
	}

	if (movieInfo.type === MediaType.MOVIE) {
		const video = await ofetch(result.href.replace('details', 'watch'));

		setProgress(0.7);

		const videoDocument = load(video);

		return [
			{
				url: videoDocument('source').attr('src'),
				quality: 'Unknown',
			},
		];
	} else {
		const seasons = await ofetch(result.href);

		setProgress(0.5);

		const seasonsDocument = load(seasons);

		const season = seasonsDocument('.single-video > a')
			.toArray()
			.map((item) => {
				return {
					href: seasonsDocument(item).attr('href'),
					title: seasonsDocument(item).attr('title'),
				};
			})
			.find((season) => season.title === `Season ${movieInfo.season}`);

		if (!season?.href) {
			throw new Error('No stream found');
		}

		const episodes = await ofetch(season.href);

		setProgress(0.6);

		const episodesDocument = load(episodes);

		const episode = episodesDocument('.single-video > a')
			.toArray()
			.map((item) => {
				return {
					href: seasonsDocument(item).attr('href') ?? '',
					title: seasonsDocument(item).attr('title') ?? '',
				};
			})
			.find((episode) => episode.title.startsWith(`E${movieInfo.episode}`));

		if (!episode) {
			throw new Error('No stream found');
		}

		const video = await ofetch(episode.href);

		setProgress(0.7);

		const videoDocument = load(video);

		return [
			{
				url: videoDocument('source').attr('src'),
				quality: 'Unknown',
			},
		];
	}
}

registerProvider({
	name: 'WapFever',
	rank: 8,
	types: [MediaType.MOVIE, MediaType.SERIES],
	disabled: false,
	execute,
});
