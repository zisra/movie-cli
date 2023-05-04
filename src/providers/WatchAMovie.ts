import { registerProvider, TitleInfo, Progress, MediaType } from '../provider';

import { ofetch } from 'ofetch';

const BASE_URL = 'https://fsa.remotestre.am';

async function execute({
	setProgress,
	titleInfo,
}: {
	setProgress: Progress;
	titleInfo: TitleInfo;
}) {
	let url: string;

	setProgress(0.5);

	if (titleInfo.type === MediaType.MOVIE) {
		url = `${BASE_URL}/Movies/${titleInfo.tmdbID}/${titleInfo.tmdbID}.m3u8`;
	} else if (titleInfo.type === MediaType.SHOW) {
		url = `${BASE_URL}/Shows/${titleInfo.tmdbID}/${titleInfo.season}/${titleInfo.episode}/${titleInfo.episode}.m3u8`;
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
	types: [MediaType.MOVIE, MediaType.SHOW],
	disabled: false,
	execute,
});
