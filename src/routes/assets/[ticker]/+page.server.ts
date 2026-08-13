import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAssetDetail } from '$lib/server/db/asset-detail';
import {
	getWatchlistAssetIdsByUser,
	addToWatchlist,
	removeFromWatchlist
} from '$lib/server/db/watchlist';
import {
	fetchStockPriceSeries,
	fetchFiiPriceSeries,
	type PriceSeriesPoint
} from '$lib/server/investidor10/indicators';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	if (!locals.userId) redirect(303, '/login');

	const db = getDb(platform!.env.DB);
	const detail = await getAssetDetail(db, params.ticker.toUpperCase());
	if (!detail) error(404, 'Ativo não encontrado');

	const watchedIds = await getWatchlistAssetIdsByUser(db, locals.userId);

	// Price series for the chart — one year of daily closes.
	let priceSeries: PriceSeriesPoint[] = [];
	try {
		const series =
			detail.asset.type === 'acao'
				? await fetchStockPriceSeries(detail.asset.ticker)
				: await fetchFiiPriceSeries(detail.asset.companyId!);
		priceSeries = series.real;
	} catch (err) {
		// The chart is best-effort; a failure here should not kill the page.
		console.error(`[asset] falha na série de preços de ${params.ticker}`, {
			error: err instanceof Error ? err.message : String(err)
		});
	}

	return {
		asset: detail.asset,
		quote: detail.quote,
		indicator: detail.indicatorRows[0] ?? null,
		fiiIndicator: detail.fiiIndicator,
		dividends: detail.dividendRows,
		priceSeries: priceSeries.map((p) => ({ price: p.price, date: p.created_at })),
		watched: watchedIds.has(detail.asset.id)
	};
};

export const actions: Actions = {
	toggleWatch: async ({ locals, platform, params }) => {
		if (!locals.userId) redirect(303, '/login');
		const db = getDb(platform!.env.DB);
		const detail = await getAssetDetail(db, params.ticker.toUpperCase());
		if (!detail) return { error: 'Ativo não encontrado.' };

		const watchedIds = await getWatchlistAssetIdsByUser(db, locals.userId);
		if (watchedIds.has(detail.asset.id)) {
			await removeFromWatchlist(db, locals.userId, detail.asset.id);
		} else {
			await addToWatchlist(db, locals.userId, detail.asset.id);
		}
		return { ok: true };
	}
};
