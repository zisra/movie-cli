import { registerProvider, TitleInfo, Progress, MediaType } from '../provider';
import { compareTitle } from '@/utils/compareTitle';

import { ofetch } from 'ofetch';
import { load } from 'cheerio';

const BASE_URL = 'https://www.mov.onl';

async function execute({
	setProgress,
	titleInfo,
}: {
	setProgress: Progress;
	titleInfo: TitleInfo;
}) {
	const search = await ofetch(
		`${BASE_URL}/feeds/posts/default?alt=json&v=2&max-results=25&q=${titleInfo.title}`
	);

	setProgress(0.7);

	if (!search.feed.entry) {
		throw new Error('No stream found');
	}

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
				compareTitle(entry.title, titleInfo.title) &&
				entry.year == titleInfo.year
		);

	if (!stream) {
		throw new Error('No stream found');
	}
	return [
		{
			url: stream.url.toString(),
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
