import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://api.123movie.cc';
const SERVER = 'serverf4';

async function execute({
	setProgress,
	movieInfo,
}: {
	setProgress: Progress;
	movieInfo: MovieInfo;
}) {
	const document = await ofetch(`${BASE_URL  }/imdb.php/`, {
		query: {
			imdb: movieInfo.imdbID,
			server: SERVER,
		},
	});

	setProgress(0.4);

	const $ = load(document);
	const iframeSrc = $('iframe').attr('src');

	if (!iframeSrc) {
		throw new Error('No stream found');
	}

	let iframeDocument;

	try {
		iframeDocument = await ofetch.raw(iframeSrc, {
			headers: {
				Referer: BASE_URL,
			},
		});
	} catch (err) {
		throw new Error('No stream found');
	}
	setProgress(0.7);

	const id = iframeDocument.url.split('/v/')[1];

	const watchInfo = await ofetch(`https://serverf4.org/api/source/${  id}`, {
		method: 'POST',
	});

	if (!watchInfo.data?.length) {
		throw new Error('No stream found');
	}

	if (watchInfo.success == false) {
		throw new Error('No stream found');
	}

	return watchInfo.data.map((video: any) => ({
		url: video.file,
		quality: parseInt(video.label),
	}));
}

registerProvider({
	name: 'ServerF4',
	rank: 3,
	types: [MediaType.MOVIE],
	disabled: false,
	execute,
});
