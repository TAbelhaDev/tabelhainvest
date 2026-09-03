// Prompt construction for the BYOK AI features (PLANO.md §IA) — pure functions
// so they are unit-testable without a network or a D1.

import type { ScreenerRow } from '$lib/screener/types';
import type { AiChatMessage } from './client';

const ANALYSIS_SYSTEM = `Você é um analista de investimentos brasileiro (B3), consultor do usuário do TAbelhaInvest.
Responda em português do Brasil, de forma direta e sem caixa preta.
Use somente os dados fornecidos no contexto — não invente indicadores nem números.
Quando sugerir uma seleção, priorize fundamentos e mencione os riscos do que estiver destacando.
Seja honesto: dados de mercado passados não garantem retorno futuro.`;

const INDICATOR_LABELS: Record<string, string> = {
	p_l: 'P/L',
	p_vp: 'P/VP',
	roe: 'ROE (%)',
	netMargin: 'Margem líquida (%)',
	dy12m: 'DY 12m (%)',
	dy5y: 'DY 5a (%)',
	growthNetProfit5y: 'Cresc. lucro 5a (%)',
	growthNetRevenue5y: 'Cresc. receita 5a (%)',
	grossDebtNetWorth: 'Dívida/Patrimônio (%)',
	fiiPvP: 'P/VP (FII)',
	fiiDy: 'DY (FII) (%)',
	bazinUpside: 'Upside Bazin (%)',
	grahamUpside: 'Upside Graham (%)',
	score: 'Score (0-100)'
};

export function rowToLine(row: ScreenerRow): string {
	const fields: string[] = [
		`${row.ticker} (${row.type === 'acao' ? 'ação' : 'FII'})`,
		`preço=${row.price ?? '—'}`
	];
	if (row.sector) fields.push(`setor=${row.sector}`);
	for (const [key, label] of Object.entries(INDICATOR_LABELS)) {
		const v = row[key as keyof ScreenerRow];
		if (v != null && typeof v === 'number') fields.push(`${label}=${v}`);
	}
	return fields.join(' | ');
}

export function buildAnalysisMessages(rows: ScreenerRow[], prompt?: string): AiChatMessage[] {
	const listed = rows
		.slice(0, 200) // keep the prompt bounded
		.map(rowToLine)
		.join('\n');

	const user = prompt
		? `${prompt}\n\nAtivos filtrados:\n${listed}`
		: `Analise o conjunto de ativos filtrados abaixo. Explique, em resumo, o que eles têm em comum
(os padrões dos indicadores), destaque os mais interessantes com justificativa, e aponte riscos.
Mencione os tickers pelo código.\n\nAtivos filtrados:\n${listed}`;

	return [
		{ role: 'system', content: ANALYSIS_SYSTEM },
		{ role: 'user', content: user }
	];
}
