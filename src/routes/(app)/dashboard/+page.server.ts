import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The screener is the app's home — /dashboard is a redirect target from
// login/signup and stays as a shortcut to it.
export const load: PageServerLoad = async () => {
	redirect(307, '/screener');
};
