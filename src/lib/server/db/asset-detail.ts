import { and, desc, eq } from 'drizzle-orm';
import type { getDb } from './index';
import { assets, dividends, fiiIndicators, indicators, quotes } from './schema';

type Db = ReturnType<typeof getDb>;

export interface AssetDetail {
	asset: typeof assets.$inferSelect;
	quote: typeof quotes.$inferSelect | null;
	indicatorRows: (typeof indicators.$inferSelect)[];
	fiiIndicator: typeof fiiIndicators.$inferSelect | null;
	dividendRows: (typeof dividends.$inferSelect)[];
}

export async function getAssetDetail(db: Db, ticker: string): Promise<AssetDetail | null> {
	const [asset] = await db.select().from(assets).where(eq(assets.ticker, ticker));
	if (!asset) return null;

	const [quote, fiiIndicator, indicatorRows, dividendRows] = await Promise.all([
		db.select().from(quotes).where(eq(quotes.assetId, asset.id)).limit(1),
		db.select().from(fiiIndicators).where(eq(fiiIndicators.assetId, asset.id)).limit(1),
		db
			.select()
			.from(indicators)
			.where(and(eq(indicators.assetId, asset.id), eq(indicators.year, 'Atual'))),
		db
			.select()
			.from(dividends)
			.where(eq(dividends.assetId, asset.id))
			.orderBy(desc(dividends.payDate))
			.limit(24)
	]);

	return {
		asset,
		quote: quote[0] ?? null,
		indicatorRows,
		fiiIndicator: fiiIndicator[0] ?? null,
		dividendRows
	};
}
