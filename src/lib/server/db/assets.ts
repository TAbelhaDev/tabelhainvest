import { eq, isNotNull } from 'drizzle-orm';
import type { getDb } from './index';
import { assets } from './schema';

type Db = ReturnType<typeof getDb>;

export async function findAssetByTicker(db: Db, ticker: string) {
	const [row] = await db.select().from(assets).where(eq(assets.ticker, ticker));
	return row ?? null;
}

export async function findAssetById(db: Db, id: string) {
	const [row] = await db.select().from(assets).where(eq(assets.id, id));
	return row ?? null;
}

export async function upsertAsset(
	db: Db,
	input: {
		ticker: string;
		type: string;
		name: string;
		companyId?: number | null;
		tickerId?: number | null;
		sector?: string | null;
		subsector?: string | null;
	}
) {
	const [saved] = await db
		.insert(assets)
		.values({
			ticker: input.ticker,
			type: input.type,
			name: input.name,
			companyId: input.companyId ?? null,
			tickerId: input.tickerId ?? null,
			sector: input.sector ?? null,
			subsector: input.subsector ?? null,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: assets.ticker,
			set: {
				type: input.type,
				name: input.name,
				companyId: input.companyId ?? null,
				tickerId: input.tickerId ?? null,
				sector: input.sector ?? null,
				subsector: input.subsector ?? null,
				updatedAt: new Date()
			}
		})
		.returning();
	return saved;
}

export async function getAllAssets(db: Db) {
	return db.select().from(assets);
}

export async function getAssetsWithIds(db: Db) {
	return db.select().from(assets).where(isNotNull(assets.companyId));
}
