import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAiProvider, streamChat, sse, type AiChatMessage } from '$lib/server/ai/client';
import { getDb } from '$lib/server/db';
import { getAssetDetail } from '$lib/server/db/asset-detail';

// Chat about a single asset — the AI gets the asset's indicators and recent
// dividends as context, and streams an answer. Stateless (no persisted
// conversation): the client keeps the message history and sends it back.
//
// Body: { ticker, messages: AiChatMessage[] }
export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.userId) return json({ error: 'Não autenticado.' }, { status: 401 });

	let body: { ticker?: string; messages?: AiChatMessage[] };
	try {
		body = (await request.json()) as { ticker?: string; messages?: AiChatMessage[] };
	} catch {
		return json({ error: 'Corpo inválido.' }, { status: 400 });
	}
	const ticker = body?.ticker?.trim().toUpperCase();
	const messages = body?.messages ?? [];
	if (!ticker) return json({ error: 'Ticker inválido.' }, { status: 400 });
	if (messages.length === 0) return json({ error: 'Sem mensagem.' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const detail = await getAssetDetail(db, ticker);
	if (!detail) return json({ error: 'Ativo não encontrado.' }, { status: 404 });

	let config;
	try {
		config = await getAiProvider(platform!.env, locals.userId);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Erro de configuração.' },
			{ status: 400 }
		);
	}

	const context = buildAssetContext(detail, ticker);
	// Inject the system prompt + asset context at the front; the client's
	// history follows.
	const system: AiChatMessage = {
		role: 'system',
		content: `Você é um analista de investimentos brasileiro (B3), consultor do usuário do TAbelhaInvest.
Responda em português do Brasil, de forma direta.
Use somente os dados abaixo do ativo — não invente indicadores.
Mencione que dados de mercado passados não garantem retorno futuro quando der uma opinião de compra/venda.

Dados do ativo ${ticker}:
${context}`
	};
	const fullMessages = [system, ...messages.filter((m) => m.role !== 'system').slice(-20)];

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				await streamChat(config!, fullMessages, controller);
				sse(controller, { done: true });
			} catch (err) {
				sse(controller, {
					error: err instanceof Error ? err.message : 'Erro ao gerar resposta.'
				});
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

function buildAssetContext(
	detail: NonNullable<Awaited<ReturnType<typeof getAssetDetail>>>,
	ticker: string
): string {
	const { asset, quote, indicatorRows, fiiIndicator, dividendRows } = detail;
	const lines: string[] = [];
	lines.push(`- Ticker: ${ticker} (${asset.type === 'acao' ? 'ação' : 'FII'})`);
	lines.push(`- Nome: ${asset.name}`);
	if (asset.sector) lines.push(`- Setor: ${asset.sector}`);
	if (asset.subsector) lines.push(`- Subsetor: ${asset.subsector}`);
	if (quote?.price) lines.push(`- Preço: R$ ${quote.price.toFixed(2)}`);

	const indicator = indicatorRows[0];
	if (asset.type === 'acao' && indicator) {
		const i = indicator;
		const fields: Array<[string, number | null | undefined]> = [
			['P/L', i.p_l],
			['P/VP', i.p_vp],
			['ROE (%)', i.roe],
			['Margem líquida (%)', i.netMargin],
			['DY 12m (%)', i.dy12m],
			['DY 5a (%)', i.dy5y],
			['Cresc. lucro 5a (%)', i.growthNetProfit5y],
			['Cresc. receita 5a (%)', i.growthNetRevenue5y],
			['Dívida/Patrimônio (%)', i.grossDebtNetWorth],
			['Payout (%)', i.payout],
			['LPA', i.lpa],
			['VPA', i.vpa]
		];
		for (const [label, v] of fields) {
			if (v != null) lines.push(`- ${label}: ${v}`);
		}
	} else if (asset.type === 'fii' && fiiIndicator) {
		const f = fiiIndicator;
		if (f.p_vp != null) lines.push(`- P/VP: ${f.p_vp}`);
		if (f.dividendYield != null) lines.push(`- Dividend yield (%): ${f.dividendYield}`);
		if (f.netWorth != null) lines.push(`- Valor patrimonial: R$ ${f.netWorth}`);
	}

	if (dividendRows.length > 0) {
		lines.push(`- Proventos recentes (${dividendRows.length}):`);
		for (const d of dividendRows.slice(0, 12)) {
			const date = d.payDate ? d.payDate.toISOString().slice(0, 10) : '?';
			lines.push(`  * ${date}: R$ ${d.value ?? 0}`);
		}
	}

	return lines.join('\n');
}
