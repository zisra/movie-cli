import {exec} from 'node:child_process';

export function openInBrowser(url: string) {
	const commands = {
		darwin: `open "${url}"`,
		linux: `xdg-open "${url}"`,
		win32: `start "" "${url}"`,
	};

	const command = commands[process.platform];
	if (!command) {
		throw new Error(`Unsupported platform: ${process.platform}`);
	}

	exec(command);
}
