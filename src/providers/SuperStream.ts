import { registerProvider } from '../provider';
import { compareTitle } from '../utils/compareTitle';
import { btoa } from '../utils/base64';

import { customAlphabet } from 'nanoid';
import CryptoJS from 'crypto-js';
import { ofetch } from 'ofetch';

const nanoid = customAlphabet('0123456789abcdef', 32);

const iv = 'wEiphTn!';
const key = '123d6cedf626dy54233aa1w6';
const apiUrls = [
	'https://showbox.shegu.net/api/api_client/index/',
	'https://mbpapi.shegu.net/api/api_client/index/',
];
const appKey = 'moviebox';
const appId = 'com.tdo.showbox';

const crypto = {
	encrypt(str: string) {
		return CryptoJS.TripleDES.encrypt(str, CryptoJS.enc.Utf8.parse(key), {
			iv: CryptoJS.enc.Utf8.parse(iv),
		}).toString();
	},
	getVerify(str: string, str2: string, str3: string) {
		if (str) {
			return CryptoJS.MD5(
				CryptoJS.MD5(str2).toString() + str3 + str
			).toString();
		}
		return null;
	},
};

const expiry = () => Math.floor(Date.now() / 1000 + 60 * 60 * 12);

const get = (data: object, altApi = false) => {
	const defaultData = {
		childmode: '0',
		app_version: '11.5',
		appid: appId,
		lang: 'en',
		expired_date: `${expiry()}`,
		platform: 'android',
		channel: 'Website',
	};
	const encryptedData = crypto.encrypt(
		JSON.stringify({
			...defaultData,
			...data,
		})
	);
	const appKeyHash = CryptoJS.MD5(appKey).toString();
	const verify = crypto.getVerify(encryptedData, appKey, key);
	const body = JSON.stringify({
		app_key: appKeyHash,
		verify,
		encrypt_data: encryptedData,
	});
	const b64Body = btoa(body);

	const formatted = new URLSearchParams();
	formatted.append('data', b64Body);
	formatted.append('appid', '27');
	formatted.append('platform', 'android');
	formatted.append('version', '129');
	formatted.append('medium', 'Website');

	const requestUrl = altApi ? apiUrls[1] : apiUrls[0];
	return ofetch(requestUrl, {
		method: 'POST',
		parseResponse: JSON.parse,
		headers: {
			Platform: 'android',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: `${formatted.toString()}&token${nanoid()}`,
	});
};

const execute = async ({
	setProgress,
	movieInfo: { title, year, type, season, episode },
}) => {
	const searchQuery = {
		module: 'Search3',
		page: '1',
		type: 'all',
		keyword: title,
		pagelimit: '20',
	};
	const searchRes = (await get(searchQuery, true)).data;

	setProgress(0.5);

	const superstreamEntry = searchRes.find(
		(res: any) => compareTitle(res.title, title) && res.year == year
	);

	if (!superstreamEntry) {
		setProgress(1.0);
		throw new Error('No stream found');
	}
	const superstreamId = superstreamEntry.id;

	if (type === 'movie') {
		const apiQuery = {
			uid: '',
			module: 'Movie_downloadurl_v3',
			mid: superstreamId,
			oss: '1',
			group: '',
		};

		const watchInfo = (await get(apiQuery)).data;

		setProgress(1);

		if (!watchInfo.list?.length) {
			throw new Error('No stream found');
		}

		return watchInfo.list
			.filter((item) => item.path !== '')
			.map((item: any) => ({
				quality: parseInt(item.real_quality),
				url: item.path,
			}));
	} else if (type === 'series') {
		const apiQuery = {
			uid: '',
			module: 'TV_downloadurl_v3',
			tid: superstreamId,
			season,
			episode,
			oss: '1',
			group: '',
		};

		const watchInfo = (await get(apiQuery)).data;

		setProgress(1);

		if (!watchInfo.list?.length) {
			throw new Error('No stream found');
		}

		return watchInfo.list
			.filter((item) => item.path !== '')
			.map((item: any) => ({
				quality: parseInt(item.real_quality),
				url: item.path,
			}));
	} else {
		setProgress(1);
		throw new Error('No stream found');
	}
};

registerProvider({
	name: 'SuperStream',
	types: ['movie', 'series'],
	rank: 1,
	disabled: false,
	execute,
});
