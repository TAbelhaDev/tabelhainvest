// Daily data refresh (PLANO.md §Cron).
//
// Runs from the worker `scheduled` handler (worker/entry.js). Steps:
//
//   1. Sync the universe from the sitemaps, discovering new assets.
//   2. Bootstrap ids for assets that have none (one page fetch each).
//   3. Refresh quotes in batches (no ids needed).
//   4. Refresh stock indicators (needs ticker_id) and REIT indicators (needs
//      company_id) for every asset that has the ids.
//
// `limit` caps how many assets each step touches — useful for a manual
// first-run in batches (dev route /api/dev/refresh?limit=...) and for tests.
// The investidor10 API is undocumented; every failure is logged and skipped so
// one broken asset never fails the whole refresh. Requests are throttled with
// a small delay between calls to stay polite.

import { getDb } from '$lib/server/db';
import { getAllAssets, upsertAsset } from '$lib/server/db/assets';
import { upsertQuote } from '$lib/server/db/quotes';
import {
	upsertStockIndicator,
	mapIndicatorKeyToColumn,
	type StockIndicatorValues
} from '$lib/server/db/indicators';
import { upsertFiiIndicator } from '$lib/server/db/fii-indicators';
import { insertDividend, clearDividendsByAsset } from '$lib/server/db/dividends';
import { fetchUniverse } from './universe';
import { fetchAssetMeta } from './asset-meta';
import { fetchQuotes } from './quotes';
import { fetchIndicatorHistory } from './indicators';
import { fetchFiiComparator, fetchFiiDividends } from './fii';

const THROTTLE_MS = 250;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttled<T>(fn: () => Promise<T>): Promise<T> {
	const result = await fn();
	await sleep(THROTTLE_MS);
	return result;
}

// Maps the "Atual"/year history into the StockIndicatorValues shape for one
// year. Returns null when no column was filled for that year.
function buildIndicatorValues(
	history: Record<string, { year: string; key: string; value: number | string }[]>,
	year: string
): StockIndicatorValues | null {
	const values: StockIndicatorValues = {};
	for (const points of Object.values(history)) {
		const point = points.find((p) => p.year === year);
		if (!point) continue;
		// investidor10 returns "-" (string) for indicators without data.
		const num = typeof point.value === 'number' ? point.value : Number(point.value);
		if (!Number.isFinite(num)) continue;
		const column = mapIndicatorKeyToColumn(point.key);
		if (column) values[column] = num;
	}
	if (Object.keys(values).length === 0) return null;
	return values;
}

async function syncUniverse(db: ReturnType<typeof getDb>, limit?: number): Promise<number> {
	let discovered = 0;
	const existing = new Set((await getAllAssets(db)).map((a) => a.ticker));
	const universe = fetchUniverse();
	const todo = (await universe).filter((a) => !existing.has(a.ticker)).slice(0, limit);

	for (const asset of todo) {
		try {
			// Bootstrap the numeric ids from the asset page. If this fails (404,
			// network), the asset stays undiscovered and is retried next run.
			const meta = await throttled(() => fetchAssetMeta(asset.ticker, asset.type));
			await upsertAsset(db, {
				ticker: asset.ticker,
				type: asset.type,
				name: meta.name,
				companyId: meta.companyId,
				tickerId: meta.tickerId,
				sector: meta.sector,
				subsector: meta.subsector
			});
			existing.add(asset.ticker);
			discovered += 1;
		} catch (err) {
			console.error(`[refresh] falha no bootstrap de ${asset.ticker}`, {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}
	return discovered;
}

async function syncQuotes(db: ReturnType<typeof getDb>): Promise<number> {
	const assets = await getAllAssets(db);
	const tickers = assets.map((a) => a.ticker);
	const tickerToId = new Map(assets.map((a) => [a.ticker, a.id]));

	// Each chunk is throttled (the batch endpoint is rate-limited too), and a
	// failed chunk is logged and skipped — one 429 must not drop every quote.
	let updated = 0;
	for (let i = 0; i < tickers.length; i += 10) {
		const chunk = tickers.slice(i, i + 10);
		try {
			const quotes = await throttled(() => fetchQuotes(chunk));
			for (const [ticker, quote] of Object.entries(quotes)) {
				const assetId = tickerToId.get(ticker);
				if (!assetId || !quote.price) continue;
				await upsertQuote(db, { assetId, price: quote.price });
				updated += 1;
			}
		} catch (err) {
			console.error(`[refresh] falha no lote de cotações ${chunk.join(',')}`, {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}
	return updated;
}

async function syncStockIndicators(db: ReturnType<typeof getDb>, limit?: number): Promise<number> {
	const assets = (await getAllAssets(db))
		.filter((a) => a.type === 'acao' && a.tickerId)
		.slice(0, limit);
	let updated = 0;

	for (const asset of assets) {
		try {
			const history = await throttled(() => fetchIndicatorHistory(asset.tickerId!));
			const years = [
				...new Set(
					Object.values(history)
						.flat()
						.map((p) => p.year)
				)
			];
			for (const year of years) {
				const values = buildIndicatorValues(history, year);
				if (!values) continue;
				await upsertStockIndicator(db, {
					assetId: asset.id,
					year,
					values
				});
				updated += 1;
			}
		} catch (err) {
			console.error(`[refresh] falha nos indicadores de ${asset.ticker}`, {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}
	return updated;
}

async function syncFiiIndicators(db: ReturnType<typeof getDb>, limit?: number): Promise<number> {
	const assets = (await getAllAssets(db))
		.filter((a) => a.type === 'fii' && a.companyId)
		.slice(0, limit);
	let updated = 0;

	for (const asset of assets) {
		try {
			const data = await throttled(() => fetchFiiComparator(asset.companyId!));
			const item = data.data?.[0];
			if (!item) continue;

			await upsertFiiIndicator(db, {
				assetId: asset.id,
				p_vp: item.p_vp,
				dividendYield: item.dividend_yield,
				netWorth: item.net_worth
			});
			// The comparator also carries the segment/type — keep them on the
			// asset for filtering.
			if (item.full_name || item.segment) {
				await upsertAsset(db, {
					ticker: asset.ticker,
					type: asset.type,
					name: item.full_name || asset.name,
					companyId: asset.companyId,
					tickerId: asset.tickerId,
					sector: item.segment_short || asset.sector,
					subsector: item.segment || asset.subsector
				});
			}
			updated += 1;
		} catch (err) {
			console.error(`[refresh] falha nos indicadores FII de ${asset.ticker}`, {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}
	return updated;
}

async function syncFiiDividends(db: ReturnType<typeof getDb>, limit?: number): Promise<number> {
	const assets = (await getAllAssets(db))
		.filter((a) => a.type === 'fii' && a.companyId)
		.slice(0, limit);
	let updated = 0;

	for (const asset of assets) {
		try {
			const dividends = await throttled(() => fetchFiiDividends(asset.companyId!));
			// The endpoint returns the recent monthly payments — replace the
			// asset's stored ones instead of accumulating (avoids duplicates,
			// and keeps the dedupe independent of date parsing).
			await clearDividendsByAsset(db, asset.id);
			for (const div of dividends) {
				const [month, year] = div.created_at.split('/');
				const payDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : null;
				await insertDividend(db, {
					assetId: asset.id,
					payDate,
					value: div.price,
					type: 'rendimento'
				});
				updated += 1;
			}
		} catch (err) {
			console.error(`[refresh] falha nos proventos de ${asset.ticker}`, {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}
	return updated;
}

export async function refreshInvestidor10(env: Env, limit?: number): Promise<void> {
	const db = getDb(env.DB);

	const stats = {
		discovered: await syncUniverse(db, limit),
		quotes: await syncQuotes(db),
		stockIndicators: await syncStockIndicators(db, limit),
		fiiIndicators: await syncFiiIndicators(db, limit),
		fiiDividends: await syncFiiDividends(db, limit)
	};
	console.log('[refresh] sync completo', stats);
}
