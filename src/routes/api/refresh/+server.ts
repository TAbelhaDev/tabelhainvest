import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { refreshInvestidor10 } from '$lib/server/investidor10/refresh';

// Manual refresh trigger for the investidor10 sync (cotações, indicadores,
// proventos). The cron runs daily; this route exists for the initial data
// bootstrap and for maintenance.
//
// Auth:
//   - dev: no token required (localhost).
//   - prod: `x-refresh-token` must match the REFRESH_TOKEN env var.
// `?limit=N` caps each step (useful for the first run in batches).
export const POST: RequestHandler = async ({ request, url, platform }) => {
	const raw = url.searchParams.get('limit');
	const limit = raw ? Number(raw) : undefined;

	if (!dev) {
		const expected = platform!.env.REFRESH_TOKEN;
		if (!expected || request.headers.get('x-refresh-token') !== expected) {
			return json({ error: 'Não autorizado.' }, { status: 401 });
		}
	}

	const started = Date.now();
	await refreshInvestidor10(platform!.env, Number.isFinite(limit) ? limit : undefined);
	return json({ ok: true, elapsedMs: Date.now() - started });
};
