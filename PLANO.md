# TabelaInvest — plano

Screener de ações + FIIs da B3 com dados do investidor10: filtros, ordenação,
seleção, recomendação e IA opcional (BYOK). Open source, AGPL-3.0, mesmo padrão
dos outros projetos "tabela".

## Visão

O usuário abre o app, vê a tabela do universo (ações + FIIs) com os principais
indicadores, filtra/ordena/seleciona por critérios próprios, e recebe
recomendação de três formas:

1. **Filtros manuais** — o usuário monta os critérios (ex.: P/L entre 5 e 15,
   DY > 6%, ROE > 10%, setor = Bancos) e a tabela lista o que passa.
2. **Scoring por regras** — score composto por indicadores com pesos
   configuráveis (ex.: DY↑ + P/L↓ + ROE↑), determinístico e transparente.
3. **Estratégias prontas** — presets clássicos (Bazin, Graham, top dividend
   yield) que aplicam os filtros e ordenam sozinhos.

IA opcional (BYOK): com chave própria o usuário ganha análise do conjunto
filtrado (por que estes passaram, sugestão de seleção) e chat por ativo. Sem
chave, o app funciona 100%.

## Stack

Espelha o `tabelafin` (repo `~/codigo/tabeladev/tabelafin`):

- **SvelteKit + TypeScript**, adapter Cloudflare Workers. Config do SvelteKit
  dentro do `vite.config.ts` (não há `svelte.config.js`).
- **Banco:** Cloudflare D1 (binding `DB`) via **Drizzle ORM**. Schema num
  arquivo só: `src/lib/server/db/schema.ts`. Um módulo de acesso por tabela em
  `src/lib/server/db/`.
- **Sessões:** KV (binding `SESSIONS`). **Auth:** better-auth em
  `/api/auth/[...all]`; módulo reutilizável em `src/lib/auth/`.
- **Cron:** `worker/entry.js` embrulha o worker pra expor o handler
  `scheduled`. Dois wrangler configs: `wrangler.jsonc` (real) e
  `wrangler.adapter.jsonc` (só pro adapter não sobrescrever o `entry.js`).
- **UI:** `@tabeladev/tabelawebui` (registry). Tailwind v4, um único stylesheet
  em `src/routes/layout.css`. Sem shadcn.
- **PWA:** `@vite-pwa/sveltekit` + `src/lib/ReloadPrompt.svelte`.
- **Criptografia BYOK:** `MASTER_KEY` + HKDF → AES-256-GCM, contexto-bound
  (mesma lib do `tabelafin`: `src/lib/server/crypto.ts`).

## Camada de dados (o coração)

O investidor10 **não tem API oficial**. Os endpoints internos `/api/*`
funcionam sem autenticação, exigindo `User-Agent` de navegador (bloqueia curl
puro). O browser nunca fala direto com o investidor10: o worker faz proxy +
cache no D1 (evita CORS/UA/rate-limit e esconde os IDs internos).

### Universo e IDs

- Universo dos sitemaps públicos: `sitemap-acoes.xml` (663 tickers, incl.
  códigos especiais como B3SA3/ANDG3B) e `sitemap-fiis.xml` (716 tickers).
  Extrair URLs de ticker (`/acoes/{ticker}/`, `/fiis/{ticker}/`), excluindo
  páginas de listagem (`all`, `all2`, `ipo`).
- IDs numéricos (`company_id`, `ticker_id`) vêm do HTML de cada ativo
  (`data-company-id`, e `tickerId` só pra ações). Scrape inicial one-shot por
  ativo pra montar a tabela `assets` no D1. Setor/subsetor de ações também vêm
  da página (frase "no setor de"/"no segmento"); FIIs pegam segmento/tipo do
  comparador.

### Endpoints confirmados (testados 2026-08-12)

**Ações:**

- `GET /api/cotacoes/batch?tickers=PETR4,VALE3,...` → preço em tempo real
  (ações/FIIs/ETFs). Retorna `{price, last_update}`.
- `GET /api/historico-indicadores/{tickerId}/{anos}/?v=2` → indicadores
  fundamentalistas por ano (P/L, ROE, margens, ...).
- `GET /api/acoes/payout-chart/{companyId}/{tickerId}/{ticker}/{periodo}` →
  payout + dividend yield por ano.
- `GET /api/cotacoes/acao/chart/{ticker}/` → série de preços.
- `GET /api/cotacao-lucro/{ticker}/` → lucro líquido x cotação por ano.
- `GET /api/balancos/*/chart/{companyId}/...` → balanços (DRE, ativos/passivos).
- `GET /api/component-list/layout.search.result-item?_source=search/{q}` →
  busca de ativos.

**FIIs:**

- `GET /api/fii/comparador/table/{companyId}/all/` → indicadores completos de
  FII (P/VP, DY, net worth, segmento, tipo tijolo/papel) — JSON rico, ideal pra
  populá-los.
- `GET /api/fii/dividendos/chart/{companyId}/` → proventos mensais.
- `GET /api/fii/dividend-yield/chart/{companyId}/` → DY histórico.
- `GET /api/fii/historico-taxa-vacancia/{companyId}/` → vacância.
- `GET /api/fii/valor-patrimonial/chart/{companyId}/` → valor patrimonial.
- `GET /api/fii/cotacoes/chart/{companyId}/` → série de preços.

### Cron

`worker/entry.js` `scheduled` — refresh diário (ex.: `0 6 * * *`, mesmo horário
do tabelafin):

1. Cotação batch dos ativos ativos (ações + FIIs).
2. Indicadores: ações via `historico-indicadores`, FIIs via `comparador/table`.
3. Payout/DY e proventos.

Respeitar etiqueta de scraping: backoff, TTL, sem carga pesada. Os endpoints
não são oficiais e podem mudar — isolar TODO o acesso ao investidor10 num único
módulo proxy (`src/lib/server/investidor10/`), com tipos e parsing centralizados.

## Modelo de dados (D1)

- `assets` — ticker, type (`acao|fii`), company_id, ticker_id, name,
  sector/segment/subsector (ações) ou segment/type (FIIs).
- `quotes` — asset_id, price, variation_30d/12m/5y, last_update.
- `indicators` — asset_id, year, p_l, p_vp, roe, net_margin, dy_12m, dy_5y,
  bazin_price, graham_price, growth_* (ações).
- `fii_indicators` — asset_id, p_vp, dividend_yield, net_worth, segment, type,
  vacancy (FIIs).
- `dividends` — asset_id, ex_date, pay_date, value, type.
- `watchlist` — user_id, asset_id (many-to-many).
- `saved_filters` — user_id, name, filter JSON.
- `ai_credentials` — user_id, provider, model, keyEncrypted, nonce, v
  (mesma estrutura do tabelafin).

Ações e FIIs têm indicadores distintos → duas tabelas de indicadores; o screener
filtra por classe.

## Screener

- Tabela do `@tabeladev/tabelawebui` (`Table.svelte` já tem sort, filtro global,
  paginação, seleção de linha).
- Painel de filtros por indicador (min/max numérico) + multi-select de
  setor/segmento/tipo.
- Modos de recomendação (os 3): filtros manuais, scoring por regras com pesos
  configuráveis, estratégias prontas (Bazin, Graham, top-DY).
- Página de detalhe do ativo: indicadores, gráfico de preço, payout/DY,
  dividendos.

**Regra tabelawebui:** se precisar de componente/feature de UI que o tabelawebui
ainda não tem (ex.: painel de filtro numérico por coluna, column-picker), criar
**request no repo do tabelawebui** (`requests/`), nunca CSS paralelo no app.
O `Table` atual já cobre o grosso do v1.

## IA (BYOK, opcional)

Mesma arquitetura do tabelafin:

- Chave própria (Anthropic / OpenAI / DeepSeek) + escolha de modelo, salva
  criptografada (`MASTER_KEY`).
- Dispatch por `fetch()` puro (sem SDK), roda no `workerd`.
- Sem chave → app funciona sem IA (só os recursos de dados/filtros).

Funcionalidades:

1. **Análise do conjunto filtrado** — explicar por que os ativos passaram nos
   critérios e sugerir uma seleção/portfolio a partir do resultado filtrado.
2. **Chat por ativo** — pergunta contextual sobre um ticker (fundamentos,
   indicadores, proventos).

## Fases de implementação

> Status (2026-08-12): fases 1–5 concluídas. Falta só o deploy (cron remoto +
> secrets) e o repo no GitHub.

1. **Scaffold** — ✅ base do tabelafin (config, auth, layout, landing, PWA,
   scripts), D1/KV bindings reais. Repo `~/codigo/tabeladev/tabelainvest`.
2. **Camada de dados** — ✅ módulo proxy isolado do investidor10, scrape do
   universo (663 ações + 716 FIIs) e IDs, sync de cotações/indicadores/
   proventos, cron `0 6 * * *` registrado, rota dev `/api/dev/refresh`.
3. **Screener** — ✅ tabela (ordenação/paginação/seleção), painel de filtros
   por indicador (min/max) + setor/segmento/tipo, busca, scoring por regras
   com pesos configuráveis (0–100) e estratégias prontas (Bazin/Graham com
   preço justo calculado no servidor, top-DY). Filtros salvos/carregados.
4. **Detalhe do ativo** — ✅ `/assets/[ticker]`: cards de indicadores (ações e
   FIIs), preço justo por estratégia, gráfico de cotação (12 meses), proventos
   recentes, toggle de watchlist. `/watchlist` lista os marcados.
5. **IA BYOK** — ✅ análise do conjunto filtrado (`/api/analyze`) e chat por
   ativo (`/api/chat`), streaming SSE, dispatch `fetch()` sem SDK.
   UI: painel no screener e na página de detalhe.
6. **Docs e testes** — ✅ README bilíngue, CONTRIBUTING, CHANGELOG,
   `check`/`lint`/`test`/`build` verdes. Pendente: deploy remoto + GitHub.

## Riscos

- Endpoints não-oficiais do investidor10 podem mudar sem aviso → isolar tudo no
  módulo proxy.
- Etiqueta de scraping: cron com backoff e TTL, sem carga pesada.
- Ações e FIIs com indicadores distintos → manter as duas tabelas separadas.
- BDRs/ETFs ficam fora do v1 (decisão: só ações + FIIs); arquitetura permite
  adicionar depois. Universo atual: 663 ações + 716 FIIs (testado 2026-08-12).
