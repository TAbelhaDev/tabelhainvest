<script lang="ts">
	// Reusable AI chat panel. Props:
	//   endpoint  — the API endpoint that streams SSE ({ text } | { done } | { error })
	//   buildBody — () => the JSON body for the endpoint
	//   title     — panel header
	//   placeholder — input placeholder
	//   emptyHint — text shown when there is no conversation yet
	import { Button } from '@tabeladev/tabelawebui';

	let {
		endpoint,
		buildBody,
		title = 'IA',
		placeholder = 'Pergunte sobre o ativo...',
		emptyHint = 'Pergunte algo sobre este ativo.'
	}: {
		endpoint: string;
		// Receives the accumulated conversation (user/assistant turns) so the
		// endpoint can carry the history. Returns the JSON body.
		buildBody: (
			history: Array<{ role: 'user' | 'assistant'; content: string }>
		) => Record<string, unknown>;
		title?: string;
		placeholder?: string;
		emptyHint?: string;
	} = $props();

	let messages = $state<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
	let input = $state('');
	let streaming = $state(false);
	let error = $state('');

	async function send() {
		const text = input.trim();
		if (!text || streaming) return;
		input = '';
		error = '';
		const history = [...messages, { role: 'user' as const, content: text }];
		messages = history;
		messages = [...messages, { role: 'assistant', content: '' }];
		streaming = true;

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(buildBody(history))
			});

			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body?.error ?? `Erro ${res.status}`);
			}
			if (!res.body) throw new Error('Sem stream.');

			const reader = res.body.getReader();
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
					const payload = JSON.parse(line.slice(6).trim()) as {
						text?: string;
						done?: boolean;
						error?: string;
					};
					if (payload.error) throw new Error(payload.error);
					if (payload.text) {
						const last = messages.at(-1);
						messages = [
							...messages.slice(0, -1),
							{ role: 'assistant', content: (last?.content ?? '') + payload.text }
						];
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erro ao gerar resposta.';
		} finally {
			streaming = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<h2 class="font-mono text-sm font-semibold">{title}</h2>

	{#if messages.length === 0}
		<p class="font-mono text-xs text-ink-soft">{emptyHint}</p>
	{:else}
		<div class="flex max-h-96 flex-col gap-2 overflow-y-auto border border-rule p-3">
			{#each messages as m, i (i)}
				<div class:flex-row-reverse={m.role === 'user'} class="flex w-full">
					<div
						class:bg-accent-soft={m.role === 'user'}
						class="max-w-[85%] border border-rule px-3 py-2 font-mono text-xs whitespace-pre-wrap"
					>
						{#if m.role === 'assistant' && m.content === ''}
							<span class="text-ink-faint">pensando...</span>
						{:else}
							{m.content}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{/if}

	<form
		class="flex items-end gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			send();
		}}
	>
		<input
			bind:value={input}
			class="w-full border border-rule bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent"
			{placeholder}
			aria-label={placeholder}
			disabled={streaming}
		/>
		<Button type="submit" disabled={streaming}>
			{streaming ? '...' : 'Enviar'}
		</Button>
	</form>
</div>
