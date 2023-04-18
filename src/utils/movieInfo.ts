import { ofetch } from 'ofetch';
import { config } from '../config';

export async function movieInfo({ imdbID }) {
	const {
		Title: title,
		Year: year,
		Response: response,
		Type: type,
		totalSeasons: totalSeasons,
	} = await ofetch(
		`http://www.omdbapi.com/?i=${imdbID}&apikey=${config().OMDB_KEY}`
	);

	if (response === 'False') {
		throw new Error('No movie found with the selected IMDb ID');
	}

	if (type === 'series' && totalSeasons === 'N/A') {
		throw new Error('No seasons found for the selected IMDb ID');
	}

	return {
		title,
		year,
		type,
		response,
		totalSeasons: parseInt(totalSeasons),
	};
}

export async function seasonInfo({ imdbID, season }) {
	const { Episodes: episodes, response } = await ofetch(
		`http://www.omdbapi.com/?i=${imdbID}&Season=${season}&apikey=${
			config().OMDB_KEY
		}`
	);

	if (response === 'False') {
		throw new Error('No movie found with the selected IMDb ID');
	}

	return {
		episodes: episodes.map((episode) => {
			{
				return {
					title: episode.Title,
					imdbID: episode.imdbID,
					released: new Date(episode.Released).getFullYear(),
				};
			}
		}),
	};
}
