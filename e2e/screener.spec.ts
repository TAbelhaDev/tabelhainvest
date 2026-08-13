import { expect, test } from '@playwright/test';

// Smoke test for the screener: sign up (or reuse the existing user), open the
// screener and confirm the table renders with the full universe.
test('screener loads and shows the asset universe', async ({ page }) => {
	// Unique user per run so signup never collides with a previous run.
	const email = `e2e-${Date.now()}@tabelainvest.dev`;

	await page.goto('/signup');
	await page.fill('#name', 'E2E Test');
	await page.fill('#email', email);
	await page.fill('#password', 'senha12345');
	await page.getByRole('button', { name: 'Criar conta' }).click();

	// The enhance action follows the post-signup redirect (dashboard → screener).
	await page.waitForURL('**/screener', { timeout: 15_000 });

	// The header shows the row count (server data load can take a moment).
	await expect(page.getByText(/ativos/)).toBeVisible({ timeout: 15_000 });
	// The table renders — the first ticker (alphabetical) should be present.
	await expect(page.getByText('AALR3', { exact: true }).first()).toBeVisible();

	// Filtering by type=FII via the panel is heavy for a smoke test; just
	// confirm the filter toggle opens the panel (the submit button appears).
	const filterToggle = page.getByRole('button', { name: /Filtros/ });
	await filterToggle.click();
	await expect(page.getByRole('button', { name: 'Aplicar filtros' })).toBeVisible({
		timeout: 10_000
	});
});

test('screener applies a DY filter from the URL', async ({ page }) => {
	// Log in with a fresh user again (independent test).
	const email = `e2e-dy-${Date.now()}@tabelainvest.dev`;
	await page.goto('/signup');
	await page.fill('#name', 'E2E Test');
	await page.fill('#email', email);
	await page.fill('#password', 'senha12345');
	await page.getByRole('button', { name: 'Criar conta' }).click();

	// The enhance action follows the post-signup redirect (dashboard → screener).
	await page.waitForURL('**/screener', { timeout: 15_000 });

	// DY > 6% for stocks only — should be far fewer than the full universe.
	await page.goto('/screener?types=acao&min_dy12m=6');
	await expect(page.getByText(/ativos/)).toBeVisible({ timeout: 15_000 });
	// The count should be under the full stock count (663).
	const countText = await page.locator('h1 + p').innerText();
	const count = Number.parseInt(countText.replace(/\D/g, ''), 10);
	expect(count).toBeLessThan(663);
});
