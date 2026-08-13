// Screening strategies and rule-based scoring.
//
// Two layers of "recommendation" (PLANO.md §Screener):
//
//   1. Ready-made strategies — named presets that rank the filtered rows by a
//      classic rule: Bazin (fair price from 6% dividend yield), Graham (Graham
//      number) and top dividend yield.
//
//   2. Rule-based scoring — a weighted sum of indicators, deterministic and
//      transparent. Weights are positive for "good when high" indicators and
//      negative for "good when low" ones.

import type { ScreenerRow } from './types';

export type StrategyId = 'bazin' | 'graham' | 'top-dy';

export const STRATEGIES: Record<StrategyId, { label: string; description: string }> = {
	bazin: {
		label: 'Bazin',
		description: 'Preço justo por dividendos (retorno de 6% ao ano).'
	},
	graham: {
		label: 'Graham',
		description: 'Preço justo pelo Graham number (lucro × valor patrimonial).'
	},
	'top-dy': {
		label: 'Top dividend yield',
		description: 'Os maiores dividend yields dos últimos 12 meses.'
	}
};

// Sort key per strategy — returns the field used for ranking. Higher is better.
export function strategySortKey(row: ScreenerRow, strategy: StrategyId): number {
	switch (strategy) {
		case 'bazin':
			return row.bazinUpside ?? -Infinity;
		case 'graham':
			return row.grahamUpside ?? -Infinity;
		case 'top-dy':
			// Stocks use trailing DY; REITs use their own DY.
			return row.dy12m ?? row.fiiDy ?? -Infinity;
	}
}

// Whether the strategy needs the derived fair-price fields (i.e. only applies
// to stocks). Top-DY applies to both classes.
export function strategyAppliesTo(strategy: StrategyId, row: ScreenerRow): boolean {
	if (strategy === 'top-dy') return row.dy12m != null || row.fiiDy != null;
	return row.bazinUpside != null || row.grahamUpside != null;
}

// Default scoring weights. Keyed by the row field; positive = higher is better,
// negative = lower is better. The user can override per filter.
export const DEFAULT_SCORING: Record<string, number> = {
	dy12m: 2,
	roe: 1.5,
	growthNetProfit5y: 1.5,
	p_l: -1,
	p_vp: -0.5,
	grossDebtNetWorth: -0.5
};

// Normalized score 0-100 for one row under the given weights. Each indicator is
// min-max normalized across the rows that have it, then weighted and summed.
export function scoreRows(
	rows: ScreenerRow[],
	weights: Record<string, number> = DEFAULT_SCORING
): Map<string, number> {
	const scores = new Map<string, number>();
	if (rows.length === 0) return scores;

	for (const [field, weight] of Object.entries(weights)) {
		const values = rows
			.map((row) => ({ row, value: row[field as keyof ScreenerRow] as number | null }))
			.filter(
				(v): v is { row: ScreenerRow; value: number } => v.value != null && Number.isFinite(v.value)
			);
		if (values.length < 2) continue;

		const min = Math.min(...values.map((v) => v.value));
		const max = Math.max(...values.map((v) => v.value));
		const span = max - min;
		if (span === 0) continue;

		for (const { row, value } of values) {
			// Normalize to 0-1 (high = 1). The weight's sign carries the
			// direction: positive weights reward high values, negative weights
			// reward low values (a low p_l is good, so p_l: -1 × normalized 0 → 0,
			// vs a high p_l → -1).
			const normalized = (value - min) / span;
			const contribution = weight * normalized;
			scores.set(row.id, (scores.get(row.id) ?? 0) + contribution);
		}
	}

	// Scale to 0-100 over the actual scores.
	const entries = [...scores.entries()].filter(([, v]) => Number.isFinite(v));
	const min = Math.min(...entries.map(([, v]) => v));
	const max = Math.max(...entries.map(([, v]) => v));
	const span = max - min || 1;
	for (const [id, v] of entries) {
		scores.set(id, Math.round(((v - min) / span) * 100));
	}
	return scores;
}
