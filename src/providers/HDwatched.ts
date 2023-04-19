import { ofetch } from 'ofetch';
import { load } from 'cheerio';

import { registerProvider } from '../provider';

const BASE_URL = 'https://www.hdwatched.xyz';

interface MovieSearchList {
	title: string;
	id: string;
	year: number;
}

async function execute({ setProgress, movieInfo }) {
	setProgress(20);

	const search = await ofetch(`/search/${movieInfo.imdbID}`, {
		baseURL: BASE_URL,
	});

	const searchPage = load(search);
	const movieElements = searchPage('div.i-container').toArray();

	const movieSearchList: MovieSearchList[] = [];
	movieElements.forEach((movieElement) => {
		const href = searchPage(movieElement).find('a').attr('href') || '';
		const title =
			searchPage(movieElement).find('span.content-title').text() || '';
		const year =
			parseInt(
				searchPage(movieElement)
					.find('div.duration')
					.text()
					.trim()
					.split(' ')
					.pop() || '',
				10
			) || 0;

		movieSearchList.push({
			title,
			year,
			id: href.split('/')[2], // Format: /free/{id}}/{movie-slug} | Example: /free/18804/iron-man-231
		});
	});

	setProgress(50);

	const targetMovie = movieSearchList.find(
		(movie) => movie.year === (movieInfo.year ? +movieInfo.year : 0) // Compare year to make the search more robust
	);

	if (!targetMovie) {
		throw new Error('No stream found');
	}

	const stream = await ofetch(`/embed/${targetMovie.id}`, {
		baseURL: BASE_URL,
	});

	setProgress(80);

	const embedPage = load(stream);
	const source = embedPage('#vjsplayer > source');
	if (!source) {
		throw new Error('No stream found');
	}

	const streamSrc = source.attr('src');
	const streamRes = source.attr('res');

	if (!streamSrc) {
		throw new Error('No stream found');
	}

	return [
		{
			quality: parseInt(streamRes),
			url: streamSrc,
		},
	];
}

registerProvider({
	name: 'HDwatched',
	disabled: false,
	rank: 4,
	types: ['movie'],
	execute,
});
