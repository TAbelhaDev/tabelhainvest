// E2E global setup — apply the D1 migrations locally so the dev server has the
// schema, and seed a test user for the login flow.

import { execSync } from 'node:child_process';

export default async function globalSetup() {
	execSync('bunx wrangler d1 migrations apply tabelainvest-db --local', {
		stdio: 'inherit'
	});
	// The test user is created by the signup flow itself; nothing else needed.
}
