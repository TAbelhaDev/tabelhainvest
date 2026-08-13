<div align="center">

# TabelaInvest

**Garimpe ações e FIIs da B3 pelos indicadores, filtre e compare numa tabela direta — recomendações por regras ou com a sua própria IA (BYOK).**

[English](README.md) · **Português**

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Built with tabelawebui](https://img.shields.io/badge/theme-tabelawebui-d6b4f7?style=flat-square)](https://github.com/TabelaDev/tabelawebui)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## O que é

Screener de ações e FIIs (fundos imobiliários) da B3. Puxa cotações,
indicadores e dividendos do investidor10 e coloca tudo numa tabela que você
filtra, ordena e compara por qualquer indicador (P/L, P/VP, ROE, margem
líquida, dividend yield, crescimento, setor, segmento). A recomendação vem em
três formas — filtros manuais, scoring por regras e estratégias prontas (Bazin,
Graham, top dividend yield) — além de IA opcional (BYOK) pra analisar o
conjunto filtrado ou conversar sobre um ativo.

O domínio aqui é o mercado brasileiro, então a interface é em português. O
código é em inglês; veja o [CONTRIBUTING.pt-BR.md](CONTRIBUTING.pt-BR.md#idioma)
pra convenção.

## Como funciona

1. Um cron diário sincroniza o universo da B3 (ações + FIIs) dos sitemaps
   públicos e da API interna do investidor10.
2. Você monta o filtro — cada indicador com seu limite mínimo e máximo, e
   multi-select de setor/segmento.
3. A tabela responde: ordena por qualquer coluna, compara lado a lado, salva o
   filtro pra depois e marca ativos na sua watchlist.
4. Recomendação: filtros manuais, scoring por regras com pesos configuráveis ou
   estratégias clássicas (Bazin, Graham, top-DY).

IA é **opcional** (traga sua chave): com a sua chave Anthropic, OpenAI ou
DeepSeek você pede pra o app explicar por que os ativos passaram no seu filtro e
sugerir uma seleção, ou conversa sobre um ativo específico. Sem chave, o app
funciona 100% por regras.

Também funciona como PWA: você pode "instalar" no celular ou no desktop e usar
como um app nativo, com atualização automática.

## Traga suas próprias credenciais

Mesmo padrão BYOK do [TabelaFin](https://github.com/TabelaDev/tabelafin): cole
sua própria API key (Anthropic, OpenAI ou DeepSeek) e escolha o modelo. Você
paga sua própria inferência. Sua chave fica armazenada criptografada.

## Rodando localmente

Stack: SvelteKit + Cloudflare Workers (D1 + KV), Bun como package manager.

```sh
bun install

# aplica as migrations no D1 local
bunx wrangler d1 migrations apply tabelainvest-db --local

bun run dev
```

Outros comandos úteis:

```sh
bun run check     # typecheck
bun run lint      # prettier + eslint
bun run test      # testes unitários
bun run test:e2e  # testes E2E (Playwright)
bun run build     # build de produção
bun run deploy    # build + migrations remotas + deploy
```

`MASTER_KEY` pra criptografia das credenciais de IA e `BETTER_AUTH_SECRET` pra
autenticação (email/senha via Better Auth).

## Fonte de dados

**Não existe API oficial do investidor10.** O TabelaInvest consome os mesmos
endpoints internos `/api/*` que o site do investidor10 usa. Eles funcionam sem
autenticação, mas são indocumentados e podem mudar sem aviso — toda a
integração fica isolada num único módulo proxy. Veja o `PLANO.md` pra o design
da camada de dados.

## Desenvolvimento

Stack e comandos: veja a seção _Rodando localmente_ acima. Testes:

```sh
bun run test      # testes unitários
bun run test:e2e  # testes E2E (Playwright)
```

## Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para o histórico de versões.

## Apoie o projeto

- **Global**: [ko-fi.com/ianptkcs](https://ko-fi.com/ianptkcs)
- **Brasil (Pix)**: escaneie o QR abaixo ou copie o código

  <img src="pix-qr.png" alt="Pix QR" width="200" />

  <details><summary>Código Pix (copiar)</summary>

  ```
  00020126580014BR.GOV.BCB.PIX01365ad933b0-dcdc-4525-a736-0759902aeec65204000053039865802BR5925Ian Patrick da Costa Soar6009SAO PAULO62140510tQA85x6Dov63041FB6
  ```

  </details>

## Licença

[AGPL-3.0](LICENSE) — copyleft forte: você pode usar, modificar e até
hospedar o TabelaInvest comercialmente, mas qualquer versão modificada, inclusive
rodando como serviço via rede (SaaS), precisa continuar open source sob a
mesma licença.
