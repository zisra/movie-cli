import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';
import { convertId } from '@/utils/movieInfo';

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
