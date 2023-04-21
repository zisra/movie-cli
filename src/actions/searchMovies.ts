import { downloadMovie } from './downloadMovie';
import { searchMovie } from '@/utils/movieInfo';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';

import prompts from 'prompts';
import chalk from 'chalk';

const error = chalk.bold.red;

export async function searchMovies() {
	const { query } = await prompts({
		type: 'text',
		name: 'query',
		message: 'Enter a movie or series name',
	});

	let movies: any;

	try {
		movies = await searchMovie({ query });
	} catch (err) {
		if (err instanceof Error) {
			console.log(error(err.message));
			process.exit(0);
		}
	}

	const { movie } = await prompts({
		type: 'autocomplete',
		name: 'movie',
		message: 'Select a movie',
		choices: movies
			.filter((result: { type: string }) => {
				return result.type === 'movie' || result.type === 'series';
			})
			.map((movie: any) => {
				return {
					title: `${movie.title} • ${capitalizeFirstLetter(movie.type)} • ${
						movie.year
					}`,
					value: movie,
				};
			}),
		suggest: (input, choices) =>
			Promise.resolve(
				choices.filter((i) =>
					i.title.toLowerCase().trim().includes(input.toLowerCase().trim())
				)
			),
	});

	downloadMovie({ imdbID: movie.imdbID });
}
