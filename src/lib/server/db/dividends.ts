import { eq } from 'drizzle-orm';
import type { getDb } from './index';
import { dividends } from './schema';

type Db = ReturnType<typeof getDb>;

export interface DividendInput {
	assetId: string;
	exDate?: Date | null;
	payDate?: Date | null;
	value?: number | null;
	type?: string | null;
}

// Insert a dividend payment, ignoring duplicates. Dedupe happens on
// (asset_id, ex_date, value) — a payment with the same date and amount is
// already stored.
export async function insertDividend(db: Db, input: DividendInput) {
	await db
		.insert(dividends)
		.values({
			assetId: input.assetId,
			exDate: input.exDate ?? null,
			payDate: input.payDate ?? null,
			value: input.value ?? null,
			type: input.type ?? null,
			updatedAt: new Date()
		})
		.onConflictDoNothing({ target: [dividends.assetId, dividends.exDate, dividends.value] });
}

export async function getDividendsByAsset(db: Db, assetId: string) {
	return db
		.select()
		.from(dividends)
		.where(eq(dividends.assetId, assetId))
		.orderBy(dividends.payDate);
}

export async function clearDividendsByAsset(db: Db, assetId: string) {
	await db.delete(dividends).where(eq(dividends.assetId, assetId));
}
