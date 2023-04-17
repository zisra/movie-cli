import { registerProvider } from '../provider';
import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const execute = async ({ imdbID, setProgress }) => {
	const BASE_URL = 'https://api.123movie.cc';
	const SERVER = 'serverf4';

	const document = await ofetch(BASE_URL + '/imdb.php/', {
		query: {
			imdb: imdbID,
			server: SERVER,
		},
	});

	setProgress(0.4);

	const $ = load(document);

	const iframeSrc = $('iframe').attr('src');

	if (!iframeSrc) {
		setProgress(1);
		throw new Error('No movie found');
	}

	const iframeDocument = await ofetch.raw(iframeSrc, {
		headers: {
			Referer: BASE_URL,
		},
	});

	setProgress(0.7);

	const id = iframeDocument.url.split('/v/')[1];

	const watchInfo = await ofetch('https://serverf4.org/api/source/' + id, {
		method: 'POST',
	});

	setProgress(1);

	if (!watchInfo.data?.length) {
		throw new Error('No movie found');
	}

	if (watchInfo.success == false) {
		throw new Error('No movie found');
	}

	return watchInfo.data.map((video) => ({
		url: video.file,
		quality: parseInt(video.label),
	}));
};

registerProvider({
	name: 'ServerF4',
	rank: 2,
	disabled: false,
	execute,
});
