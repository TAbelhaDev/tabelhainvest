import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getAiCredentials } from '$lib/server/db/ai-credentials';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.userId) redirect(303, '/login');

	// The AI status is global (it shows in the floating pill on every page) —
	// loaded here rather than in each page.
	const db = getDb(platform!.env.DB);
	const ai = await getAiCredentials(db, locals.userId);

	return {
		userId: locals.userId,
		aiConfigured: Boolean(ai)
	};
};
