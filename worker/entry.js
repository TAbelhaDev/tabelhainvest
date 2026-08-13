/// <reference path="./svelte-kit-worker.d.ts" />
// Wrapper em torno do worker gerado pelo @sveltejs/adapter-cloudflare.
//
// A versão instalada do adapter (@sveltejs/adapter-cloudflare@^7) só gera um
// `_worker.js` com `export default { fetch }` — não há extensão documentada
// pra adicionar outros handlers (scheduled, queue, etc), ver
// https://github.com/sveltejs/kit/issues/13692. `wrangler.jsonc`'s `main`
// aponta pra este wrapper, que reexporta o `fetch` gerado pelo SvelteKit e
// adiciona `scheduled` por cima.
//
// O adapter é configurado (vite.config.ts: adapter({ config:
// 'wrangler.adapter.jsonc' })) pra ler uma config *separada* da wrangler.jsonc
// real, só pra continuar escrevendo o worker gerado no local default
// (.svelte-kit/cloudflare/_worker.js) em vez de sobrescrever este arquivo.
//
// Fica fora de `src/` de propósito: se ficasse dentro, o `svelte-check`
// type-checaria transitivamente o `_worker.js` gerado (um bundle Rollup
// grande e não tipado).
//
// `$lib` funciona aqui porque `wrangler.jsonc` declara `alias: { "$lib":
// "./src/lib" }`, resolvido pelo esbuild do wrangler.
import server from '../.svelte-kit/cloudflare/_worker.js';
import { refreshInvestidor10 } from '$lib/server/investidor10/refresh';

export default {
	fetch: server.fetch,
	/**
	 * @param {ScheduledController} event
	 * @param {Env} env
	 * @param {ExecutionContext} ctx
	 */
	async scheduled(event, env, ctx) {
		// Refresh diário dos dados do investidor10 (cotações, indicadores,
		// payout, proventos) — PLANO.md §Cron.
		if (event.cron === '0 6 * * *') {
			ctx.waitUntil(refreshInvestidor10(env));
		}
	}
};
