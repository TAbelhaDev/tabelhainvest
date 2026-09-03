# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Plano de escopo (`PLANO.md`), com o desenho da camada de dados, modelo de
  banco, screener e IA BYOK — mantido atualizado a cada marco.
- Scaffold do projeto: SvelteKit + Cloudflare Workers (D1 + KV), Drizzle com o
  schema de dados completo (assets, quotes, indicators, fii_indicators,
  dividends, watchlist, saved_filters), envelope encryption (AES-GCM) pra
  credenciais de IA, PWA instalável, cron diário registrado.
- Estrutura inicial do repositório open source (licença AGPL-3.0, templates de
  issue/PR, workflows de CI e release).
- Recursos Cloudflare reais (D1 `tabelhainvest-db`, KV `tabelainvest-sessions`).
- Autenticação via Better Auth (email/senha), guard de rota do app, landing e
  páginas placeholder de screener/watchlist/perfil.
- Configuração de IA BYOK (chave criptografada, provider/modelo escolhíveis)
  com endpoint `/api/onboarding/ai`.
- Camada de dados (fase 2): módulo proxy isolado do investidor10 em
  `src/lib/server/investidor10/`, scrape do universo via sitemaps (663 ações +
  716 FIIs), bootstrap de IDs numéricos por página de ativo, sync de cotações
  (batch), indicadores fundamentalistas por ano, payout/DY e proventos de FIIs,
  cron diário registrado em `worker/entry.js` e rota de dev
  `/api/dev/refresh` (com `?limit=` pra runs em etapas).
- Screener (fase 3): página `/screener` com tabela (ordenação, paginação,
  seleção), painel de filtros por indicador (min/max), multi-select de
  setor/segmento, busca, estratégias prontas (Bazin, Graham, top-DY com
  preço justo calculado no servidor), scoring por regras com pesos
  configuráveis (score 0–100), e salvamento/carregamento de filtros
  (`saved_filters`).
- Detalhe do ativo (fase 4): página `/assets/[ticker]` com cards de
  indicadores (ações e FIIs), preço justo por estratégia (Bazin/Graham),
  gráfico de cotação (12 meses via série do investidor10), proventos recentes
  e toggle de watchlist. `/watchlist` lista os ativos marcados.
- IA BYOK (fase 5): chat por ativo (`/api/chat`) e análise do conjunto
  filtrado (`/api/analyze`), ambos com streaming SSE e dispatch por `fetch()`
  (Anthropic/OpenAI/DeepSeek, sem SDK). UI: painel de chat na página de
  detalhe e painel de análise no screener. Sem chave, o app segue 100% por
  regras.

### Pendente

- Nada em aberto no código. Deploy em produção ativo em
  https://tabelhainvest.tabelhadev.workers.dev com cron diário `0 6 * * *`.
