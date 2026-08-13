import type { Handle } from '@sveltejs/kit';
import { handleAuth } from '$lib/auth';
import { getAuth } from '$lib/server/auth';

export const handle: Handle = handleAuth(getAuth);
