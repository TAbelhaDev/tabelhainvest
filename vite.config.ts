import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { readFileSync } from 'node:fs';

function devPort() {
	try {
		const cwd = process.cwd();
		const line = readFileSync(`${process.env.HOME}/.config/dev-ports.yaml`, 'utf8')
			.split('\n')
			.find((l) => l.startsWith(`${cwd}: `));
		if (line) return Number(line.slice(cwd.length + 2));
	} catch {
		/* dev-ports.yaml may not exist yet */
	}
	return parseInt(process.env.DEV_PORT || '5173', 10);
}

export default defineConfig({
	server: {
		port: devPort()
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// config: 'wrangler.adapter.jsonc' — não a wrangler.jsonc real. Ver
			// comentário nesse arquivo: evita que o adapter sobrescreva
			// worker/entry.js (o wrapper que adiciona o handler `scheduled`).
			adapter: adapter({ config: 'wrangler.adapter.jsonc' }),
			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		}),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'prompt',
			manifest: {
				name: 'TAbelhaInvest',
				short_name: 'TAbelhaInvest',
				description:
					'Screener de ações e FIIs da B3 — filtre, compare e receba recomendações com base nos indicadores.',
				theme_color: '#18181b',
				background_color: '#18181b',
				display: 'standalone',
				start_url: '/',
				icons: [
					{ src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{
						src: 'maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// /api e /auth nunca devem ser servidos do cache (sessão/BYOK por request).
				// Navegações (page routes) são server-rendered no Cloudflare Workers,
				// não estáticas — sempre ir pra rede.
				runtimeCaching: [
					{
						urlPattern: ({ url }) =>
							url.pathname.startsWith('/api') || url.pathname.startsWith('/auth'),
						handler: 'NetworkOnly'
					},
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkOnly'
					}
				]
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
