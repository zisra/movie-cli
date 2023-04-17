import fs from 'node:fs';

export function config(): any {
	let secrets: any;
	if (fs.existsSync('.env')) {
		const envFile = fs.readFileSync('.env', 'utf8');
		const envVars = envFile.split('\n').reduce((acc, line) => {
			if (line.trim() !== '' && line.trim()[0] !== '#') {
				const [key, value] = line.split('=');
				acc[key.trim()] = value.trim();
			}
			return acc;
		}, {});
		secrets = envVars;
	} else {
		secrets = process.env;
	}

	return secrets;
}
