<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags -- controlled, static inline SVGs */
	import { page } from '$app/state';
	import { toggleMode, mode } from 'mode-watcher';
	import { resolve } from '$app/paths';
	import { Status, StatusPill } from '@tabeladev/tabelawebui';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Pill de status de IA é fechável; a escolha persiste.
	const STATUS_HIDDEN_KEY = 'tabelainvest.status-hidden';
	let statusVisible = $state(true);
	let statusInitialized = $state(false);
	onMount(() => {
		if (localStorage.getItem(STATUS_HIDDEN_KEY) === '1') statusVisible = false;
		statusInitialized = true;
	});
	$effect(() => {
		if (!statusInitialized) return;
		if (!statusVisible) localStorage.setItem(STATUS_HIDDEN_KEY, '1');
	});

	const NAV_ITEMS = [
		{ href: resolve('/screener'), label: 'Screener', icon: 'grid' },
		{ href: resolve('/watchlist'), label: 'Watchlist', icon: 'star' },
		{ href: resolve('/profile'), label: 'Perfil', icon: 'user' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');

	// Inline SVG icons with explicit width/height — Tailwind does not see a `class`
	// inside a JS string, so the size comes from the attribute, not the class.
	const NAV_PATHS: Record<string, string> = {
		grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
		star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
		user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
	};

	function iconSvg(icon: string): string {
		return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${NAV_PATHS[icon]}</svg>`;
	}

	const SUN_SVG =
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
	const MOON_SVG =
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
	const POWER_SVG =
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>';
</script>

<div class="flex min-h-svh bg-paper text-ink">
	<!-- Sidebar (desktop) — fixa; separators ponta a ponta, sem padding lateral -->
	<aside
		class="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-rule bg-paper-raised lg:flex"
	>
		<div class="px-5 pt-5 pb-4">
			<span class="font-mono text-xl font-bold text-accent">TabelaInvest</span>
		</div>
		<div class="border-t border-rule"></div>
		<nav class="flex flex-1 flex-col gap-1 px-3 py-4">
			{#each NAV_ITEMS as item (item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 px-2 py-1.5 font-mono text-sm transition-colors {isActive(
						item.href
					)
						? 'border-l-2 border-accent pl-2 font-medium text-accent'
						: 'border-l-2 border-transparent pl-2 text-ink-soft hover:text-ink'}"
				>
					{@html iconSvg(item.icon)}
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="border-t border-rule"></div>
		<div class="flex flex-col gap-1 px-3 py-4">
			<button
				onclick={toggleMode}
				class="flex cursor-pointer items-center gap-3 px-2 py-1.5 font-mono text-sm text-ink-soft transition-colors hover:text-ink"
			>
				{#if mode.current === 'dark'}
					{@html SUN_SVG}
				{:else}
					{@html MOON_SVG}
				{/if}
				{mode.current === 'dark' ? 'Tema claro' : 'Tema escuro'}
			</button>
			<form method="POST" action={resolve('/logout')}>
				<button
					type="submit"
					class="flex w-full cursor-pointer items-center gap-3 px-2 py-1.5 font-mono text-sm text-ctp-red transition-colors hover:text-ink"
				>
					{@html POWER_SVG}
					Sair
				</button>
			</form>
		</div>
	</aside>

	<!-- Conteúdo principal -->
	<div class="flex min-w-0 flex-1 flex-col">
		<main class="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 lg:p-8 lg:pb-8">
			{@render children()}
		</main>
	</div>

	<!-- Bottom nav (mobile) — fixa no rodapé da viewport -->
	<nav class="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-paper-raised lg:hidden">
		<div class="flex items-center justify-around py-2">
			{#each NAV_ITEMS as item (item.href)}
				<a
					href={item.href}
					class="flex flex-col items-center gap-0.5 px-4 py-1 font-mono text-xs {isActive(item.href)
						? 'text-accent'
						: 'text-ink-soft'}"
				>
					{@html iconSvg(item.icon)}
					{item.label}
				</a>
			{/each}
		</div>
	</nav>

	<!-- Status IA — pill fixo, fechável; escolha persiste -->
	<StatusPill closable bind:visible={statusVisible} dismissLabel="Fechar status" class="bottom-6!">
		<span class="text-ink-faint">IA:</span>
		{#if data.aiConfigured}
			<Status kind="success">configurada</Status>
		{:else}
			<a href={resolve('/profile')} class="text-danger hover:text-danger hover:underline"
				>não configurada</a
			>
		{/if}
	</StatusPill>
</div>
