import { MultiBar, Presets } from 'cli-progress';
import prompts from 'prompts';
import chalk from 'chalk';

import { getProviders, MediaType } from '../provider';
import { movieInfo, seasonInfo } from '@/utils/movieInfo';
import { openInBrowser } from '@/utils/openInBrowser';

// Providers
import '@/providers/HDwatched';
import '@/providers/SuperStream';
import '@/providers/ServerF4'; // Disabled
import '@/providers/FlixHQ';
import '@/providers/WatchAMovie';
import '@/providers/Moo';
import '@/providers/2embed';
import '@/providers/MovOnline';
import '@/providers/WapFever';

// CLI colors
const error = chalk.bold.red;
const success = chalk.bold.green;
const info = chalk.bold;

// Timeout in milliseconds
const TIMEOUT_MS = 20000;

export async function downloadMovie({ imdbID }: { imdbID: string }) {
	const providers = getProviders();

	let selectedMovie: any;

	try {
		selectedMovie = await movieInfo({ imdbID });
		selectedMovie.imdbID = imdbID;
	} catch (err) {
		if (err instanceof Error) {
			console.log(error(err.message));
			process.exit(0);
		}
	}

	if (selectedMovie.type === MediaType.MOVIE) {
		console.log('');
		console.log(info(`${selectedMovie.title} • ${selectedMovie.year}`));
	} else if (selectedMovie.type === MediaType.SERIES) {
		try {
			const { selectedSeason } = await prompts({
				type: 'number',
				name: 'selectedSeason',
				message:
					selectedMovie.totalSeasons === null
						? 'No seasons found. Enter season number'
						: `Season (1-${selectedMovie.totalSeasons})`,
				min: 1,
				max:
					selectedMovie.totalSeasons === null
						? undefined
						: selectedMovie.totalSeasons,
				validate: (value) => (value && value > 0) ?? 'Invalid season',
			});

			const { episodes } = await seasonInfo({
				imdbID: imdbID ?? '',
				season: selectedSeason,
			});

			let selectedEpisode: any;
			if (episodes === null) {
				selectedEpisode = await prompts({
					type: 'number',
					name: 'selectedEpisode',
					message: 'No episodes found. Enter episode number',
					validate: (value) => (value && value > 0) ?? 'Invalid episode number',
				});

				selectedEpisode = selectedEpisode.selectedEpisode;
			} else {
				selectedEpisode = await prompts({
					type: 'select',
					name: 'selectedEpisode',
					message: 'Episode',
					choices: episodes.map(
						(
							episode: {
								title: string;
							},
							index: number
						) => ({
							title: `E${index + 1} • ${episode.title}`,
							value: episode,
						})
					),
				});

				selectedEpisode = selectedEpisode.selectedEpisode;
			}

			selectedMovie = {
				type: MediaType.SERIES,
				title: selectedMovie.title,
				year: selectedMovie.year.split('–')[0],
				season: selectedSeason,
				imdbID,
				episode:
					episodes === null
						? selectedEpisode
						: episodes
								.map((e: { title: string }) => e.title)
								.indexOf(selectedEpisode.title) + 1,
			};

			console.log('');
			console.log(
				`${selectedMovie.title} • ${selectedMovie.year} • ${
					selectedEpisode.title || `Episode ${selectedMovie.episode}`
				}`
			);
		} catch (err) {
			if (err instanceof Error) {
				console.log(error(err.message));
				process.exit(0);
			}
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

	const progressBar = new MultiBar(
		{
			clearOnComplete: false,
			format: '\033[0m{bar} | {percentage}% | {provider} | {status}',
			emptyOnZero: true,
			autopadding: true,
		},
		Presets.rect
	);

	for (const provider of sortedProviders) {
		let result: any;
		const progress = progressBar.create(1, 0, {
			provider: provider.name,
			status: 'Searching...',
		});

		try {
			result = await Promise.race([
				provider.execute({
					movieInfo: selectedMovie,
					setProgress: (updatedProgress) => {
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
			if (err instanceof Error) {
				progress.update(1, { status: error(err.message) });
				progressBar.stop();
				if (
					err.message !== 'No stream found' &&
					!err.message.startsWith('Timeout reached')
				) {
					// Un-comment to debug
					// console.log(err.stack);
				}
			}
		} finally {
			if (result) {
				progress.update(1, { status: success('Done') });
				progressBar.stop();
				console.log('');
				const { selectedStream } = await prompts({
					type: 'select',
					name: 'selectedStream',
					message: 'Download stream',
					choices: [
						{
							title: info('➜ Skip'),
							value: 'skip',
						},
						...result.map(
							(item: { quality: number | string; url: string }) => ({
								title:
									typeof item.quality === 'number'
										? `${item.quality}p`
										: item.quality,
								value: item.url,
							})
						),
					],
				});
				if (selectedStream !== 'skip') {
					openInBrowser(selectedStream);
					process.exit(0);
				}
			}
		}
	}

	console.log('');
	console.log(error('All providers failed'));
	process.exit(1);
}
