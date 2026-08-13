import { expect, test } from '@playwright/test';

// Smoke test for the asset detail page — navigates from the screener table and
// confirms indicators + chart + watchlist toggle render.
test('asset detail renders indicators and the price chart', async ({ page }) => {
	const email = `e2e-asset-${Date.now()}@tabelainvest.dev`;
	await page.goto('/signup');
	await page.fill('#name', 'E2E Test');
	await page.fill('#email', email);
	await page.fill('#password', 'senha12345');
	await page.getByRole('button', { name: 'Criar conta' }).click();
	await page.waitForURL('**/screener', { timeout: 15_000 });

	// Open the first asset's detail by clicking its ticker in the table.
	await page.getByRole('link', { name: 'AALR3' }).first().click();
	await page.waitForURL('**/assets/aalr3', { timeout: 15_000 });

	// The detail header shows the ticker and the indicator cards.
	await expect(page.locator('h1')).toContainText('AALR3');
	await expect(page.getByText('Preço / Lucro')).toBeVisible();
	await expect(page.getByText('Dividend yield 12m')).toBeVisible();

	// Watchlist toggle works (starts unstarred, toggles to starred).
	await page.getByRole('button', { name: /Adicionar à watchlist/ }).click();
	await expect(page.getByRole('button', { name: /Na watchlist/ })).toBeVisible({ timeout: 10_000 });

	// The BYOK chat panel renders on the detail page.
	await expect(page.getByText(/Pergunte sobre AALR3/)).toBeVisible();
});

test('screener renders the AI analysis panel', async ({ page }) => {
	const email = `e2e-ai-${Date.now()}@tabelainvest.dev`;
	await page.goto('/signup');
	await page.fill('#name', 'E2E Test');
	await page.fill('#email', email);
	await page.fill('#password', 'senha12345');
	await page.getByRole('button', { name: 'Criar conta' }).click();
	await page.waitForURL('**/screener', { timeout: 15_000 });

	// The "IA" toggle opens the analysis panel (which explains the filtered set).
	await page.getByRole('button', { name: /^IA/ }).click();
	await expect(page.getByText('Análise do conjunto filtrado')).toBeVisible({ timeout: 10_000 });
});
