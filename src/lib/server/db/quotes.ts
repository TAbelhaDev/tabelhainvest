import { eq } from 'drizzle-orm';
import type { getDb } from './index';
import { quotes } from './schema';

type Db = ReturnType<typeof getDb>;

export async function upsertQuote(
	db: Db,
	input: {
		assetId: string;
		price: number;
		variation30d?: number | null;
		variation12m?: number | null;
		variation5y?: number | null;
		lastUpdate?: Date;
	}
) {
	const [saved] = await db
		.insert(quotes)
		.values({
			assetId: input.assetId,
			price: input.price,
			variation30d: input.variation30d ?? null,
			variation12m: input.variation12m ?? null,
			variation5y: input.variation5y ?? null,
			lastUpdate: input.lastUpdate ?? new Date()
		})
		.onConflictDoUpdate({
			target: quotes.assetId,
			set: {
				price: input.price,
				variation30d: input.variation30d ?? null,
				variation12m: input.variation12m ?? null,
				variation5y: input.variation5y ?? null,
				lastUpdate: input.lastUpdate ?? new Date()
			}
		})
		.returning();
	return saved;
}

export async function getQuoteByAsset(db: Db, assetId: string) {
	const [row] = await db.select().from(quotes).where(eq(quotes.assetId, assetId));
	return row ?? null;
}
