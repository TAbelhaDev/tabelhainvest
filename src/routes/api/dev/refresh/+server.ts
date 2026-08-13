import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { refreshInvestidor10 } from '$lib/server/investidor10/refresh';

// Dev-only manual refresh trigger — fires the same daily sync the cron runs,
// so data can be pulled on demand while building the screener. Returns after
// the refresh completes. `?limit=N` caps each step (useful for the first run).
export const POST: RequestHandler = async ({ url, platform }) => {
	if (!dev) return json({ error: 'Not available outside dev.' }, { status: 404 });

	const raw = url.searchParams.get('limit');
	const limit = raw ? Number(raw) : undefined;

	const started = Date.now();
	await refreshInvestidor10(platform!.env, Number.isFinite(limit) ? limit : undefined);
	return json({ ok: true, elapsedMs: Date.now() - started });
};
