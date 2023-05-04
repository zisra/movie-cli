import { downloadMovie } from './downloadTitle';
import { searchTitles } from '@/utils/titleInfo';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';

import prompts from 'prompts';
import chalk from 'chalk';

const error = chalk.bold.red;

export async function searchMovies() {
	const { query } = await prompts({
		type: 'text',
		name: 'query',
		message: 'Enter a movie or show name',
	});

	let searchResults: any;

	try {
		searchResults = await searchTitles({ query });
	} catch (err) {
		if (!(err instanceof Error)) return;
		console.log(error(err.message));
		process.exit(0);
	}

	const { movie } = await prompts({
		type: 'autocomplete',
		name: 'movie',
		message: 'Select a movie',
		choices: searchResults
			.filter((result: { type: string }) => {
				return result.type === 'movie' || result.type === 'show';
			})
			.map((movie: any) => {
				return {
					title: `${movie.title} • ${capitalizeFirstLetter(movie.type)} • ${
						movie.year ?? 'Unknown'
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

	downloadMovie({ id: movie.id, type: movie.type });
}
