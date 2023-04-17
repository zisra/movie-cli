import { SingleBar, Presets } from 'cli-progress';
import prompts from 'prompts';
import chalk from 'chalk';
import open from 'open';

import { getProviders } from './provider';
import { movieInfo } from './utils/movieInfo';

// Providers
import './providers/SuperStream';
import './providers/ServerF4';
import './providers/FlixHQ';

// CLI colors
const error = chalk.bold.red;
const success = chalk.bold.green;
const info = chalk.bold;

// Timeout in milliseconds
const TIMEOUT_MS = 5000;

const providers = getProviders();

const hasOnlyproviders = providers.find((p) => p.only);

let sortedProviders = providers
	.sort((a, b) => a.rank - b.rank)
	.filter((p) => !p.disabled);

if (hasOnlyproviders) {
	sortedProviders = sortedProviders.filter((p) => p.only);
}

const { imdbID } = await prompts({
	type: 'text',
	name: 'imdbID',
	message: 'IMDb ID',
});

// Check if the movie exists and is a movie on IMDb
const selectedMovie = await movieInfo({ imdbID });
if (selectedMovie.response === 'False') {
	console.log(error('No movie found with the selected IMDb ID'));
	process.exit(0);
}
if (selectedMovie.type !== 'movie') {
	console.log(error('Not a movie'));
	process.exit(0);
}

console.log(info(selectedMovie.title + ' - ' + selectedMovie.year + '\n'));

for (const provider of sortedProviders) {
	let result: any;
	const progress = new SingleBar(
		{
			format: `{bar} | {percentage}% | {provider} `,
			emptyOnZero: true,
			autopadding: true,
		},
		Presets.rect
	);
	progress.start(1, 0, {
		provider: info(provider.name),
	});

	try {
		result = await Promise.race([
			provider.execute({
				imdbID,
				movieInfo: selectedMovie,
				setProgress: (updatedProgress: number) => {
					progress.update(updatedProgress);
				},
			}),
			new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error(`Timeout reached ${TIMEOUT_MS}ms`));
				}, TIMEOUT_MS);
			}),
		]);
	} catch (err) {
		progress.update(1);
		console.log(error(err.message));
		if (
			err.message !== 'No movie found' &&
			!err.message.startsWith('Timeout reached')
		) {
			console.log('\n');
			console.error(err.stack);
			console.log('\n');
		}
	} finally {
		progress.update(1);

		if (result) {
			console.log(success('Movie found'));
			console.log('\n');
			const { selectedStream } = await prompts({
				type: 'select',
				name: 'selectedStream',
				message: 'Quality',
				choices: result.map(
					(item: { quality: number | string; url: string }) => ({
						title:
							typeof item.quality === 'number'
								? `${item.quality}p`
								: item.quality,
						value: item.url,
					})
				),
			});
			open(selectedStream);
			process.exit(0);
		}
	}
}

console.log('\n');
console.log(error('All providers failed'));
process.exit(1);
