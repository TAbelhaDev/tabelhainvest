import { and, desc, eq } from 'drizzle-orm';
import type { getDb } from './index';
import { savedFilters } from './schema';

type Db = ReturnType<typeof getDb>;

export async function getSavedFiltersByUser(db: Db, userId: string) {
	return db
		.select()
		.from(savedFilters)
		.where(eq(savedFilters.userId, userId))
		.orderBy(desc(savedFilters.createdAt));
}

export async function findSavedFilter(db: Db, userId: string, id: string) {
	const [row] = await db
		.select()
		.from(savedFilters)
		.where(and(eq(savedFilters.id, id), eq(savedFilters.userId, userId)));
	return row ?? null;
}

export async function insertSavedFilter(
	db: Db,
	input: { userId: string; name: string; filterJson: string }
) {
	const [saved] = await db
		.insert(savedFilters)
		.values({
			userId: input.userId,
			name: input.name,
			filterJson: input.filterJson,
			updatedAt: new Date()
		})
		.returning();
	return saved;
}

export async function deleteSavedFilter(db: Db, userId: string, id: string) {
	await db.delete(savedFilters).where(eq(savedFilters.id, id));
}
