import {compareTitle} from '@/utils/compareTitle';
import {registerProvider} from '../provider';

import {ofetch} from 'ofetch';

const BASE_URL = 'https://api.consumet.org/meta/tmdb';

const execute = async ({
	setProgress,
	movieInfo: {title, year, type, season, episode},
}) => {
	const searchResults = await ofetch(`/${encodeURIComponent(title)}`, {
		baseURL: BASE_URL,
	});

	setProgress(0.4);

	const foundItem = searchResults.results.find(v => {
		if (v.type !== 'Movie' && v.type !== 'TV Series') {
			return false;
		}

		return compareTitle(v.title, title) && v.releaseDate == year;
	});

	if (!foundItem) {
		setProgress(1);
		throw new Error('No stream found');
	}

	const mediaInfo = await ofetch(`/info/${foundItem.id}`, {
		baseURL: BASE_URL,
		params: {
			type,
		},
	});

	setProgress(0.7);

	if (!mediaInfo.id) {
		setProgress(1);
		throw new Error('No stream found');
	}

	let {episodeId} = mediaInfo;

	if (type === 'movie') {
		episodeId = mediaInfo.episodeId;
	} else if (type === 'series') {
		const seasonMedia = mediaInfo.seasons.find((o: any) => o.season === season);
		episodeId = seasonMedia.episodes.find((o: any) => o.episode === episode).id;
	}

	if (!episodeId) {
		setProgress(1);
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

	setProgress(1);

	return watchInfo.sources.map(
		(video: {url: string; quality: string; isM3U8: boolean}) => ({
			url: video.url,
			quality: video.quality === 'auto' ? 'Unknown' : parseInt(video.quality),
		}),
	);
};

registerProvider({
	name: 'FlixHQ',
	types: ['movie', 'series'],
	rank: 3,
	disabled: false,
	execute,
});
