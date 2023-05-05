export interface TitleInfo {
	title: string;
	year: number;
	id: number;
	type: MediaType;
	imdbID?: string;
	tmdbID?: string;
	seasons: {
		id: number;
		number: number;
		title: string;
	}[];
	season?: number;
	episode?: number;
	episodeTitle: string;
}

export type Progress = (updatedProgress: number) => void;

export enum MediaType {
	MOVIE = 'movie',
	SHOW = 'show',
}

export interface Provider {
	name: string;
	rank: number;
	disabled: boolean;
	only?: boolean;
	types: MediaType[];
	execute: ({
		titleInfo,
		setProgress,
	}: {
		titleInfo: TitleInfo;
		setProgress: Progress;
	}) => Promise<{ quality: number | string; url: string }[]>;
}

const providers = [] as Provider[];

export function registerProvider(provider: Provider) {
	providers.push(provider);
}

export function getProviders() {
	return providers;
}
