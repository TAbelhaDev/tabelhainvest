<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Card, Divider } from '@tabeladev/tabelawebui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Perfil — TabelaInvest</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header>
		<h1 class="font-mono text-2xl font-bold">Perfil</h1>
		<p class="font-mono text-sm text-ink-soft">
			<span class="text-ink-faint">//</span> Gerencie sua conta e sua chave de IA.
		</p>
	</header>

	<!-- Dados da conta -->
	<Card>
		<Card.Content>
			<div class="flex flex-col gap-3">
				<h2 class="font-mono text-sm font-semibold">Dados da conta</h2>
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs text-ink-faint">Nome:</span>
						<span class="font-mono text-sm">{data.user?.name || 'Não informado'}</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs text-ink-faint">E-mail:</span>
						<span class="font-mono text-sm">{data.user?.email}</span>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card>

	<div class="my-6">
		<Divider label="IA" />
	</div>

	<!-- IA BYOK -->
	<Card>
		<Card.Content>
			<div class="flex items-center justify-between gap-4">
				<div>
					<h2 class="font-mono text-sm font-semibold">IA (BYOK)</h2>
					<p class="mt-1 font-mono text-xs text-ink-soft">
						Chave própria pra analisar o screener e conversar sobre ativos. Sem IA, o app funciona
						só com regras.
					</p>
				</div>
				{#if data.aiConfigured}
					<span
						class="border border-signal bg-signal-soft px-3 py-1 font-mono text-xs font-medium text-signal"
						>Configurada</span
					>
				{:else}
					<span
						class="border border-danger bg-danger-soft px-3 py-1 font-mono text-xs font-medium text-danger"
						>Não configurada</span
					>
				{/if}
			</div>
			<div class="mt-3 flex items-center justify-between gap-3">
				{#if data.aiConfigured}
					<p class="font-mono text-xs text-ink-soft">
						Provedor: {data.aiProvider} · Modelo: {data.aiModel}
					</p>
					<a href={resolve('/profile/ai')}>
						<Button variant="outline" size="sm">Alterar</Button>
					</a>
				{:else}
					<p class="font-mono text-xs text-ink-soft">Nenhuma chave configurada ainda.</p>
					<a href={resolve('/profile/ai')}>
						<Button variant="primary" size="sm">Configurar IA</Button>
					</a>
				{/if}
			</div>
		</Card.Content>
	</Card>
</div>
