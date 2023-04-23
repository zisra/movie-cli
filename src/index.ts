import prompts from 'prompts';
import { downloadMovie } from '@/actions/downloadMovie';
import { searchMovies } from '@/actions/searchMovies';

const { mode } = await prompts({
	type: 'select',
	name: 'mode',
	message: 'Select mode',
	choices: [
		{ title: 'Search', value: 'search' },
		{ title: 'From IMDb ID', value: 'download' },
	],
});

if (mode === 'search') {
	searchMovies();
} else if (mode === 'download') {
	const { imdbID } = await prompts({
		type: 'text',
		name: 'imdbID',
		message: 'IMDb ID',
	});
	downloadMovie({
		imdbID,
	});
}
