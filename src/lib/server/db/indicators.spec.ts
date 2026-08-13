import { describe, expect, it } from 'vitest';
import { mapIndicatorKeyToColumn } from './indicators';

describe('mapIndicatorKeyToColumn', () => {
	it('maps investidor10 keys onto the schema columns', () => {
		expect(mapIndicatorKeyToColumn('p_l')).toBe('p_l');
		expect(mapIndicatorKeyToColumn('p_vp')).toBe('p_vp');
		expect(mapIndicatorKeyToColumn('roe')).toBe('roe');
		expect(mapIndicatorKeyToColumn('net_margin')).toBe('netMargin');
		expect(mapIndicatorKeyToColumn('dividend_yield_last_12_months')).toBe('dy12m');
		expect(mapIndicatorKeyToColumn('dividend_yield_last_5_years')).toBe('dy5y');
		expect(mapIndicatorKeyToColumn('bazin_price')).toBe('bazinPrice');
		expect(mapIndicatorKeyToColumn('graham_price')).toBe('grahamPrice');
		expect(mapIndicatorKeyToColumn('growth_net_profit_last_5_years')).toBe('growthNetProfit5y');
		expect(mapIndicatorKeyToColumn('net_worth')).toBe('netWorth');
		expect(mapIndicatorKeyToColumn('net_revenue')).toBe('netRevenue');
		expect(mapIndicatorKeyToColumn('enterprise_value')).toBe('enterpriseValue');
	});

	it('returns null for keys the screener does not use', () => {
		expect(mapIndicatorKeyToColumn('psr')).toBeNull();
		expect(mapIndicatorKeyToColumn('roa')).toBeNull();
		expect(mapIndicatorKeyToColumn('active_turns')).toBeNull();
		expect(mapIndicatorKeyToColumn('unknown')).toBeNull();
	});
});
