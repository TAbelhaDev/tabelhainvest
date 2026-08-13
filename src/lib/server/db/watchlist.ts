import { and, eq } from 'drizzle-orm';
import type { getDb } from './index';
import { assets, quotes, watchlist } from './schema';

type Db = ReturnType<typeof getDb>;

// All asset ids the user has starred, as a Set for in-memory membership checks.
export async function getWatchlistAssetIdsByUser(db: Db, userId: string): Promise<Set<string>> {
	const rows = await db
		.select({ assetId: watchlist.assetId })
		.from(watchlist)
		.where(eq(watchlist.userId, userId));
	return new Set(rows.map((r) => r.assetId));
}

// The starred assets with their latest quote, for the watchlist page.
export async function getWatchlistAssetsWithData(db: Db, userId: string) {
	return db
		.select({
			id: assets.id,
			ticker: assets.ticker,
			type: assets.type,
			name: assets.name,
			sector: assets.sector,
			price: quotes.price
		})
		.from(watchlist)
		.innerJoin(assets, eq(assets.id, watchlist.assetId))
		.leftJoin(quotes, eq(quotes.assetId, assets.id))
		.where(eq(watchlist.userId, userId))
		.orderBy(assets.ticker);
}

export async function addToWatchlist(db: Db, userId: string, assetId: string) {
	await db
		.insert(watchlist)
		.values({ userId, assetId, createdAt: new Date() })
		.onConflictDoNothing({ target: [watchlist.userId, watchlist.assetId] });
}

export async function removeFromWatchlist(db: Db, userId: string, assetId: string) {
	await db
		.delete(watchlist)
		.where(and(eq(watchlist.userId, userId), eq(watchlist.assetId, assetId)));
}
