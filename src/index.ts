import { SingleBar, Presets } from 'cli-progress';
import prompts from 'prompts';
import chalk from 'chalk';
import open from 'open';

import { getProviders } from './provider';
import { movieInfo, seasonInfo } from './utils/movieInfo';

// Providers
import './providers/SuperStream';
import './providers/ServerF4';
import './providers/FlixHQ';

// CLI colors
const error = chalk.bold.red;
const success = chalk.bold.green;
const info = chalk.bold;

// Timeout in milliseconds
const TIMEOUT_MS = 20000; // 20 seconds

const providers = getProviders();

let selectedMovie: any;

const { imdbID } = await prompts({
	type: 'text',
	name: 'imdbID',
	message: 'IMDb ID',
	validate: (value) => (value && value.length > 7) ?? 'Invalid IMDb ID',
});

try {
	selectedMovie = await movieInfo({ imdbID });
	selectedMovie.imdbID = imdbID;
} catch (err) {
	console.log(error(err.message));
	process.exit(0);
}

if (selectedMovie.type === 'movie') {
	console.log('\n');
	console.log(info(selectedMovie.title + ' • ' + selectedMovie.year));
} else if (selectedMovie.type === 'series') {
	try {
		const { selectedSeason } = await prompts({
			type: 'number',
			name: 'selectedSeason',
			message: `Season (1-${selectedMovie.totalSeasons})`,
			min: 1,
			max: selectedMovie.totalSeasons,
			validate: (value) =>
				(value && value > 0 && value <= selectedMovie.totalSeasons) ??
				'Invalid season',
		});

		const { episodes } = await seasonInfo({
			imdbID,
			season: selectedSeason,
		});

		const { selectedEpisode } = await prompts({
			type: 'select',
			name: 'selectedEpisode',
			message: 'Episode',
			choices: episodes.map((episode, index) => ({
				title: `${index + 1} • ${episode.title}`,
				value: episode,
			})),
		});

		selectedMovie = {
			type: 'series',
			title: selectedMovie.title,
			year: selectedMovie.year.split('–')[0],
			season: selectedSeason,
			episode: episodes.map((e) => e.title).indexOf(selectedEpisode.title) + 1,
		};

		console.log('\n');
		console.log(
			`${selectedMovie.title} • ${selectedMovie.year} • ${selectedEpisode.title}`
		);
	} catch (err) {
		console.log(error(err.message));
		process.exit(0);
	}
} else {
	console.log(error('Invalid type'));
	process.exit(0);
}

const hasOnlyproviders = providers.find((p) => p.only);

let sortedProviders = providers
	.sort((a, b) => a.rank - b.rank)
	.filter((p) => !p.disabled)
	.filter((p) => p.types.includes(selectedMovie.type));

if (hasOnlyproviders) {
	sortedProviders = sortedProviders.filter((p) => p.only);
}

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
			err.message !== 'No stream found' &&
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
