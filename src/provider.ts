export interface Provider {
	name: string;
	rank: number;
	disabled: boolean;
	only?: boolean;
	types: ('movie' | 'series')[];
	execute: ({
		movieInfo,
		setProgress,
	}: {
		movieInfo: {
			name: string;
			type: 'movie' | 'series';
			year: number;
			imdbID: string;
			season?: number;
			episode?: number;
		};
		setProgress: () => void;
	}) => Promise<
		{
			quality: number;
			url: string;
		}[]
	>;
}

const providers = [] as Provider[];

export function registerProvider(provider: Provider) {
	providers.push(provider);
}

export function getProviders() {
	return providers;
}
