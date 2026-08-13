// Shared AI dispatch for BYOK (PLANO.md §IA). The user's own provider/model/key
// come from ai_credentials; the key is decrypted with MASTER_KEY. Streaming is
// SSE to the client — same fetch()-only pattern as TabelaFin (no SDK, so it
// runs in workerd).
//
// Two entry points:
//   streamChat(messages)          — streaming chat, used by both the asset chat
//                                   and the filter analysis.
//   getAiProvider(env, userId)    — resolves + decrypts the credentials, or
//                                   throws with a message the UI can show.

import type { AiProvider } from '$lib/ai-providers';
import { decryptSecret } from '$lib/server/crypto';
import { getDb } from '$lib/server/db';
import { getAiCredentials } from '$lib/server/db/ai-credentials';

export interface AiChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface AiProviderConfig {
	provider: AiProvider;
	model: string;
	apiKey: string;
}

// Resolves the user's AI credentials and decrypts the key. Throws with a
// user-facing message when not configured or unreadable.
export async function getAiProvider(env: Env, userId: string): Promise<AiProviderConfig> {
	const db = getDb(env.DB);
	const creds = await getAiCredentials(db, userId);
	if (!creds) {
		throw new Error('IA não configurada. Adicione sua chave de API no Perfil.');
	}
	let apiKey: string;
	try {
		apiKey = await decryptSecret(
			env.MASTER_KEY,
			{ ciphertext: creds.keyEncrypted, nonce: creds.nonce, v: creds.v ?? undefined },
			{ purpose: 'ai_credentials', userId }
		);
	} catch {
		throw new Error('Erro ao ler a chave de IA configurada.');
	}
	return { provider: creds.provider as AiProvider, model: creds.model, apiKey };
}

// SSE helper: enqueues a JSON line in the `data: {...}` format the client
// streams from.
export function sse(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
	const encoder = new TextEncoder();
	controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

// Streams a chat completion from the configured provider as SSE. Each chunk is
// `{ text }`; terminal events are `{ done: true }` or `{ error }`.
export async function streamChat(
	config: AiProviderConfig,
	messages: AiChatMessage[],
	controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
	if (config.provider === 'anthropic') {
		return streamAnthropic(config, messages, controller);
	}
	// OpenAI and DeepSeek speak the same chat-completions format.
	const apiUrl =
		config.provider === 'openai'
			? 'https://api.openai.com/v1/chat/completions'
			: 'https://api.deepseek.com/chat/completions';
	return streamOpenAiCompatible(config, apiUrl, messages, controller);
}

async function streamAnthropic(
	config: AiProviderConfig,
	messages: AiChatMessage[],
	controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
	const system = messages.find((m) => m.role === 'system')?.content ?? '';
	const rest = messages.filter((m) => m.role !== 'system');

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': config.apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: config.model,
			max_tokens: 4096,
			system,
			messages: rest,
			stream: true
		})
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Anthropic API error: ${res.status} ${err}`);
	}

	const reader = res.body?.getReader();
	if (!reader) throw new Error('Sem stream da Anthropic');
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.startsWith('data: ')) continue;
			const data = line.slice(6).trim();
			if (data === '[DONE]') continue;
			try {
				const parsed = JSON.parse(data) as {
					type?: string;
					delta?: { text?: string };
				};
				if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
					sse(controller, { text: parsed.delta.text });
				}
			} catch {
				// skip malformed SSE lines
			}
		}
	}
}

async function streamOpenAiCompatible(
	config: AiProviderConfig,
	apiUrl: string,
	messages: AiChatMessage[],
	controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
	const res = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${config.apiKey}`
		},
		body: JSON.stringify({
			model: config.model,
			messages,
			stream: true
		})
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`${apiUrl} error: ${res.status} ${err}`);
	}

	const reader = res.body?.getReader();
	if (!reader) throw new Error(`Sem stream de ${apiUrl}`);
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.startsWith('data: ')) continue;
			const data = line.slice(6).trim();
			if (data === '[DONE]') continue;
			try {
				const parsed = JSON.parse(data) as {
					choices?: Array<{ delta?: { content?: string } }>;
				};
				const content = parsed.choices?.[0]?.delta?.content;
				if (content) sse(controller, { text: content });
			} catch {
				// skip malformed SSE lines
			}
		}
	}
}
