// HTTP client for investidor10's internal API (PLANO.md §Camada de dados).
//
// There is no official API. The endpoints below are the same ones the
// investidor10 website itself uses. They work without authentication but
// require a browser User-Agent (plain curl gets blocked). Everything is
// isolated in this folder so a change on their side hits one place.
//
// Keep requests polite: the daily refresh runs once a day and every batch is
// throttled in the caller (see refresh.ts).

const BASE_URL = 'https://investidor10.com.br';

const BROWSER_UA =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

export class Investidor10Error extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'Investidor10Error';
	}
}

// investidor10 rate-limits (429) when we go too fast. Retry with backoff so a
// single burst does not kill a whole sync phase. 429 also responds politely to
// the Retry-After header when it sends one.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;

function retryDelayMs(attempt: number, retryAfterMs?: number): number {
	if (retryAfterMs) return Math.min(retryAfterMs, 60_000);
	return 500 * 2 ** attempt; // 500ms, 1s, 2s
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path: string, options: { timeoutMs?: number } = {}): Promise<Response> {
	let attempt = 0;
	for (;;) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);

		let res: Response;
		try {
			res = await fetch(`${BASE_URL}${path}`, {
				headers: {
					'user-agent': BROWSER_UA,
					accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
					'x-requested-with': 'XMLHttpRequest'
				},
				signal: controller.signal
			});
		} catch (err) {
			clearTimeout(timeout);
			if (err instanceof Error && err.name === 'AbortError') {
				throw new Investidor10Error(`investidor10 ${path} → timeout`);
			}
			throw err;
		}
		clearTimeout(timeout);

		if (res.ok) return res;

		// Transient errors get a retry with backoff. Everything else is final.
		if (RETRYABLE.has(res.status) && attempt < MAX_RETRIES) {
			const retryAfterMs = Number(res.headers.get('retry-after')) * 1000;
			await sleep(retryDelayMs(attempt, Number.isFinite(retryAfterMs) ? retryAfterMs : undefined));
			attempt += 1;
			continue;
		}
		throw new Investidor10Error(`investidor10 ${path} → ${res.status}`, res.status);
	}
}

export async function getJson<T>(path: string): Promise<T> {
	const res = await request(path);
	return (await res.json()) as T;
}

export async function getText(path: string): Promise<string> {
	const res = await request(path, { timeoutMs: 30_000 });
	return await res.text();
}
