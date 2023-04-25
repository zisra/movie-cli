import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';
import { convertId } from '@/utils/movieInfo';

import { ofetch } from 'ofetch';

const BASE_URL = 'https://fsa.remotestre.am';

async function execute({
	setProgress,
	movieInfo,
}: {
	setProgress: Progress;
	movieInfo: MovieInfo;
}) {
	const tmdbID = await convertId(movieInfo.imdbID);
	let url: string;

	setProgress(0.5);

	if (movieInfo.type === MediaType.MOVIE) {
		url = `${BASE_URL}/Movies/${tmdbID}/${tmdbID}.m3u8`;
	} else if (movieInfo.type === MediaType.SERIES) {
		url = `${BASE_URL}/Shows/${tmdbID}/${movieInfo.season}/${movieInfo.episode}/${movieInfo.episode}.m3u8`;
	} else {
		throw new Error('Invalid media type');
	}

	try {
		// Temporarily allow unsafe or self-assigned SSL certificates

		process.removeAllListeners('warning');

		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

		await ofetch(url);

		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
		process.env.NODE_NO_WARNINGS = '0';
	} catch (err) {
		throw new Error('No stream found');
	}

	return [
		{
			url,
			quality: 'Unknown',
		},
	];
}

registerProvider({
	name: 'WatchAMovie',
	rank: 4,
	types: [MediaType.MOVIE, MediaType.SERIES],
	disabled: false,
	execute,
});
