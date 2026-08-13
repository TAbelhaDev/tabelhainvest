import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSitemapTickers } from './universe';
import { parseAssetMeta } from './asset-meta';

const fixture = (name: string) =>
	readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');

describe('parseSitemapTickers', () => {
	it('parses every stock ticker from the acoes sitemap', () => {
		const assets = parseSitemapTickers(fixture('sitemap-acoes.xml'), 'acao');
		// 649 standard B3 tickers + 14 with a digit/class-suffix in the code.
		expect(assets.length).toBe(663);
		expect(assets[0]).toEqual({ ticker: 'AALR3', type: 'acao' });
		expect(assets.some((a) => a.ticker === 'PETR4')).toBe(true);
	});

	it('parses every REIT ticker from the fiis sitemap', () => {
		const assets = parseSitemapTickers(fixture('sitemap-fiis.xml'), 'fii');
		// 715 standard + SPG211 (6-char code).
		expect(assets.length).toBe(716);
		expect(assets.some((a) => a.ticker === 'HGLG11')).toBe(true);
	});

	it('excludes listing pages and keeps special-coded tickers', () => {
		const assets = parseSitemapTickers(fixture('sitemap-acoes.xml'), 'acao');
		const tickers = new Set(assets.map((a) => a.ticker));
		expect(tickers.has('ALL')).toBe(false);
		expect(tickers.has('ALL2')).toBe(false);
		expect(tickers.has('IPO')).toBe(false);
		// Special codes the strict 4-letter+digits pattern would drop.
		expect(tickers.has('B3SA3')).toBe(true);
		expect(tickers.has('G2DI33')).toBe(true);
		expect(tickers.has('ANDG3B')).toBe(true);
	});
});

describe('parseAssetMeta', () => {
	it('extracts company_id, ticker_id, name, sector and subsector from a stock page', () => {
		const meta = parseAssetMeta(fixture('page-petr4.html'), 'PETR4', 'acao');
		expect(meta.ticker).toBe('PETR4');
		expect(meta.type).toBe('acao');
		expect(meta.companyId).toBe(2);
		expect(meta.tickerId).toBe(4);
		expect(meta.name).toBe('PETROLEO BRASILEIRO S.A. PETROBRAS');
		expect(meta.sector).toBe('petroleo-gas-e-biocombustiveis');
		expect(meta.subsector).toBe('exploracao-refino-e-distribuicao');
	});

	it('extracts company_id (no ticker_id, no sector) from a REIT page', () => {
		const meta = parseAssetMeta(fixture('page-hglg11.html'), 'HGLG11', 'fii');
		expect(meta.companyId).toBe(24);
		expect(meta.tickerId).toBeNull();
		expect(meta.sector).toBeNull();
		expect(meta.subsector).toBeNull();
	});
});
