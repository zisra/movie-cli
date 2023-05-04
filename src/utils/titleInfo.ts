import { ofetch } from 'ofetch';
import { MediaType, TitleInfo } from 'provider';

const JW_BASE_URL = 'https://apis.justwatch.com';

export async function getSeason({ id }: { id: number }) {
	const season = await ofetch(
		`${JW_BASE_URL}/content/titles/show_season/${id}/locale/en_US`
	);

	return {
		episodes: season.episodes.map((episode: any) => {
			return {
				title: episode.title,
				number: episode.episode_number,
			};
		}),
	};
}

export async function searchTitles({ query }: { query: string }): Promise<
	{
		title: string;
		year: string;
		imdbID: string;
		type: string;
	}[]
> {
	const searchResults = await ofetch(
		`${JW_BASE_URL}/content/titles/en_US/popular`,
		{
			params: {
				body: JSON.stringify({
					content_types: ['show', 'movie'],
					page: 1,
					query,
					page_size: 40,
				}),
			},
		}
	);

	return searchResults.items.map((item: any) => {
		return {
			title: item.title,
			year: item.original_release_year,
			id: item.id,
			type: item.object_type,
		};
	});
}

export async function titleInfo({
	id,
	type,
}: {
	id: number;
	type: MediaType;
}): Promise<TitleInfo> {
	const title = await ofetch(
		`${JW_BASE_URL}/content/titles/${type}/${id}/locale/en_US`
	);

	return {
		title: title.title,
		year: title.original_release_year,
		id: title.id,
		type: title.object_type,
		imdbID: title.external_ids.find(({ provider }: any) => provider === 'imdb')
			?.external_id,
		tmdbID: title.external_ids.find(({ provider }: any) => provider === 'tmdb')
			?.external_id,
		seasons: title.seasons?.map((season: any) => {
			return {
				id: season.id,
				number: season.season_number,
				title: season.title ?? '',
			};
		}),
	};
}
