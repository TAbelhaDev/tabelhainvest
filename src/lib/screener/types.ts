// Screener filter model — the shape the screener page builds and the server
// uses to query. Serialized as JSON in saved_filters (PLANO.md §Modelo de
// dados), so every field here must be JSON-serializable.

export type AssetClass = 'acao' | 'fii';

// A numeric range on one indicator. Both bounds optional.
export interface RangeFilter {
	min?: number | null;
	max?: number | null;
}

// The screener row the page renders — one per asset, with the union of stock
// and REIT indicators flattened (columns a given asset class does not use are
// null).
export interface ScreenerRow {
	id: string;
	ticker: string;
	type: AssetClass;
	name: string;
	price: number | null;
	sector: string | null;
	// stocks
	p_l: number | null;
	p_vp: number | null;
	roe: number | null;
	netMargin: number | null;
	dy12m: number | null;
	dy5y: number | null;
	growthNetProfit5y: number | null;
	growthNetRevenue5y: number | null;
	grossDebtNetWorth: number | null;
	lpa: number | null;
	vpa: number | null;
	payout: number | null;
	// REITs
	fiiPvP: number | null;
	fiiDy: number | null;
	fiiNetWorth: number | null;
	// derived (strategies)
	bazinPrice: number | null;
	bazinUpside: number | null;
	grahamPrice: number | null;
	grahamUpside: number | null;
	// rule-based scoring (only when a scoring config is active)
	score: number | null;
	// watchlist membership (user stars it)
	watched: boolean;
}

export interface ScreenerFilters {
	types: AssetClass[];
	// indicator ranges — keyed by the row field name above.
	ranges: Record<string, RangeFilter>;
	// multi-select on sector (stocks) and fii segment. Empty = all.
	sectors: string[];
	segments: string[];
	// search across ticker/name
	query: string;
	// optional scoring weights, e.g. { dy12m: 2, p_l: -1, roe: 1 }
	scoring: Record<string, number> | null;
}
