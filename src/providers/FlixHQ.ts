import { compareTitle } from '../utils/compareTitle';
import { registerProvider } from '../provider';

import { ofetch } from 'ofetch';

const flixHqBase = 'https://api.consumet.org/meta/tmdb';

const execute = async ({ setProgress, movieInfo: { title, year } }) => {
	const searchResults = await ofetch(`/${encodeURIComponent(title)}`, {
		baseURL: flixHqBase,
	});

	setProgress(0.4);

	const foundItem = searchResults.results.find((v) => {
		return (
			compareTitle(v.title, title) &&
			v.type === 'Movie' &&
			v.releaseDate === year
		);
	});

	if (!foundItem) {
		setProgress(1);
		throw new Error('No movie found');
	}

	const mediaInfo = await ofetch(`/info/${foundItem.id}`, {
		baseURL: flixHqBase,
		params: {
			type: 'movie',
		},
	});

	setProgress(0.7);

	if (!mediaInfo.id) {
		setProgress(1);
		throw new Error('No movie found');
	}

	const episodeId = mediaInfo.episodeId;

	if (!episodeId) {
		setProgress(1);
		throw new Error('No movie found');
	}

	const watchInfo = await ofetch(`/watch/${episodeId}`, {
		baseURL: flixHqBase,
		params: {
			id: mediaInfo.id,
		},
	});

	if (!watchInfo.sources?.length) {
		throw new Error('No movie found');
	}

	setProgress(1);

	return watchInfo.sources.map(
		(video: { url: string; quality: string; isM3U8: boolean }) => ({
			url: video.url,
			quality: video.quality === 'auto' ? 'Unknown' : parseInt(video.quality),
		})
	);
};

registerProvider({
	name: 'FlixHQ',
	rank: 3,
	disabled: false,
	execute,
});
