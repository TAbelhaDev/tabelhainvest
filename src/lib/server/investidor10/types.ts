// Typed shapes for investidor10's internal API responses (PLANO.md §Endpoints).
// These mirror the JSON returned by the endpoints consumed in refresh.ts.

// GET /api/cotacoes/batch?tickers=A,B,C
export type BatchQuotes = Record<string, { price: number; last_update: string | null }>;

// GET /api/historico-indicadores/{tickerId}/{years}/?v=2
// Keys are the indicator display names ("P/L", "P/VP", "ROE", ...) and each
// value is the history per year, oldest to newest.
export interface IndicatorHistoryPoint {
	year: string; // 'Atual' | '2025' | '2024' ...
	key: string; // canonical key: p_l, p_vp, roe, ...
	value: number;
	type: string;
}
export type IndicatorHistory = Record<string, IndicatorHistoryPoint[]>;

// GET /api/acoes/payout-chart/{companyId}/{tickerId}/{ticker}/{period}/
export interface PayoutChart {
	profitabilityArray: Array<{ year: string; value: number }>;
	payOutCompanyIndicators: Record<string, { value: number; year: string }>;
	dyTickerIndicators: Record<string, { value: number | string; year: string }>;
	years: string[];
}

// GET /api/fii/comparador/table/{companyId}/all/
export interface FiiComparatorItem {
	title: string; // ticker
	full_name: string;
	price: number | null;
	variation_12m: number | null;
	dividend_yield: number | null;
	p_vp: number | null;
	net_worth: number | null;
	segment: string | null;
	segment_short: string | null;
	type: string | null;
	type_key: string | null;
}
export interface FiiComparatorResponse {
	data: FiiComparatorItem[];
}

// GET /api/fii/dividendos/chart/{companyId}/
export interface FiiDividendPoint {
	price: number;
	created_at: string; // '07/2026'
}
