import { MultiBar, Presets } from 'cli-progress';
import prompts from 'prompts';
import chalk from 'chalk';

import { getProviders, MediaType } from '../provider';
import { titleInfo, getSeason } from '@/utils/titleInfo';
import { openFile } from '@/utils/openFile';
import { config } from 'config';

// Providers
import '@/providers/HDwatched';
import '@/providers/SuperStream';
import '@/providers/ServerF4'; // Disabled
import '@/providers/FlixHQ';
import '@/providers/WatchAMovie';
import '@/providers/Moo';
import '@/providers/2embed';
import '@/providers/MovOnl';
import '@/providers/WapFever';
import '@/providers/XeMovie';

// CLI colors
const error = chalk.bold.red;
const success = chalk.bold.green;
const info = chalk.bold;

export async function downloadMovie({
	id,
	type,
}: {
	id: number;
	type: MediaType;
}) {
	const providers = getProviders();

	const selectedTitle = await titleInfo({ id, type }).catch((err) => {
		if (config().DEBUG_MODE === 'true') {
			console.log(err.stack);
		} else {
			console.log(error(err.message));
		}
		process.exit(1);
	});

	if (selectedTitle.type === MediaType.MOVIE) {
		console.log('');
		console.log(info(`${selectedTitle.title} • ${selectedTitle.year}`));
	} else if (selectedTitle.type === MediaType.SHOW) {
		try {
			const { selectedSeason } = await prompts({
				type: 'number',
				name: 'selectedSeason',
				message: `Select a season (1 - ${
					selectedTitle.seasons[selectedTitle.seasons.length - 1].number
				})`,
				min: 1,
				max: selectedTitle.seasons[selectedTitle.seasons.length - 1].number,
				validate: (value) => (value && value > 0) ?? 'Invalid season',
			});

			const { episodes } = await getSeason({
				id:
					selectedTitle.seasons.find(
						(season: any) => season.number === selectedSeason
					)?.id ?? 1,
			});

			let selectedEpisode: any;

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

			selectedTitle.season = selectedSeason;
			selectedTitle.episodeTitle = selectedEpisode.title;
			selectedTitle.episode = selectedEpisode.number;

			console.log('');
			console.log(
				`${selectedTitle.title} • ${selectedTitle.year} • ${
					selectedEpisode.title || `Episode ${selectedTitle.episode}`
				}`
			);
		} catch (err) {
			if (!(err instanceof Error)) return;
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
		.filter((p) => p.types.includes(selectedTitle.type));

	if (hasOnlyproviders) {
		sortedProviders = sortedProviders.filter((p) => p.only);
	}

	const progressBar = new MultiBar(
		{
			clearOnComplete: false,
			format: '\x1b[0m{bar} | {percentage}% | {provider} | {status}',
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
					titleInfo: selectedTitle,
					setProgress: (updatedProgress) => {
						progress.update(updatedProgress);
					},
				}),
				new Promise((_, reject) => {
					setTimeout(() => {
						reject(new Error(`Timeout reached ${config().TIMEOUT_MS}ms`));
					}, config().TIMEOUT_MS);
				}),
			]);

			if (
				!result?.find(
					(item: { url: string; quality: number | string }) => item?.url
				)
			) {
				throw new Error('No stream found');
			}
		} catch (err) {
			if (!(err instanceof Error)) return;
			progress.update(1, { status: error(err.message) });
			progressBar.stop();

			if (config().DEBUG_MODE === 'true') {
				console.log(err.stack);
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
					openFile(selectedStream);
					process.exit(0);
				}
			}
		}
	}

	console.log('');
	console.log(error('All providers failed'));
	process.exit(1);
}
