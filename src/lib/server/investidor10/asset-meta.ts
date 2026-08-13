// Per-asset metadata extracted from the asset page HTML.
//
// The numeric ids the internal API needs (company_id, and ticker_id for
// stocks) are only present in each asset's page, not in any JSON endpoint.
// This bootstrap runs once per asset (on first discovery) and stores the ids
// in the DB; the daily refresh then works off the saved ids.
//
// Also pulled from the page, for stocks only: sector + subsector from the
// breadcrumb sentence ("...no setor de <a>/...no segmento <a>"). For REITs the
// segment comes from the comparator JSON instead (see fii.ts).

import { getText } from './client';
import type { AssetType } from './universe';

export interface AssetMeta {
	ticker: string;
	type: AssetType;
	name: string;
	companyId: number | null;
	tickerId: number | null;
	sector: string | null;
	subsector: string | null;
}

// In the page source:
//   data-company-id="2"          (stocks and REITs)
//   tickerId = '4'               (stocks only)
//   title="Logo PETROLEO BRASILEIRO S.A. PETROBRAS"   (stock full name)
//   ...no setor de <a href=".../setores/{sector}/">
//   ...no segmento <a href=".../setores/{sector}/{subsector}/">
const COMPANY_ID = /data-company-id="(\d+)"/;
const TICKER_ID = /tickerId\s*=\s*'(\d+)'/;
const LOGO_TITLE = /title="Logo ([^"]+)"/;
// Whitespace-tolerant (the HTML has newlines between the text and the <a>).
const SECTOR_SNIPPET =
	/no\s+setor\s+de\s+<a\s+href="https:\/\/investidor10\.com\.br\/setores\/([a-z0-9-]+)\/"/;
const SUBSECTOR_SNIPPET =
	/no\s+segmento\s+<a\s+href="https:\/\/investidor10\.com\.br\/setores\/[a-z0-9-]+\/[a-z0-9-]+\/([a-z0-9-]+)\/"/;

function extractName(html: string): string {
	const m = html.match(LOGO_TITLE);
	return m ? m[1].trim() : '';
}

export function parseAssetMeta(html: string, ticker: string, type: AssetType): AssetMeta {
	const companyId = html.match(COMPANY_ID)?.[1];
	const tickerId = type === 'acao' ? html.match(TICKER_ID)?.[1] : undefined;

	return {
		ticker,
		type,
		name: extractName(html),
		companyId: companyId ? Number(companyId) : null,
		tickerId: tickerId ? Number(tickerId) : null,
		sector: type === 'acao' ? (html.match(SECTOR_SNIPPET)?.[1] ?? null) : null,
		subsector: type === 'acao' ? (html.match(SUBSECTOR_SNIPPET)?.[1] ?? null) : null
	};
}

export async function fetchAssetMeta(ticker: string, type: AssetType): Promise<AssetMeta> {
	const html = await getText(`/${type === 'acao' ? 'acoes' : 'fiis'}/${ticker.toLowerCase()}/`);
	return parseAssetMeta(html, ticker, type);
}
