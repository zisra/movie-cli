import { compareTitle } from '@/utils/compareTitle';
import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';

import { ofetch } from 'ofetch';

const BASE_URL = 'https://api.consumet.org/meta/tmdb';

async function execute({
	setProgress,
	movieInfo,
}: {
	setProgress: Progress;
	movieInfo: MovieInfo;
}) {
	const searchResults = await ofetch(
		`/${encodeURIComponent(movieInfo.title)}`,
		{
			baseURL: BASE_URL,
		}
	);

	setProgress(0.4);

	const foundItem = searchResults.results.find((v: any) => {
		if (v.type !== 'Movie' && v.type !== 'TV Series') {
			return false;
		}

		return (
			compareTitle(v.title, movieInfo.title) && v.releaseDate == movieInfo.year
		);
	});

	if (!foundItem) {
		throw new Error('No stream found');
	}

	const mediaInfo = await ofetch(`/info/${foundItem.id}`, {
		baseURL: BASE_URL,
		params: {
			type: movieInfo.type,
		},
	});

	setProgress(0.7);

	if (!mediaInfo.id) {
		throw new Error('No stream found');
	}

	let { episodeId } = mediaInfo;

	if (movieInfo.type === MediaType.MOVIE) {
		episodeId = mediaInfo.episodeId;
	} else {
		const seasonMedia = mediaInfo.seasons.find(
			(o: any) => o.season === movieInfo.season
		);
		episodeId = seasonMedia.episodes.find(
			(o: any) => o.episode === movieInfo.episode
		).id;
	}

	if (!episodeId) {
		throw new Error('No stream found');
	}

	const watchInfo = await ofetch(`/watch/${episodeId}`, {
		baseURL: BASE_URL,
		params: {
			id: mediaInfo.id,
		},
	});

	if (!watchInfo.sources?.length) {
		throw new Error('No stream found');
	}

	return watchInfo.sources.map(
		(video: { url: string; quality: string; isM3U8: boolean }) => ({
			url: video.url,
			quality: video.quality === 'auto' ? 'Unknown' : parseInt(video.quality),
		})
	);
}

registerProvider({
	name: 'FlixHQ',
	types: [MediaType.MOVIE, MediaType.SERIES],
	rank: 6,
	disabled: false,
	execute,
});
