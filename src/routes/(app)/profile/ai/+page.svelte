<script lang="ts">
	import { Button, Card, Input, Label, Select } from '@tabeladev/tabelawebui';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AI_PROVIDERS, type AiProvider } from '$lib/ai-providers';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let provider = $state<AiProvider>('deepseek');
	let model = $state<string>(AI_PROVIDERS.deepseek.models[0].id);
	let apiKey = $state('');
	let submitting = $state(false);
	let error = $state('');
	let saved = $state(false);

	$effect(() => {
		const models = AI_PROVIDERS[provider].models;
		if (!models.some((m) => m.id === model)) model = models[0].id;
	});

	async function save() {
		if (!apiKey.trim()) {
			error = 'Informe sua API key.';
			return;
		}
		submitting = true;
		error = '';
		saved = false;
		try {
			const res = await fetch('/api/onboarding/ai', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ provider, model, apiKey })
			});
			const body = (await res.json()) as { error?: string };
			if (!res.ok || body.error) {
				error = body.error ?? 'Não foi possível salvar. Tente novamente.';
				return;
			}
			apiKey = '';
			saved = true;
			await invalidateAll();
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Configurar IA: TabelaInvest</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-md flex-col gap-6">
	<header>
		<a href={resolve('/profile')} class="font-mono text-xs text-ink-soft hover:text-ink">← Perfil</a
		>
		<h1 class="mt-2 font-mono text-2xl font-bold">Configurar IA</h1>
		<p class="font-mono text-sm text-ink-soft">
			<span class="text-ink-faint">//</span> Sua chave, seu provedor, seu modelo. BYOK.
		</p>
	</header>

	<Card>
		<Card.Content>
			{#if data.aiConfigured}
				<div
					class="mb-4 flex items-center justify-between gap-3 border border-signal bg-signal-soft px-3 py-2"
				>
					<p class="font-mono text-xs text-signal">
						Configurada: {data.aiProvider} · {data.aiModel}
					</p>
				</div>
			{/if}

			<form
				class="flex flex-col gap-4"
				onsubmit={(e) => {
					e.preventDefault();
					save();
				}}
			>
				<div class="flex flex-col gap-2">
					<Label for="provider">Provedor</Label>
					<Select
						id="provider"
						bind:value={provider}
						options={Object.entries(AI_PROVIDERS).map(([value, p]) => ({ value, label: p.label }))}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="model">Modelo</Label>
					<Select
						id="model"
						bind:value={model}
						options={AI_PROVIDERS[provider].models.map((m) => ({ value: m.id, label: m.id }))}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="apiKey">API key</Label>
					<Input
						id="apiKey"
						bind:value={apiKey}
						type="password"
						autocomplete="off"
						placeholder="sk-..."
						required
					/>
					<p class="font-mono text-xs text-ink-faint">
						Fica criptografada. Sem chave, o app funciona só com regras.
					</p>
				</div>

				{#if error}
					<p class="text-sm text-danger">{error}</p>
				{/if}
				{#if saved}
					<p class="text-sm text-signal">Chave salva.</p>
				{/if}

				<Button type="submit" disabled={submitting}>
					{submitting ? 'Salvando...' : 'Salvar chave'}
				</Button>
			</form>
		</Card.Content>
	</Card>
</div>
