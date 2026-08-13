import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAiProvider, streamChat, sse } from '$lib/server/ai/client';
import { buildAnalysisMessages } from '$lib/server/ai/prompts';
import type { ScreenerRow } from '$lib/screener/types';

// Analyzes a filtered set from the screener: the user asks the AI to explain
// why the assets passed, or to suggest a selection from them. Streams SSE.
//
// Body: { rows: ScreenerRow[], prompt?: string }
// The rows are the *already-filtered* set (the client has them), so the AI gets
// exactly what the user is looking at.
export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.userId) return json({ error: 'Não autenticado.' }, { status: 401 });

	let body: { rows?: ScreenerRow[]; prompt?: string };
	try {
		body = (await request.json()) as { rows?: ScreenerRow[]; prompt?: string };
	} catch {
		return json({ error: 'Corpo inválido.' }, { status: 400 });
	}
	const rows = body?.rows ?? [];
	const prompt = body?.prompt?.trim();
	if (rows.length === 0) {
		return json({ error: 'Nenhum ativo para analisar.' }, { status: 400 });
	}

	let config;
	try {
		config = await getAiProvider(platform!.env, locals.userId);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Erro de configuração.' },
			{ status: 400 }
		);
	}

	const messages = buildAnalysisMessages(rows, prompt);

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				await streamChat(config!, messages, controller);
				sse(controller, { done: true });
			} catch (err) {
				sse(controller, {
					error: err instanceof Error ? err.message : 'Erro ao gerar análise.'
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
