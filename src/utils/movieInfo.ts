import { config } from '../config';

import { ofetch } from 'ofetch';

export async function movieInfo({ imdbID }: { imdbID: string }) {
	const {
		Title: title,
		Year: year,
		Response: response,
		Type: type,
		totalSeasons,
	} = await ofetch(
		`http://www.omdbapi.com/?i=${imdbID}&apikey=${config().OMDB_KEY}`
	);

	if (response === 'False') {
		throw new Error('No movie found with the selected IMDb ID');
	}

	return {
		title,
		year,
		type,
		response,
		totalSeasons: totalSeasons === 'N/A' ? null : parseInt(totalSeasons),
	};
}

export async function seasonInfo({
	imdbID,
	season,
}: {
	imdbID: string;
	season: number;
}) {
	const { Episodes: episodes, response } = await ofetch(
		`http://www.omdbapi.com/?i=${imdbID}&Season=${season}&apikey=${
			config().OMDB_KEY
		}`
	);

	if (response === 'False') {
		throw new Error('No movie found with the selected IMDb ID');
	}

	return {
		episodes: episodes
			? episodes.map(
				(episode: { Title: string; imdbID: string; Released: string }) => {
					{
						return {
							title: episode.Title,
							imdbID: episode.imdbID,
							released: new Date(episode.Released).getFullYear(),
						};
					}
				}
			)
			: null,
	};
}
