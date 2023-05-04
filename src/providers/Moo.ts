import { registerProvider, TitleInfo, Progress, MediaType } from '../provider';
import { trailingZero } from '@/utils/trailingZero';
import { humanizeBytes } from '@/utils/humanizeBytes';

const BASE_URL = 'https://odd-bird-1319.zwuhygoaqe.workers.dev';
const SERIES_URL = `${BASE_URL}/tvs`;
const MOVIE_URL = `${BASE_URL}/movies`;

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

async function execute({
	setProgress,
	titleInfo,
}: {
	setProgress: Progress;
	titleInfo: TitleInfo;
}) {
	if (titleInfo.type === MediaType.MOVIE) {
		const movieUrl = `${MOVIE_URL}/${encodeURIComponent(titleInfo.title)}%20(${
			titleInfo.year
		})/`;

		let moviesDocument;

		try {
			moviesDocument = await ofetch(movieUrl);
		} catch (err) {
			throw new Error('No stream found');
		}

		setProgress(0.5);

		const $ = load(moviesDocument);

		const streams = $('.file > td > span > a')
			.toArray()
			.map((el) => {
				return {
					url: movieUrl + el.attribs.href,
					quality: humanizeBytes(
						el.parent?.parent?.parent?.children.find(
							(el) => el?.attribs?.['data-order']
						)?.attribs['data-order']
					),
				};
			});

		return streams;
	} else {
		const episodesUrl = `${SERIES_URL}/${encodeURIComponent(
			titleInfo.title
		)}/${encodeURIComponent(`Season ${titleInfo.season}`)}/`;

		let episodesDocument;

		try {
			episodesDocument = await ofetch(episodesUrl);
		} catch (err) {
			throw new Error('No stream found');
		}

		setProgress(0.5);

		const $ = load(episodesDocument);
		const allEpisodes = $('.file > td > span > a')
			.toArray()
			.map((el) => {
				return {
					url: episodesUrl + el.attribs.href,
					quality: humanizeBytes(
						el.parent?.parent?.parent?.children.find(
							(el) => el?.attribs?.['data-order']
						)?.attribs['data-order']
					),
				};
			});

		if (!allEpisodes) {
			throw new Error('No stream found');
		}

		const episodes = allEpisodes.filter((e) =>
			e.url.includes(
				`S${trailingZero(titleInfo?.season || 1)}E${trailingZero(
					titleInfo?.episode || 1
				)}`
			)
		);

		return episodes;
	}
}

registerProvider({
	name: 'Moo',
	rank: 3,
	types: [MediaType.MOVIE, MediaType.SHOW],
	disabled: false,
	execute,
});
