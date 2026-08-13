<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button, Card, Input, Label, MultiSelect, Select, Table } from '@tabeladev/tabelawebui';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ChatPanel from '$lib/ChatPanel.svelte';
	import { STRATEGIES, type StrategyId } from '$lib/screener/strategies';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: import('./$types').ActionData } = $props();

	const RANGES = [
		{ key: 'p_l', label: 'P/L' },
		{ key: 'p_vp', label: 'P/VP' },
		{ key: 'roe', label: 'ROE (%)' },
		{ key: 'netMargin', label: 'Margem líquida (%)' },
		{ key: 'dy12m', label: 'DY 12m (%)' },
		{ key: 'dy5y', label: 'DY 5 anos (%)' },
		{ key: 'growthNetProfit5y', label: 'Cresc. lucro 5a (%)' },
		{ key: 'growthNetRevenue5y', label: 'Cresc. receita 5a (%)' },
		{ key: 'fiiPvP', label: 'P/VP (FII)' },
		{ key: 'fiiDy', label: 'DY (FII) (%)' }
	];

	// Local filter state, seeded from the URL-derived filters in data.
	let types = $state<string[]>(data.filters.types.length ? data.filters.types : ['acao', 'fii']);
	let query = $state(data.filters.query);
	let sectors = $state<string[]>(data.filters.sectors);
	let segments = $state<string[]>(data.filters.segments);
	let strategyStr = $state<string>(data.strategy ?? '');
	let scoringOn = $state<boolean>(Boolean(data.filters.scoring));
	let showFilters = $state(false);
	let analyzeOpen = $state(false);

	const rangeValues = $state<Record<string, { min: string; max: string }>>(
		Object.fromEntries(
			RANGES.map((r) => [
				r.key,
				{
					min: data.filters.ranges[r.key]?.min?.toString() ?? '',
					max: data.filters.ranges[r.key]?.max?.toString() ?? ''
				}
			])
		)
	);

	const strategyOptions = Object.entries(STRATEGIES).map(([value, s]) => ({
		value,
		label: s.label
	}));

	const typeOptions = [
		{ value: 'acao', label: 'Ações' },
		{ value: 'fii', label: 'FIIs' }
	];

	function buildFilterUrl(): string {
		const params = new SvelteURLSearchParams();
		if (types.length && types.length < 2) params.set('types', types.join(','));
		if (query) params.set('q', query);
		for (const s of sectors) params.append('sector', s);
		for (const s of segments) params.append('segment', s);
		for (const [key, v] of Object.entries(rangeValues)) {
			if (v.min) params.set(`min_${key}`, v.min);
			if (v.max) params.set(`max_${key}`, v.max);
		}
		if (strategyStr) params.set('strategy', strategyStr);
		if (scoringOn) {
			params.set(
				'scoring',
				Object.entries(data.scoringWeights)
					.map(([k, w]) => `${k}:${w}`)
					.join(',')
			);
		}
		const qs = params.toString();
		return qs ? `/screener?${qs}` : '/screener';
	}

	function apply() {
		window.location.href = buildFilterUrl();
	}

	function reset() {
		window.location.href = '/screener';
	}

	// Scoring weight inputs (editable when scoring is on).
	const weightValues = $state<Record<string, string>>(
		Object.fromEntries(Object.entries(data.scoringWeights).map(([k, w]) => [k, String(w)]))
	);

	const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

	function fmt(v: unknown): string {
		if (v == null || v === '') return '—';
		const n = Number(v);
		if (!Number.isFinite(n)) return '—';
		return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
	}

	function pct(v: unknown): string {
		if (v == null) return '—';
		const n = Number(v);
		if (!Number.isFinite(n)) return '—';
		return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
	}
</script>

<svelte:head>
	<title>Screener — TabelaInvest</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-mono text-2xl font-bold">Screener</h1>
			<p class="font-mono text-sm text-ink-soft">
				<span class="text-ink-faint">//</span>
				{data.rows.length} ativos
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Input
				bind:value={query}
				type="search"
				placeholder="Buscar ticker ou nome..."
				class="w-56!"
				onkeydown={(e) => {
					if (e.key === 'Enter') apply();
				}}
			/>
			<Button onclick={apply} variant="primary">Aplicar</Button>
			<Button onclick={() => (showFilters = !showFilters)} variant="outline">
				Filtros {showFilters ? '▲' : '▼'}
			</Button>
			<Button onclick={() => (analyzeOpen = !analyzeOpen)} variant="outline">
				IA {analyzeOpen ? '▲' : '▼'}
			</Button>
			<Button onclick={reset} variant="ghost">Limpar</Button>
		</div>
	</header>

	{#if showFilters}
		<Card>
			<Card.Content>
				<form
					class="flex flex-col gap-5"
					onsubmit={(e) => {
						e.preventDefault();
						apply();
					}}
				>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
						<div class="flex flex-col gap-2">
							<Label>Tipos</Label>
							<MultiSelect bind:value={types} options={typeOptions} placeholder="Ações e FIIs" />
						</div>
						<div class="flex flex-col gap-2">
							<Label>Setor (ações)</Label>
							<MultiSelect
								bind:value={sectors}
								options={data.options.sectors.map((s) => ({ value: s, label: s }))}
								placeholder="Todos os setores"
								filter
							/>
						</div>
						<div class="flex flex-col gap-2">
							<Label>Segmento (FIIs)</Label>
							<MultiSelect
								bind:value={segments}
								options={data.options.segments.map((s) => ({ value: s, label: s }))}
								placeholder="Todos os segmentos"
								filter
							/>
						</div>
						<div class="flex flex-col gap-2">
							<Label>Estratégia</Label>
							<Select
								bind:value={strategyStr}
								options={[{ value: '', label: 'Sem estratégia' }, ...strategyOptions]}
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
						{#each RANGES as r (r.key)}
							<div class="flex flex-col gap-1">
								<span class="font-mono text-xs text-ink-soft">{r.label}</span>
								<div class="flex items-center gap-1">
									<Input
										bind:value={rangeValues[r.key].min}
										type="number"
										step="any"
										placeholder="mín"
										class="w-full!"
									/>
									<span class="text-ink-faint">–</span>
									<Input
										bind:value={rangeValues[r.key].max}
										type="number"
										step="any"
										placeholder="máx"
										class="w-full!"
									/>
								</div>
							</div>
						{/each}
					</div>

					<div class="flex items-center gap-3">
						<label class="flex cursor-pointer items-center gap-2">
							<input type="checkbox" bind:checked={scoringOn} class="h-4 w-4 accent-ctp-green" />
							<span class="font-mono text-sm text-ink-soft">Score por regras</span>
						</label>
						{#if scoringOn}
							<div class="flex flex-wrap items-center gap-2">
								{#each Object.keys(weightValues) as key (key)}
									<label class="flex items-center gap-1 font-mono text-xs text-ink-soft">
										{key}
										<Input bind:value={weightValues[key]} type="number" step="0.5" class="w-16!" />
									</label>
								{/each}
							</div>
						{/if}
						<Button type="submit" variant="primary">Aplicar filtros</Button>
					</div>

					{#if data.hasScore}
						<p class="font-mono text-xs text-ink-soft">
							Coluna "Score" mostra 0–100 por regras, maior é melhor.
						</p>
					{/if}
				</form>
			</Card.Content>
		</Card>
	{/if}

	{#if strategyStr && strategyStr in STRATEGIES}
		<div class="flex items-center gap-2">
			<span
				class="border border-accent bg-accent-soft px-3 py-1 font-mono text-xs font-medium text-accent"
			>
				Estratégia: {STRATEGIES[strategyStr as StrategyId].label}
			</span>
			<span class="font-mono text-xs text-ink-faint">
				{STRATEGIES[strategyStr as StrategyId].description}
			</span>
		</div>
	{/if}

	{#if analyzeOpen}
		<Card>
			<Card.Content>
				<ChatPanel
					endpoint="/api/analyze"
					title="Análise do conjunto filtrado"
					placeholder="Ex.: monte uma seleção de 5 com base nesses filtros."
					emptyHint={`${data.rows.length} ativos no filtro. Peça uma análise ou sugestão de seleção.`}
					buildBody={() => ({ rows: data.rows })}
				/>
			</Card.Content>
		</Card>
	{/if}

	<Card>
		<Card.Content>
			<Table
				columns={[
					{ key: 'ticker', label: 'Ticker', sortable: true },
					{ key: 'name', label: 'Nome' },
					{ key: 'type', label: 'Tipo' },
					{ key: 'price', label: 'Preço', sortable: true },
					{ key: 'sector', label: 'Setor' },
					...(data.hasScore ? [{ key: 'score', label: 'Score', sortable: true }] : []),
					{ key: 'p_l', label: 'P/L', sortable: true },
					{ key: 'p_vp', label: 'P/VP', sortable: true },
					{ key: 'roe', label: 'ROE', sortable: true },
					{ key: 'netMargin', label: 'Mg. liq.', sortable: true },
					{ key: 'dy12m', label: 'DY 12m', sortable: true },
					...(strategyStr === 'bazin'
						? [{ key: 'bazinUpside', label: 'Upside Bazin', sortable: true }]
						: []),
					...(strategyStr === 'graham'
						? [{ key: 'grahamUpside', label: 'Upside Graham', sortable: true }]
						: []),
					{ key: 'growthNetProfit5y', label: 'Cresc. lucro', sortable: true }
				]}
				rows={data.rows.map((r) => ({ ...r }))}
				rowKey="id"
				selection="single"
				pageSize={25}
				pageSizeOptions={[10, 25, 50, 100]}
			>
				{#snippet cell(row: Record<string, unknown>, key: string)}
					{#if key === 'ticker'}
						<a
							href={resolve(`/assets/${String(row.ticker).toLowerCase()}`)}
							class="font-medium text-accent hover:underline"
							onclick={(e) => e.stopPropagation()}>{row.ticker}</a
						>
					{:else if key === 'type'}
						<span class="text-xs text-ink-soft">{row.type === 'acao' ? 'Ação' : 'FII'}</span>
					{:else if key === 'price'}
						<span>{row.price ? currency.format(Number(row.price)) : '—'}</span>
					{:else if key === 'roe' || key === 'netMargin' || key === 'dy12m' || key === 'growthNetProfit5y'}
						<span>{pct(row[key])}</span>
					{:else if key === 'score'}
						{#if row.score != null}
							<span class="font-medium text-accent">{row.score}</span>
						{:else}
							<span class="text-ink-faint">—</span>
						{/if}
					{:else if key === 'bazinUpside' || key === 'grahamUpside'}
						<span class={Number(row[key]) > 0 ? 'text-ctp-green' : 'text-ctp-red'}>
							{row[key] != null ? pct(row[key]) : '—'}
						</span>
					{:else if key === 'p_l' || key === 'p_vp'}
						<span>{fmt(row[key])}</span>
					{:else}
						<span class="text-ink-soft">{String(row[key] ?? '—')}</span>
					{/if}
				{/snippet}
				{#snippet empty()}
					<p class="py-8 text-center font-mono text-sm text-ink-soft">
						Nenhum ativo passa nos critérios. Ajuste os filtros.
					</p>
				{/snippet}
			</Table>
		</Card.Content>
	</Card>

	<!-- Save filter -->
	<Card>
		<Card.Content>
			<form method="POST" action="?/saveFilter" use:enhance class="flex items-end gap-3">
				<div class="flex flex-col gap-2">
					<Label for="save-name">Salvar filtro atual</Label>
					<Input id="save-name" name="name" placeholder="Ex.: Dividendos + qualidade" required />
					<input type="hidden" name="filterJson" value={JSON.stringify(data.filters)} />
				</div>
				<Button type="submit" variant="outline">Salvar</Button>
			</form>
			{#if data.savedFilters.length > 0}
				<div class="mt-4 flex flex-wrap items-center gap-2">
					<span class="font-mono text-xs text-ink-faint">Salvos:</span>
					{#each data.savedFilters as f (f.id)}
						<a
							href={resolve(`/screener?filter=${f.id}`)}
							class="border border-rule px-2 py-1 font-mono text-xs text-ink-soft hover:border-accent hover:text-accent"
							>{f.name}</a
						>
					{/each}
				</div>
			{/if}
			{#if form?.error}
				<p class="mt-2 text-sm text-danger">{form.error}</p>
			{/if}
			{#if form?.saved}
				<p class="mt-2 text-sm text-signal">Filtro salvo.</p>
			{/if}
		</Card.Content>
	</Card>
</div>
