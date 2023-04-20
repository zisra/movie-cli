import { exec } from 'node:child_process';

type Commands = {
	[key in NodeJS.Platform]?: string;
};

export function openInBrowser(url: string) {
	const commands: Commands = {
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
