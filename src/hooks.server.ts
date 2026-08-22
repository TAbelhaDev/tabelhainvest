import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { validateSession, getSessionToken } from '$lib/server/session';

const auth: Handle = async ({ event, resolve }) => {
	event.locals.userId = null;
	event.locals.session = null;

	const env = event.platform?.env;
	if (!env) return resolve(event);

	const sessionToken = getSessionToken(event.cookies);
	if (sessionToken) {
		const sessionData = await validateSession(env.SESSIONS, sessionToken);
		if (sessionData) {
			event.locals.userId = sessionData.userId;
			event.locals.session = {
				user: {
					id: sessionData.userId,
					name: sessionData.name,
					email: sessionData.email
				},
				session: { id: sessionToken, token: sessionToken }
			};
		}
	}

	return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
	);

	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	return response;
};

export const handle: Handle = sequence(auth, securityHeaders);
