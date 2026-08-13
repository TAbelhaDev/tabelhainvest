import { eq } from 'drizzle-orm';
import type { getDb } from './index';
import { users } from './schema';

type Db = ReturnType<typeof getDb>;

export async function findUserByEmail(db: Db, email: string) {
	const [user] = await db.select().from(users).where(eq(users.email, email));
	return user ?? null;
}

export async function findUserById(db: Db, id: string) {
	const [user] = await db.select().from(users).where(eq(users.id, id));
	return user ?? null;
}

export async function createUser(db: Db, input: { id: string; name: string; email: string }) {
	const [created] = await db
		.insert(users)
		.values({
			id: input.id,
			name: input.name,
			email: input.email,
			createdAt: new Date()
		})
		.returning();
	return created;
}
