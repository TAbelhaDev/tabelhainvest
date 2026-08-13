import { describe, expect, it } from 'vitest';
import { rowToLine, buildAnalysisMessages } from './prompts';
import type { ScreenerRow } from '$lib/screener/types';

function makeRow(overrides: Partial<ScreenerRow>): ScreenerRow {
	return {
		id: 'x',
		ticker: 'X',
		type: 'acao',
		name: 'X',
		price: 10,
		sector: 's',
		p_l: null,
		p_vp: null,
		roe: null,
		netMargin: null,
		dy12m: null,
		dy5y: null,
		growthNetProfit5y: null,
		growthNetRevenue5y: null,
		grossDebtNetWorth: null,
		lpa: null,
		vpa: null,
		payout: null,
		fiiPvP: null,
		fiiDy: null,
		fiiNetWorth: null,
		bazinPrice: null,
		bazinUpside: null,
		grahamPrice: null,
		grahamUpside: null,
		score: null,
		watched: false,
		...overrides
	};
}

describe('rowToLine', () => {
	it('includes the ticker, type, price, sector and present indicators', () => {
		const line = rowToLine(makeRow({ ticker: 'PETR4', dy12m: 7.06, p_l: 3.99 }));
		expect(line).toContain('PETR4');
		expect(line).toContain('ação');
		expect(line).toContain('preço=10');
		expect(line).toContain('setor=s');
		expect(line).toContain('DY 12m (%)=7.06');
		expect(line).toContain('P/L=3.99');
	});

	it('labels a REIT and skips null indicators', () => {
		const line = rowToLine(makeRow({ ticker: 'HGLG11', type: 'fii', fiiDy: 9.09 }));
		expect(line).toContain('HGLG11 (FII)');
		expect(line).toContain('DY (FII) (%)=9.09');
		expect(line).not.toContain('P/L');
	});
});

describe('buildAnalysisMessages', () => {
	it('builds system + user messages with the filtered rows', () => {
		const messages = buildAnalysisMessages([makeRow({ ticker: 'PETR4' })]);
		expect(messages.length).toBe(2);
		expect(messages[0].role).toBe('system');
		expect(messages[1].role).toBe('user');
		expect(messages[1].content).toContain('PETR4');
		expect(messages[1].content).toContain('Ativos filtrados');
	});

	it('uses the custom prompt when given', () => {
		const messages = buildAnalysisMessages(
			[makeRow({ ticker: 'PETR4' })],
			'Quais são os melhores para renda?'
		);
		expect(messages[1].content).toContain('Quais são os melhores para renda?');
		expect(messages[1].content).toContain('PETR4');
	});
});
