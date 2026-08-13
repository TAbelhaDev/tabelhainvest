import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getWatchlistAssetsWithData } from '$lib/server/db/watchlist';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.userId) redirect(303, '/login');

	const db = getDb(platform!.env.DB);
	const rows = await getWatchlistAssetsWithData(db, locals.userId);

	return { rows };
};
