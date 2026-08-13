// Screener query — one query for stocks and REITs, with the "Atual" (latest)
// indicator row and the current quote joined in. Filters are applied in SQL
// where possible; the rest (derived strategy fields, scoring) happens in JS.

import { and, eq, gte, ilike, inArray, isNotNull, lte, or, type SQL } from 'drizzle-orm';
import type { getDb } from '$lib/server/db';
import { assets, fiiIndicators, indicators, quotes } from '$lib/server/db/schema';
import type { ScreenerFilters, ScreenerRow } from './types';

type Db = ReturnType<typeof getDb>;

// Indicator range filters that map to the stock indicators table.
const STOCK_RANGE_COLUMNS = {
	p_l: indicators.p_l,
	p_vp: indicators.p_vp,
	roe: indicators.roe,
	netMargin: indicators.netMargin,
	dy12m: indicators.dy12m,
	dy5y: indicators.dy5y,
	growthNetProfit5y: indicators.growthNetProfit5y,
	growthNetRevenue5y: indicators.growthNetRevenue5y,
	grossDebtNetWorth: indicators.grossDebtNetWorth,
	lpa: indicators.lpa,
	vpa: indicators.vpa,
	payout: indicators.payout
} as const;

// REIT range filters map to the fii_indicators table.
const FII_RANGE_COLUMNS = {
	fiiPvP: fiiIndicators.p_vp,
	fiiDy: fiiIndicators.dividendYield,
	fiiNetWorth: fiiIndicators.netWorth
} as const;

export async function queryScreener(db: Db, filters: ScreenerFilters): Promise<ScreenerRow[]> {
	const types = filters.types?.length ? filters.types : (['acao', 'fii'] as const);

	// Watchlist join is omitted here (the page layer adds membership) — keep
	// the query single-purpose.
	const rows = await db
		.select({
			id: assets.id,
			ticker: assets.ticker,
			type: assets.type,
			name: assets.name,
			sector: assets.sector,
			price: quotes.price,
			// stocks
			p_l: indicators.p_l,
			p_vp: indicators.p_vp,
			roe: indicators.roe,
			netMargin: indicators.netMargin,
			dy12m: indicators.dy12m,
			dy5y: indicators.dy5y,
			growthNetProfit5y: indicators.growthNetProfit5y,
			growthNetRevenue5y: indicators.growthNetRevenue5y,
			grossDebtNetWorth: indicators.grossDebtNetWorth,
			lpa: indicators.lpa,
			vpa: indicators.vpa,
			payout: indicators.payout,
			// REITs
			fiiPvP: fiiIndicators.p_vp,
			fiiDy: fiiIndicators.dividendYield,
			fiiNetWorth: fiiIndicators.netWorth
		})
		.from(assets)
		.leftJoin(quotes, eq(quotes.assetId, assets.id))
		.leftJoin(indicators, and(eq(indicators.assetId, assets.id), eq(indicators.year, 'Atual')))
		.leftJoin(fiiIndicators, eq(fiiIndicators.assetId, assets.id))
		.where(and(...buildWhere(filters, types)))
		.orderBy(assets.ticker);

	return rows.map((r) => {
		const row: Omit<
			ScreenerRow,
			'bazinPrice' | 'bazinUpside' | 'grahamPrice' | 'grahamUpside' | 'score' | 'watched'
		> = {
			id: r.id,
			ticker: r.ticker,
			type: r.type as 'acao' | 'fii',
			name: r.name,
			sector: r.sector,
			price: r.price,
			p_l: r.p_l,
			p_vp: r.p_vp,
			roe: r.roe,
			netMargin: r.netMargin,
			dy12m: r.dy12m,
			dy5y: r.dy5y,
			growthNetProfit5y: r.growthNetProfit5y,
			growthNetRevenue5y: r.growthNetRevenue5y,
			grossDebtNetWorth: r.grossDebtNetWorth,
			lpa: r.lpa,
			vpa: r.vpa,
			payout: r.payout,
			fiiPvP: r.fiiPvP,
			fiiDy: r.fiiDy,
			fiiNetWorth: r.fiiNetWorth
		};
		return withDerived(row);
	});
}

function buildWhere(filters: ScreenerFilters, types: readonly ('acao' | 'fii')[]) {
	const conditions: SQL<unknown>[] = [inArray(assets.type, [...types])];

	if (filters.query) {
		const q = `%${filters.query.toLowerCase()}%`;
		const match = or(ilike(assets.ticker, q), ilike(assets.name, q));
		if (match) conditions.push(match);
	}
	if (filters.sectors?.length) {
		conditions.push(inArray(assets.sector, filters.sectors));
	}
	if (filters.segments?.length) {
		conditions.push(inArray(assets.sector, filters.segments));
	}

	// Stock ranges only apply to stocks; REIT ranges only to REITs. A filter on
	// the other class's field is dropped silently.
	for (const [key, column] of Object.entries(STOCK_RANGE_COLUMNS)) {
		const range = filters.ranges?.[key];
		if (!range) continue;
		if (range.min != null) conditions.push(gte(column, range.min));
		if (range.max != null) conditions.push(lte(column, range.max));
	}
	for (const [key, column] of Object.entries(FII_RANGE_COLUMNS)) {
		const range = filters.ranges?.[key];
		if (!range) continue;
		if (range.min != null) conditions.push(gte(column, range.min));
		if (range.max != null) conditions.push(lte(column, range.max));
	}

	return conditions;
}

// Computes the derived strategy fields (Bazin/Graham fair price + upside) from
// the base data, so the screener can sort/filter by them without the
// investidor10 endpoint that would normally serve them.
function withDerived(
	row: Omit<
		ScreenerRow,
		'bazinPrice' | 'bazinUpside' | 'grahamPrice' | 'grahamUpside' | 'score' | 'watched'
	>
): ScreenerRow {
	const price = row.price ?? null;
	const result: ScreenerRow = {
		...row,
		bazinPrice: null,
		bazinUpside: null,
		grahamPrice: null,
		grahamUpside: null,
		score: null,
		watched: false
	};

	// Bazin: fair price = annual dividend / 6% yield. Annual dividend from the
	// trailing DY and the price.
	if (price && row.dy12m != null && row.dy12m > 0) {
		const annualDividend = (price * row.dy12m) / 100;
		const fair = annualDividend / 0.06;
		result.bazinPrice = round2(fair);
		result.bazinUpside = price > 0 ? round2((fair / price - 1) * 100) : null;
	}

	// Graham number: sqrt(22.5 * lpa * vpa).
	if (row.lpa != null && row.vpa != null && row.lpa > 0 && row.vpa > 0) {
		const fair = Math.sqrt(22.5 * row.lpa * row.vpa);
		result.grahamPrice = round2(fair);
		result.grahamUpside = price && price > 0 ? round2((fair / price - 1) * 100) : null;
	}

	return result;
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

// The distinct sectors (stocks) and segments (REITs) available, for the filter
// dropdowns. Both are stored on assets.sector — stocks put the B3 sector
// there, REITs put the fund segment (from the comparator).
export async function querySectorOptions(
	db: Db
): Promise<{ sectors: string[]; segments: string[] }> {
	const sectors = await db
		.select({ value: assets.sector })
		.from(assets)
		.where(and(isNotNull(assets.sector), eq(assets.type, 'acao')))
		.groupBy(assets.sector);
	const segments = await db
		.select({ value: assets.sector })
		.from(assets)
		.where(and(isNotNull(assets.sector), eq(assets.type, 'fii')))
		.groupBy(assets.sector);

	return {
		sectors: sectors.map((r) => r.value as string).sort(),
		segments: segments.map((r) => r.value as string).sort()
	};
}
