import { exec } from 'node:child_process';

import { config } from '../config';

type Commands = {
	[key in NodeJS.Platform]?: string;
};

export function openFile(url: string) {
	if (
		config().DOWNLOAD_COMMAND &&
		config().DOWNLOAD_COMMAND.includes('<url>')
	) {
		exec(config().DOWNLOAD_COMMAND.replace('<url>', url));
		return;
	}

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
