import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { createSession, setSessionCookie } from '$lib/server/session';

export const load: PageServerLoad = async ({ url, platform, cookies }) => {
	const hubToken = url.searchParams.get('hub_token');
	if (!hubToken || !platform?.env) {
		return redirect(303, '/login');
	}

	const hubUrl =
		platform.env.PUBLIC_TABELAUTH_URL ||
		env.PUBLIC_TABELAUTH_URL ||
		'https://tabelaauth.ianptkcs-023.workers.dev';

	try {
		const exchangeRes = await fetch(
			`${hubUrl}/api/auth/exchange?token=${encodeURIComponent(hubToken)}&appId=tabelainvest`
		);

		if (!exchangeRes.ok) {
			return redirect(303, '/login');
		}

		const user = (await exchangeRes.json()) as {
			userId: string;
			name: string;
			email: string;
		};

		const sessionToken = await createSession(
			platform.env.SESSIONS,
			user.userId,
			user.name,
			user.email
		);

		setSessionCookie(cookies, sessionToken);
	} catch {
		return redirect(303, '/login');
	}

	return redirect(303, '/dashboard');
};
