import { ofetch } from 'ofetch';
import { config } from '../config';

export async function movieInfo({ imdbID }) {
	const {
		Title: title,
		Year: year,
		Type: type,
		Response: response,
	} = await ofetch(
		`http://www.omdbapi.com/?i=${imdbID}&apikey=${config().OMDB_KEY}`
	);

	return {
		title,
		year,
		type,
		response,
	};
}
