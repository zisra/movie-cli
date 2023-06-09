import { registerProvider, TitleInfo, Progress, MediaType } from '../provider';

import Utf8 from 'crypto-js/enc-utf8';
import Base64 from 'crypto-js/enc-base64';
import AES from 'crypto-js/aes';
import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://www.2embed.to';

async function fetchCaptchaToken(
	recaptchaKey: string,
	{
		setProgress,
	}: {
		setProgress: Progress;
	}
) {
	const domainHash = Base64.stringify(Utf8.parse(BASE_URL)).replace(/=/g, '.');

	const recaptchaRender = await ofetch(
		`https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`
	);

	setProgress(0.4);

	const vToken = recaptchaRender.substring(
		recaptchaRender.indexOf('/releases/') + 10,
		recaptchaRender.indexOf('/recaptcha__en.js')
	);

	const recaptchaAnchor = await ofetch(
		`https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=flicklax&k=${recaptchaKey}&co=${domainHash}&v=${vToken}`
	);

	setProgress(0.5);

	const $ = load(recaptchaAnchor);
	const cToken = $('#recaptcha-token').attr('value');

	if (!cToken) {
		throw new Error('Unable to find cToken');
	}

	const payload = {
		v: vToken,
		reason: 'q',
		k: recaptchaKey,
		c: cToken,
		sa: '',
		co: BASE_URL,
	};

	const tokenData = await ofetch(
		`https://www.google.com/recaptcha/api2/reload?${new URLSearchParams(
			payload
		).toString()}`,
		{
			headers: { referer: 'https://www.google.com/recaptcha/api2/' },
			method: 'POST',
		}
	);

	setProgress(0.6);

	return tokenData.match('rresp","(.+?)"')[1];
}

interface RabbitStreamData {
	server: number;
	sources: {
		file: string;
		type: string;
	}[];
	tracks: {
		file: string;
		kind: string;
		label: string;
	}[];
}

async function extractRabbitstream(
	rabbitstreamRes: any,
	{
		setProgress,
	}: {
		setProgress: Progress;
	}
): Promise<RabbitStreamData> {
	const url = new URL(rabbitstreamRes.link);

	const dataPath = url.pathname.split('/');
	const dataId = dataPath[dataPath.length - 1];

	if (!dataId) {
		throw new Error('No stream found');
	}
	const ajaxUrl = `${url.protocol}//${url.hostname}/ajax/embed-4/getSources?id=${dataId}`;

	const extractedData = await ofetch(ajaxUrl, {
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
		},
	});

	setProgress(0.7);

	const getDecryptionKey = await ofetch(
		'https://raw.githubusercontent.com/enimax-anime/key/e4/key.txt'
	);

	setProgress(0.8);

	const decryptSources = AES.decrypt(
		extractedData.sources,
		getDecryptionKey
	).toString(Utf8);

	return {
		...extractedData,
		sources: JSON.parse(decryptSources),
	};
}

async function execute({
	setProgress,
	titleInfo,
}: {
	setProgress: Progress;
	titleInfo: TitleInfo;
}) {
	let url: string;

	if (titleInfo.type === MediaType.MOVIE) {
		url = `${BASE_URL}/embed/imdb/movie?id=${titleInfo.imdbID}`;
	} else {
		url = `${BASE_URL}/embed/imdb/tv?id=${titleInfo.imdbID}&s=${titleInfo.season}&e=${titleInfo.episode}`;
	}

	const embed = await ofetch(url);

	setProgress(0.2);

	const embedPage = load(embed);

	const pageServerItems = embedPage('.item-server');

	const pagevidcloudItem =
		pageServerItems
			.toArray()
			.find((item) => item.children[0]?.data?.includes('Vidcloud')) || null;

	if (!pageServerItems) {
		throw new Error('No stream found');
	}
	const sourceId = pagevidcloudItem
		? pagevidcloudItem.attribs['data-id']
		: null;

	const siteKey = embedPage('body').attr('data-recaptcha-key');

	if (!siteKey) {
		throw new Error('No stream found');
	}

	const captchaToken = await fetchCaptchaToken(siteKey.toString(), {
		setProgress,
	});

	const rabbitstreamRes = await ofetch(
		`${BASE_URL}/ajax/embed/play?id=${sourceId}&_token=${captchaToken}`,
		{
			headers: {
				Referer: BASE_URL,
			},
		}
	);

	const streamData = await extractRabbitstream(rabbitstreamRes, {
		setProgress,
	});

	const streamUrl = streamData.sources[0]?.file;

	if (!streamUrl) {
		throw new Error('No stream found');
	}

	return [
		{
			url: streamUrl,
			quality: 'Unknown',
		},
	];
}

registerProvider({
	name: '2embed',
	rank: 5,
	disabled: false,
	types: [MediaType.MOVIE, MediaType.SHOW],
	execute,
});
