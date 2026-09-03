# tabelhainvest — contexto essencial

Screener de ações + FIIs da B3 (dados do investidor10) com filtros, ordenação,
seleção e recomendação. IA opcional (BYOK). Repo **aberto**, AGPL-3.0. Antes de
mexer, leia o `README.md` (produto), o `CONTRIBUTING.md` (política de linguagem
de toda a TAbelhaDev) e o `PLANO.md` (escopo e fases).

## Stack

- **SvelteKit + TypeScript**, adaptador Cloudflare Workers. A config do SvelteKit
  fica **dentro do `vite.config.ts`** (não há `svelte.config.js`).
- **Banco:** Cloudflare D1 (binding `DB`) via **Drizzle ORM**. Schema num arquivo
  só: `src/lib/server/db/schema.ts`. Um módulo de acesso por tabela em
  `src/lib/server/db/`.
- **Sessões:** KV (binding `SESSIONS`). **Auth:** better-auth, montado em
  `/api/auth/[...all]`; o módulo reutilizável fica em `src/lib/auth/` (tem README próprio).
- **Cron:** `worker/entry.js` embrulha o worker gerado pra expor o handler
  `scheduled` — refresh diário dos dados do investidor10 (`0 6 * * *`). Por isso
  existem **dois** wrangler configs: `wrangler.jsonc` (real) e
  `wrangler.adapter.jsonc` (só pro adapter não sobrescrever o `entry.js`).
- **UI:** `@tabelhadev/tabelhawebui` (registry). Tailwind v4, um único stylesheet em
  `src/routes/layout.css`. Sem shadcn.
- **PWA:** `@vite-pwa/sveltekit` + `src/lib/ReloadPrompt.svelte`.

## Dados do investidor10

**Não há API oficial.** A app consome os endpoints internos `/api/*` do
investidor10 (funcionam sem auth, exigem `User-Agent` de navegador). TODO o
acesso fica isolado no módulo proxy em `src/lib/server/investidor10/` — ver
PLANO.md §Camada de dados. O browser nunca fala direto com o investidor10.

## Registry npm

O `bunfig.toml` na raiz é **gitignored** e **só existe localmente nesta máquina**:
aponta pro mirror `registry.npmmirror.com` porque aqui o `registry.npmjs.org`
resolve só IPv6 e o `bun install` pendura nos tarballs. Se a sua rede tiver
IPv6 OK, não crie esse arquivo — use o registry padrão. O `bun.lock` commitado
pode conter URLs do mirror; o bun reescreve conforme o registry ativo.

## Rodando dev

```
bun dev
```

A porta sai de `~/.config/dev-ports.yaml` (chaveada pelo cwd), com fallback `DEV_PORT`.

## Comandos

`bun dev`, `bun run check`, `bun run lint`, `bun run format`, `bun run test` (vitest),
`bun run test:e2e` (playwright), `bun run build`, `bun run deploy`.
Banco: `bun run db:generate` / `db:migrate` / `db:studio`.

Antes de abrir PR: `bun run check && bun run lint && bun run test && bun run build`.

## Rotas

- `(marketing)/` — público. A landing redireciona quem já tem sessão pra `/screener`.
- `(app)/` — logado. Guard único em `(app)/+layout.server.ts`. `/screener` é a
  página principal: tabela + filtros + estratégias + scoring (a lógica de
  scoring/estratégias fica em `src/lib/screener/`).
- `login/`, `signup/`, `logout/` — soltas na raiz (convenção compartilhada).
- `api/` — endpoints JSON (chat, analyze, onboarding/ai, auth). Mutação de tela é
  **form action**, não fetch pra `/api`.
- `api/chat` — chat por ativo (SSE, BYOK). `api/analyze` — análise do conjunto
  filtrado (SSE, BYOK). Ambos leem a credencial em `ai_credentials` e usam o
  dispatch em `src/lib/server/ai/` (sem SDK, só `fetch()`).
- `api/refresh` — dispara o sync do investidor10 (cotações/indicadores/
  proventos) sob demanda. Em dev não exige token; em produção exige header
  `x-refresh-token` == `REFRESH_TOKEN`. `?limit=N` corta cada fase (útil no
  primeiro run). Usado pro bootstrap inicial de dados e manutenção.

## Testes

`*.spec.ts` colocado ao lado do módulo (vitest, ambiente node). E2E em `e2e/` (playwright).

## Convenções compartilhadas

Regras comuns aos apps web da TAbelhaDev (grupos de rota, tokens de tema, landing, SEO):
`docs/convencoes-web.md` no repo do
[tabelawebui](https://github.com/TAbelhaDev/tabelawebui). Não duplicar as regras aqui.
