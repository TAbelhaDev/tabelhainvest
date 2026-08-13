<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, Table } from '@tabeladev/tabelawebui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
</script>

<svelte:head>
	<title>Watchlist — TabelaInvest</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header>
		<h1 class="font-mono text-2xl font-bold">Watchlist</h1>
		<p class="font-mono text-sm text-ink-soft">
			<span class="text-ink-faint">//</span>
			{data.rows.length} ativos acompanhados
		</p>
	</header>

	<Card>
		<Card.Content>
			<Table
				columns={[
					{ key: 'ticker', label: 'Ticker', sortable: true },
					{ key: 'name', label: 'Nome' },
					{ key: 'type', label: 'Tipo' },
					{ key: 'sector', label: 'Setor / Segmento' },
					{ key: 'price', label: 'Preço', sortable: true }
				]}
				rows={data.rows.map((r) => ({ ...r }))}
				rowKey="id"
				pageSize={25}
				pageSizeOptions={[10, 25, 50]}
			>
				{#snippet cell(row: Record<string, unknown>, key: string)}
					{#if key === 'ticker'}
						<a
							href={resolve(`/assets/${String(row.ticker).toLowerCase()}`)}
							class="font-medium text-accent hover:underline">{row.ticker}</a
						>
					{:else if key === 'type'}
						<span class="text-xs text-ink-soft">{row.type === 'acao' ? 'Ação' : 'FII'}</span>
					{:else if key === 'price'}
						<span>{row.price ? currency.format(Number(row.price)) : '—'}</span>
					{:else}
						<span class="text-ink-soft">{String(row[key] ?? '—')}</span>
					{/if}
				{/snippet}
				{#snippet empty()}
					<p class="py-8 text-center font-mono text-sm text-ink-soft">
						Sua watchlist está vazia. Marque ativos no
						<a href={resolve('/screener')} class="text-accent hover:underline">screener</a>.
					</p>
				{/snippet}
			</Table>
		</Card.Content>
	</Card>
</div>
