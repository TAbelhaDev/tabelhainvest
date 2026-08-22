import { redirect } from 'sveltekit-flash-message/server';
import type { RequestHandler } from './$types';
import { deleteSession, clearSessionCookie, getSessionToken } from '$lib/server/session';
import { ToastType } from '$lib/enums/toast-type';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const env = platform!.env;
	const sessionToken = getSessionToken(cookies);

	if (sessionToken) {
		await deleteSession(env.SESSIONS, sessionToken);
	}

	clearSessionCookie(cookies);

	redirect('/login', { type: ToastType.success, message: 'Você saiu da sua conta.' }, cookies);
};
