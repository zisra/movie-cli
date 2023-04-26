import { registerProvider, MovieInfo, Progress, MediaType } from '../provider';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';
import { compareTitle } from '@/utils/compareTitle';

const BASE_URL = 'https://www.mov.onl';

async function execute({
	setProgress,
	movieInfo,
}: {
	setProgress: Progress;
	movieInfo: MovieInfo;
}) {
	const search = await ofetch(
		`${BASE_URL}/feeds/posts/default?alt=json&v=2&max-results=25&q=${movieInfo.title}`
	);

	setProgress(0.7);

	const stream = search.feed.entry
		.map((entry: any) => {
			const document = load(entry.content['$t']);

			return {
				title: entry.title['$t'].split(':')[0],
				url: document('source').attr('src'),
				year: document('img')
					?.attr('alt')
					?.match(/\((.*)\)/)
					?.pop(),
			};
		})
		.find(
			(entry: any) =>
				compareTitle(entry.title, movieInfo.title) &&
				entry.year == movieInfo.year
		);

	if (!stream) {
		throw new Error('No stream found');
	}
	return [
		{
			url: stream.url,
			quality: 'Unknown',
		},
	];
}

registerProvider({
	name: 'mov.onl',
	rank: 7,
	types: [MediaType.MOVIE],
	disabled: false,
	execute,
});
