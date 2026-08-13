<div align="center">

# TabelaInvest

**Screen Brazilian stocks and REITs (FIIs) by fundamentals — filter, compare and get rule-based or BYOK-AI recommendations.**

**English** · [Português](README.pt-BR.md)

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Built with tabelawebui](https://img.shields.io/badge/theme-tabelawebui-d6b4f7?style=flat-square)](https://github.com/TabelaDev/tabelawebui)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## What it is

A stock and REIT (FII) screener for the Brazilian market (B3). It pulls quotes,
fundamentals and dividend data from investidor10 and puts it in a table you can
filter, sort and compare by any indicator (P/L, P/VP, ROE, net margin, dividend
yield, growth, sector, segment). Recommendations come in three flavours —
manual filters, rule-based scoring, and ready-made strategies (Bazin, Graham,
top dividend yield) — plus optional BYOK AI to analyse the filtered set or chat
about an asset.

Brazilian market data is the domain here, so the interface is in Portuguese.
The code is in English; see [CONTRIBUTING.md](CONTRIBUTING.md#language) for the
convention.

## How it works

1. A daily cron syncs the B3 universe (stocks + REITs) from investidor10's
   public sitemaps and internal API.
2. You build a filter — each indicator with its own min/max, plus
   sector/segment multi-select.
3. The table answers: sort by any column, compare side by side, save the
   filter for later, star assets into your watchlist.
4. Recommendations: manual filters, rule-based scoring with configurable
   weights, or classic strategies (Bazin, Graham, top-DY).

AI is **optional** (bring your own key): with your own Anthropic, OpenAI or
DeepSeek key you can ask the app to explain why assets passed your filter and
suggest a selection, or chat about a single asset. Without a key the app works
fully on rules.

It works as a PWA too: install it on a phone or desktop and use it like a
native app, with automatic updates.

## Bring your own credentials

The same BYOK pattern as
[TabelaFin](https://github.com/TabelaDev/tabelafin): paste your own API key
(Anthropic, OpenAI or DeepSeek) and pick the model. You pay for your own
inference. Your key is stored encrypted.

## Running locally

Stack: SvelteKit + Cloudflare Workers (D1 + KV), Bun as the package manager.

```sh
bun install

# apply the migrations to the local D1
bunx wrangler d1 migrations apply tabelainvest-db --local

bun run dev
```

Other useful commands:

```sh
bun run check     # typecheck
bun run lint      # prettier + eslint
bun run test      # unit tests
bun run test:e2e  # E2E tests (Playwright)
bun run build     # production build
bun run deploy    # build + remote migrations + deploy
```

`MASTER_KEY` encrypts the stored AI credentials and `BETTER_AUTH_SECRET` is
for authentication (email/password via Better Auth).

## Data source

There is **no official investidor10 API**. TabelaInvest consumes the same
internal `/api/*` endpoints the investidor10 website itself uses. They work
without authentication but are undocumented and can change without notice — the
whole integration is isolated in a single proxy module. See `PLANO.md` for the
data layer design.

## Development

Stack and commands: see _Running locally_ above. Tests:

```sh
bun run test      # unit tests
bun run test:e2e  # E2E tests (Playwright)
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the version history.

## Support the project

- **Global**: [ko-fi.com/ianptkcs](https://ko-fi.com/ianptkcs)
- **Brazil (Pix)**: scan the QR below or copy the code

  <img src="pix-qr.png" alt="Pix QR" width="200" />

  <details><summary>Pix code (copy)</summary>

  ```
  00020126580014BR.GOV.BCB.PIX01365ad933b0-dcdc-4525-a736-0759902aeec65204000053039865802BR5925Ian Patrick da Costa Soar6009SAO PAULO62140510tQA85x6Dov63041FB6
  ```

  </details>

## License

[AGPL-3.0](LICENSE) — strong copyleft: you may use, modify and even host
TabelaInvest commercially, but any modified version, including one running as a
network service (SaaS), has to stay open source under the same license.
