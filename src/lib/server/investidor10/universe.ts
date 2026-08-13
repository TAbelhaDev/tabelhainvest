// Asset universe — the list of tickers the screener covers, pulled from the
// public sitemaps (PLANO.md §Camada de dados). investidor10 publishes one
// sitemap per asset class; we read the ticker page URLs from them.
//
// A ticker page URL looks like /acoes/petr4/ or /fiis/hglg11/ — lowercase. The
// ticker itself (PETR4, HGLG11) is the last path segment, uppercased.

import { getText } from './client';

export type AssetType = 'acao' | 'fii';

const SITEMAPS: Record<AssetType, string> = {
	acao: '/sitemap-acoes.xml',
	fii: '/sitemap-fiis.xml'
};

// A B3 ticker page under /acoes/ or /fiis/. Tickers are usually 4 letters + 1-2
// digits (PETR4, HGLG11, SANB11) but some carry a digit in the code itself
// (B3SA3, G2DI33) or a class suffix (ANDG3B). Everything else under those
// sections is a listing page (all, all2, ipo, dividendos, rankings...).
const TICKER_PAGE =
	/<loc>https:\/\/investidor10\.com\.br\/(?:acoes|fiis)\/([a-z0-9]{4,6})\/<\/loc>/g;

// Listing pages that match the ticker pattern above but are not assets.
const NON_TICKERS = new Set(['all', 'all2', 'ipo']);

export interface UniverseAsset {
	ticker: string;
	type: AssetType;
}

export function parseSitemapTickers(xml: string, type: AssetType): UniverseAsset[] {
	const found = new Set<string>();
	TICKER_PAGE.lastIndex = 0;
	for (const match of xml.matchAll(TICKER_PAGE)) {
		const ticker = match[1].toUpperCase();
		if (NON_TICKERS.has(match[1])) continue;
		found.add(ticker);
	}
	return [...found].sort().map((ticker) => ({ ticker, type }));
}

export async function fetchUniverse(): Promise<UniverseAsset[]> {
	const entries = await Promise.all(
		(Object.keys(SITEMAPS) as AssetType[]).map(async (type) => {
			const xml = await getText(SITEMAPS[type]);
			return parseSitemapTickers(xml, type);
		})
	);
	return entries.flat();
}
