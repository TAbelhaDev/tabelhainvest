// Stock indicators — the history endpoint gives every fundamental indicator
// per year for one stock (PLANO.md §Endpoints). We store the "Atual" (latest)
// year plus the last few closed years.

import { getJson } from './client';
import type { IndicatorHistory, PayoutChart } from './types';

const YEARS = 5;

export async function fetchIndicatorHistory(tickerId: number): Promise<IndicatorHistory> {
	return getJson<IndicatorHistory>(`/api/historico-indicadores/${tickerId}/${YEARS}/?v=2`);
}

export async function fetchPayoutChart(
	companyId: number,
	tickerId: number,
	ticker: string
): Promise<PayoutChart> {
	return getJson<PayoutChart>(
		`/api/acoes/payout-chart/${companyId}/${tickerId}/${ticker.toLowerCase()}/${YEARS}`
	);
}

// Price series — one year of daily closing prices. The endpoint returns three
// currencies; we use `real`.
export interface PriceSeriesPoint {
	price: number;
	created_at: string; // 'DD/MM/YYYY HH:MM'
}
export interface PriceSeries {
	real: PriceSeriesPoint[];
	dolar: PriceSeriesPoint[];
	euro: PriceSeriesPoint[];
}

export async function fetchStockPriceSeries(ticker: string): Promise<PriceSeries> {
	return getJson<PriceSeries>(`/api/cotacoes/acao/chart/${ticker.toLowerCase()}/`);
}

export async function fetchFiiPriceSeries(companyId: number): Promise<PriceSeries> {
	return getJson<PriceSeries>(`/api/fii/cotacoes/chart/${companyId}/`);
}
