export interface MovieInfo {
	title: string;
	type: 'movie' | 'series';
	year: number;
	imdbID: string;
	season?: number;
	episode?: number;
}

export type Progress = (updatedProgress: number) => void;

export enum MediaType {
	MOVIE = 'movie',
	SERIES = 'series',
}

export interface Provider {
	name: string;
	rank: number;
	disabled: boolean;
	only?: boolean;
	types: MediaType[];
	execute: ({
		movieInfo,
		setProgress,
	}: {
		movieInfo: MovieInfo;
		setProgress: (updatedProgress: number) => void;
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
