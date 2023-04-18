export interface Provider {
	name: string;
	rank: number;
	disabled: boolean;
	only?: boolean;
	types: ('movie' | 'series')[];
	execute: ({ movieInfo, setProgress }) => Promise<
		[
			{
				quality: number | string;
				url: string;
			}
		]
	>;
}

const providers = [] as Provider[];

export function registerProvider(provider: Provider) {
	providers.push(provider);
}

export function getProviders() {
	return providers;
}
