// Quotes — the real-time price endpoint works in batches by ticker symbol, so
// it needs no numeric ids and covers every asset class at once (PLANO.md
// §Endpoints). The batch is the cheapest source for the price column.

import { getJson } from './client';
import type { BatchQuotes } from './types';

// The batch endpoint silently caps at 10 tickers per request (11+ returns the
// first 10). Tested 2026-08-12 — 30 tickers returned 10, 12 returned 10.
const CHUNK_SIZE = 10;

export async function fetchQuotes(tickers: string[]): Promise<BatchQuotes> {
	const out: BatchQuotes = {};
	for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
		const chunk = tickers.slice(i, i + CHUNK_SIZE);
		const quotes = await getJson<BatchQuotes>(`/api/cotacoes/batch?tickers=${chunk.join(',')}`);
		Object.assign(out, quotes);
	}
	return out;
}
