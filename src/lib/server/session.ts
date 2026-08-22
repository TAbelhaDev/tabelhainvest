// Lightweight session management backed by KV.
//
// After the auth migration to tabelahub, tabelafin no longer manages passwords
// or user accounts. It only needs to track "who is logged in" via a session
// token stored in KV, created from the hub_token that tabelahub issues on
// successful login.

const SESSION_COOKIE = 'tabelainvest_session_token';
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;
const KV_PREFIX = 'tabelainvest:session:';

export interface SessionData {
	userId: string;
	name: string;
	email: string;
	expiresAt: number;
}

/**
 * Creates a session in KV from verified hub user data and returns the cookie
 * value to set on the response.
 */
export async function createSession(
	kv: KVNamespace,
	userId: string,
	name: string,
	email: string
): Promise<string> {
	const token = crypto.randomUUID();
	const data: SessionData = {
		userId,
		name,
		email,
		expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
	};

	await kv.put(`${KV_PREFIX}${token}`, JSON.stringify(data), {
		expirationTtl: SESSION_TTL_SECONDS
	});

	return token;
}

/**
 * Validates a session token and returns the stored user data, or null if
 * expired/missing.
 */
export async function validateSession(kv: KVNamespace, token: string): Promise<SessionData | null> {
	const raw = await kv.get<SessionData>(`${KV_PREFIX}${token}`, 'json');
	if (!raw) return null;

	if (Math.floor(Date.now() / 1000) > raw.expiresAt) {
		await kv.delete(`${KV_PREFIX}${token}`);
		return null;
	}

	return raw;
}

/**
 * Deletes a session (for logout).
 */
export async function deleteSession(kv: KVNamespace, token: string): Promise<void> {
	await kv.delete(`${KV_PREFIX}${token}`);
}

/**
 * Reads the session token from the request cookies.
 */
export function getSessionToken(cookies: import('@sveltejs/kit').Cookies): string | null {
	return cookies.get(SESSION_COOKIE) ?? null;
}

/**
 * Sets the session cookie on the response.
 */
export function setSessionCookie(cookies: import('@sveltejs/kit').Cookies, token: string): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_SECONDS
	});
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(cookies: import('@sveltejs/kit').Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export { SESSION_COOKIE };
