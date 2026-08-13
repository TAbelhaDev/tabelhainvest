import { eq } from 'drizzle-orm';
import type { getDb } from './index';
import { fiiIndicators } from './schema';

type Db = ReturnType<typeof getDb>;

export async function upsertFiiIndicator(
	db: Db,
	input: {
		assetId: string;
		p_vp?: number | null;
		dividendYield?: number | null;
		netWorth?: number | null;
		vacancy?: number | null;
		last12mDividends?: number | null;
	}
) {
	const [saved] = await db
		.insert(fiiIndicators)
		.values({
			assetId: input.assetId,
			p_vp: input.p_vp ?? null,
			dividendYield: input.dividendYield ?? null,
			netWorth: input.netWorth ?? null,
			vacancy: input.vacancy ?? null,
			last12mDividends: input.last12mDividends ?? null,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: fiiIndicators.assetId,
			set: {
				p_vp: input.p_vp ?? null,
				dividendYield: input.dividendYield ?? null,
				netWorth: input.netWorth ?? null,
				vacancy: input.vacancy ?? null,
				last12mDividends: input.last12mDividends ?? null,
				updatedAt: new Date()
			}
		})
		.returning();
	return saved;
}

export async function getFiiIndicator(db: Db, assetId: string) {
	const [row] = await db.select().from(fiiIndicators).where(eq(fiiIndicators.assetId, assetId));
	return row ?? null;
}
