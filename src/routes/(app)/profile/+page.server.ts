import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAiCredentials } from '$lib/server/db/ai-credentials';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.userId) redirect(303, '/login');

	const db = getDb(platform!.env.DB);
	const ai = await getAiCredentials(db, locals.userId);

	return {
		user: locals.session?.user ?? null,
		aiConfigured: Boolean(ai),
		aiProvider: ai?.provider ?? null,
		aiModel: ai?.model ?? null
	};
};
