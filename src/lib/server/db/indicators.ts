import { and, eq } from 'drizzle-orm';
import type { getDb } from './index';
import { indicators } from './schema';

type Db = ReturnType<typeof getDb>;

// The indicator values the screener uses, keyed by the canonical investidor10
// key (p_l, p_vp, roe, net_margin, ...). See PLANO.md §Endpoints.
export interface StockIndicatorValues {
	p_l?: number | null;
	p_vp?: number | null;
	roe?: number | null;
	netMargin?: number | null;
	dy12m?: number | null;
	dy5y?: number | null;
	bazinPrice?: number | null;
	grahamPrice?: number | null;
	bazinUpside?: number | null;
	grahamUpside?: number | null;
	growthNetProfit5y?: number | null;
	growthNetRevenue5y?: number | null;
	netWorth?: number | null;
	netRevenue?: number | null;
	netProfit?: number | null;
	enterpriseValue?: number | null;
	grossDebtNetWorth?: number | null;
	lpa?: number | null;
	vpa?: number | null;
	payout?: number | null;
}

// Maps the investidor10 canonical key to the schema column (and back).
const KEY_TO_COLUMN: Record<string, keyof StockIndicatorValues | null> = {
	p_l: 'p_l',
	p_vp: 'p_vp',
	roe: 'roe',
	net_margin: 'netMargin',
	dividend_yield_last_12_months: 'dy12m',
	dividend_yield_last_5_years: 'dy5y',
	bazin_price: 'bazinPrice',
	graham_price: 'grahamPrice',
	bazin_upside: 'bazinUpside',
	graham_upside: 'grahamUpside',
	growth_net_profit_last_5_years: 'growthNetProfit5y',
	growth_net_revenue_last_5_years: 'growthNetRevenue5y',
	net_worth: 'netWorth',
	net_revenue: 'netRevenue',
	net_profit: 'netProfit',
	enterprise_value: 'enterpriseValue',
	gross_debt_net_worth: 'grossDebtNetWorth',
	lpa: 'lpa',
	vpa: 'vpa',
	payout: 'payout'
};

export function mapIndicatorKeyToColumn(key: string): keyof StockIndicatorValues | null {
	return KEY_TO_COLUMN[key] ?? null;
}

export async function upsertStockIndicator(
	db: Db,
	input: {
		assetId: string;
		year: string;
		values: StockIndicatorValues;
	}
) {
	const [saved] = await db
		.insert(indicators)
		.values({
			assetId: input.assetId,
			year: input.year,
			...input.values,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: [indicators.assetId, indicators.year],
			set: {
				...input.values,
				updatedAt: new Date()
			}
		})
		.returning();
	return saved;
}

export async function getIndicatorByAssetYear(db: Db, assetId: string, year: string) {
	const [row] = await db
		.select()
		.from(indicators)
		.where(and(eq(indicators.assetId, assetId), eq(indicators.year, year)));
	return row ?? null;
}
