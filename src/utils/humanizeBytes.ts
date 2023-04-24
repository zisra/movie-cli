export function humanizeBytes(bytes: number) {
	if (bytes == 0) {
		return '0.00 B';
	}
	const e = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, e)).toFixed(2)} ${' KMGTP'.charAt(e)}B`;
}
