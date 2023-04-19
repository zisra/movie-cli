export function normalizeTitle(title: string) {
	return title
		.replace(/the movie/i, '')
		.replace(/the series/i, '')
		.trim()
		.toLowerCase()
		.replace(/['":]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, '_');
}
