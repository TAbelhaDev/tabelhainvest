<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button, Card } from '@tabelhadev/tabelhawebui';
	import Chart from '$lib/Chart.svelte';
	import ChatPanel from '$lib/ChatPanel.svelte';
	import type { ApexOptions } from 'apexcharts';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: import('./$types').ActionData } = $props();

	const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
	const num = (v: number | null | undefined, digits = 2): string => {
		if (v == null || !Number.isFinite(v)) return '—';
		return v.toLocaleString('pt-BR', { maximumFractionDigits: digits });
	};
	const pct = (v: number | null | undefined): string => {
		if (v == null || !Number.isFinite(v)) return '—';
		return `${num(v, 1)}%`;
	};
	const fmtDate = (v: Date | null): string => {
		if (!v) return '—';
		return v.toLocaleDateString('pt-BR');
	};

	const isAcao = data.asset.type === 'acao';
	const ind = data.indicator;
	const fii = data.fiiIndicator;

	// Bazin / Graham fair price for stocks, same math as the screener.
	const bazinUpside = $derived.by(() => {
		if (!isAcao || !data.quote?.price || !ind?.dy12m || ind.dy12m <= 0) return null;
		const fair = (data.quote.price * ind.dy12m) / 100 / 0.06;
		return { price: fair, upside: (fair / data.quote.price - 1) * 100 };
	});
	const grahamUpside = $derived.by(() => {
		if (!isAcao || !data.quote?.price || !ind?.lpa || !ind?.vpa || ind.lpa <= 0 || ind.vpa <= 0)
			return null;
		const fair = Math.sqrt(22.5 * ind.lpa * ind.vpa);
		return { price: fair, upside: (fair / data.quote.price - 1) * 100 };
	});

	// Price chart series.
	const chartSeries = $derived([
		{ name: data.asset.ticker, data: data.priceSeries.map((p) => p.price) }
	]);
	const chartCategories = $derived(data.priceSeries.map((p) => p.date));
	const chartOptions = $derived<ApexOptions>({
		xaxis: { categories: chartCategories, labels: { show: false } },
		tooltip: {
			x: { format: 'dd/MM/yyyy' },
			y: {
				formatter: (v) => currency.format(Number(v))
			}
		}
	});
</script>

<svelte:head>
	<title>{data.asset.ticker}: {data.asset.name} · TAbelhaInvest</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="font-mono text-xs text-ink-soft">
				<a href={resolve('/screener')} class="hover:text-accent">← Screener</a>
			</p>
			<h1 class="mt-1 font-mono text-3xl font-bold">
				{data.asset.ticker}
				<span class="ml-2 text-base font-normal text-ink-faint">{data.asset.name}</span>
			</h1>
			<p class="font-mono text-sm text-ink-soft">
				{isAcao ? 'Ação' : 'FII'}
				{#if data.asset.sector}
					<span class="text-ink-faint"> · </span>{data.asset.sector}
				{/if}
				{#if data.asset.subsector}
					<span class="text-ink-faint"> · </span>{data.asset.subsector}
				{/if}
			</p>
		</div>
		<div class="flex flex-col items-end gap-3">
			{#if data.quote?.price}
				<p class="font-mono text-2xl font-bold">{currency.format(data.quote.price)}</p>
			{/if}
			<form method="POST" action="?/toggleWatch" use:enhance>
				<Button variant={data.watched ? 'primary' : 'outline'} type="submit">
					{data.watched ? '★ Na watchlist' : '☆ Adicionar à watchlist'}
				</Button>
			</form>
		</div>
	</header>

	{#if form?.error}
		<p class="text-sm text-danger">{form.error}</p>
	{/if}

	<!-- Indicadores -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
		{#if isAcao}
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Preço / Lucro</p>
					<p class="mt-1 font-mono text-lg font-bold">{num(ind?.p_l)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Preço / Valor patrimonial</p>
					<p class="mt-1 font-mono text-lg font-bold">{num(ind?.p_vp)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">ROE</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.roe)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Margem líquida</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.netMargin)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Dividend yield 12m</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.dy12m)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">DY 5 anos</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.dy5y)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Cresc. lucro 5a</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.growthNetProfit5y)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Dív. bruta / patrimônio</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.grossDebtNetWorth)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Payout</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(ind?.payout)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">LPA / VPA</p>
					<p class="mt-1 font-mono text-lg font-bold">
						{num(ind?.lpa, 2)} / {num(ind?.vpa, 2)}
					</p>
				</Card.Content>
			</Card>
		{:else}
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Preço / Valor patrimonial</p>
					<p class="mt-1 font-mono text-lg font-bold">{num(fii?.p_vp)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Dividend yield</p>
					<p class="mt-1 font-mono text-lg font-bold">{pct(fii?.dividendYield)}</p>
				</Card.Content>
			</Card>
			<Card>
				<Card.Content>
					<p class="font-mono text-xs text-ink-soft">Valor patrimonial</p>
					<p class="mt-1 font-mono text-lg font-bold">
						{num(fii?.netWorth, 0)}
					</p>
				</Card.Content>
			</Card>
		{/if}
	</div>

	<!-- Estratégias (ações) -->
	{#if isAcao && (bazinUpside || grahamUpside)}
		<Card>
			<Card.Content>
				<h2 class="font-mono text-sm font-semibold">Preço justo por estratégia</h2>
				<div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
					{#if bazinUpside}
						<div class="flex items-center justify-between border border-rule px-4 py-3">
							<div>
								<p class="font-mono text-xs text-ink-soft">Bazin (6% ao ano)</p>
								<p class="font-mono text-lg font-bold">{currency.format(bazinUpside.price)}</p>
							</div>
							<p
								class="font-mono text-sm {bazinUpside.upside > 0
									? 'text-ctp-green'
									: 'text-ctp-red'}"
							>
								{bazinUpside.upside > 0 ? '+' : ''}{num(bazinUpside.upside, 1)}%
							</p>
						</div>
					{/if}
					{#if grahamUpside}
						<div class="flex items-center justify-between border border-rule px-4 py-3">
							<div>
								<p class="font-mono text-xs text-ink-soft">Graham number</p>
								<p class="font-mono text-lg font-bold">{currency.format(grahamUpside.price)}</p>
							</div>
							<p
								class="font-mono text-sm {grahamUpside.upside > 0
									? 'text-ctp-green'
									: 'text-ctp-red'}"
							>
								{grahamUpside.upside > 0 ? '+' : ''}{num(grahamUpside.upside, 1)}%
							</p>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card>
	{/if}

	<!-- Gráfico de preço -->
	<Card>
		<Card.Header>
			<h2 class="font-mono text-sm font-semibold">Cotação</h2>
			<p class="font-mono text-xs text-ink-soft">últimos 12 meses</p>
		</Card.Header>
		<Card.Content>
			{#if data.priceSeries.length > 0}
				<div class="min-h-64">
					<Chart type="area" series={chartSeries} options={chartOptions} />
				</div>
			{:else}
				<p class="py-8 text-center font-mono text-sm text-ink-soft">
					Série de preços indisponível no momento.
				</p>
			{/if}
		</Card.Content>
	</Card>

	<!-- Dividendos -->
	<Card>
		<Card.Header>
			<h2 class="font-mono text-sm font-semibold">Proventos recentes</h2>
			<p class="font-mono text-xs text-ink-soft">
				{isAcao ? 'ações' : 'rendimentos mensais dos FIIs'}
			</p>
		</Card.Header>
		<Card.Content>
			{#if data.dividends.length > 0}
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.dividends as d (d.id)}
						<div class="flex items-center justify-between border border-rule px-3 py-2">
							<span class="font-mono text-xs text-ink-soft">{fmtDate(d.payDate)}</span>
							<span class="font-mono text-sm">{currency.format(d.value ?? 0)}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-8 text-center font-mono text-sm text-ink-soft">
					Nenhum provento registrado ainda.
				</p>
			{/if}
		</Card.Content>
	</Card>

	<!-- Chat IA por ativo -->
	<Card>
		<Card.Content>
			<ChatPanel
				endpoint="/api/chat"
				title={`Pergunte sobre ${data.asset.ticker}`}
				placeholder={`Ex.: o que acha dos fundamentos de ${data.asset.ticker}?`}
				emptyHint={`Pergunte algo sobre ${data.asset.ticker}: fundamentos, proventos, riscos.`}
				buildBody={(history) => ({
					ticker: data.asset.ticker,
					messages: history.map((m) => ({ role: m.role, content: m.content }))
				})}
			/>
		</Card.Content>
	</Card>
</div>
