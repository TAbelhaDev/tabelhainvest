import { describe, expect, it } from 'vitest';
import { scoreRows, strategySortKey, STRATEGIES } from './strategies';
import type { ScreenerRow } from './types';

function makeRow(overrides: Partial<ScreenerRow>): ScreenerRow {
	return {
		id: 'x',
		ticker: 'X',
		type: 'acao',
		name: 'X',
		price: 10,
		sector: 's',
		p_l: null,
		p_vp: null,
		roe: null,
		netMargin: null,
		dy12m: null,
		dy5y: null,
		growthNetProfit5y: null,
		growthNetRevenue5y: null,
		grossDebtNetWorth: null,
		lpa: null,
		vpa: null,
		payout: null,
		fiiPvP: null,
		fiiDy: null,
		fiiNetWorth: null,
		bazinPrice: null,
		bazinUpside: null,
		grahamPrice: null,
		grahamUpside: null,
		score: null,
		watched: false,
		...overrides
	};
}

describe('strategySortKey', () => {
	it('ranks top-dy by stock dy12m, falling back to REIT dy', () => {
		const stock = makeRow({ dy12m: 8, fiiDy: null });
		const fii = makeRow({ type: 'fii', dy12m: null, fiiDy: 9 });
		expect(strategySortKey(stock, 'top-dy')).toBe(8);
		expect(strategySortKey(fii, 'top-dy')).toBe(9);
	});

	it('ranks bazin by upside', () => {
		const row = makeRow({ bazinUpside: 40 });
		expect(strategySortKey(row, 'bazin')).toBe(40);
	});

	it('returns -Infinity when the strategy has no data', () => {
		expect(strategySortKey(makeRow({}), 'bazin')).toBe(-Infinity);
	});

	it('exposes the three strategies', () => {
		expect(Object.keys(STRATEGIES)).toEqual(['bazin', 'graham', 'top-dy']);
	});
});

describe('scoreRows', () => {
	it('scores higher values better for positive weights', () => {
		const a = makeRow({ id: 'a', dy12m: 10, roe: 30 });
		const b = makeRow({ id: 'b', dy12m: 2, roe: 5 });
		const scores = scoreRows([a, b], { dy12m: 1, roe: 1 });
		expect(scores.get('a')!).toBeGreaterThan(scores.get('b')!);
	});

	it('scores lower values better for negative weights', () => {
		const a = makeRow({ id: 'a', p_l: 5 });
		const b = makeRow({ id: 'b', p_l: 50 });
		const scores = scoreRows([a, b], { p_l: -1 });
		expect(scores.get('a')!).toBeGreaterThan(scores.get('b')!);
	});

	it('produces scores within 0-100', () => {
		const rows = [1, 2, 3, 4, 5].map((n) => makeRow({ id: String(n), dy12m: n * 3 }));
		const scores = scoreRows(rows);
		for (const v of scores.values()) {
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThanOrEqual(100);
		}
	});

	it('returns an empty map for no rows', () => {
		expect(scoreRows([]).size).toBe(0);
	});

	it('ignores rows without the indicator', () => {
		const a = makeRow({ id: 'a', dy12m: 10 });
		const b = makeRow({ id: 'b', dy12m: 2 });
		const c = makeRow({ id: 'c', dy12m: null });
		const scores = scoreRows([a, b, c], { dy12m: 1 });
		expect(scores.has('a')).toBe(true);
		expect(scores.has('b')).toBe(true);
		expect(scores.has('c')).toBe(false);
	});
});
