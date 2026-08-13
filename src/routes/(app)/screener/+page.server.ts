import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { queryScreener, querySectorOptions } from '$lib/screener/query';
import {
	scoreRows,
	strategySortKey,
	STRATEGIES,
	DEFAULT_SCORING,
	type StrategyId
} from '$lib/screener/strategies';
import type { ScreenerFilters, ScreenerRow } from '$lib/screener/types';
import { getWatchlistAssetIdsByUser } from '$lib/server/db/watchlist';
import {
	getSavedFiltersByUser,
	insertSavedFilter,
	findSavedFilter
} from '$lib/server/db/saved-filters';

function parseNumber(value: string | null): number | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function parseFilters(url: URL): ScreenerFilters {
	const typesParam = url.searchParams.get('types');
	const types = typesParam
		? typesParam.split(',').filter((t): t is 'acao' | 'fii' => t === 'acao' || t === 'fii')
		: ([] as ('acao' | 'fii')[]);

	const ranges: Record<string, { min?: number | null; max?: number | null }> = {};
	for (const [key, value] of url.searchParams.entries()) {
		if (key.startsWith('min_'))
			ranges[key.slice(4)] = { ...ranges[key.slice(4)], min: parseNumber(value) };
		if (key.startsWith('max_'))
			ranges[key.slice(4)] = { ...ranges[key.slice(4)], max: parseNumber(value) };
	}

	const scoringParam = url.searchParams.get('scoring');
	const scoring = scoringParam
		? Object.fromEntries(
				scoringParam.split(',').map((pair) => {
					const [k, w] = pair.split(':');
					return [k, Number(w)];
				})
			)
		: null;

	return {
		types,
		ranges,
		sectors: url.searchParams.getAll('sector'),
		segments: url.searchParams.getAll('segment'),
		query: url.searchParams.get('q') ?? '',
		scoring
	};
}

function parseStrategy(url: URL): StrategyId | null {
	const s = url.searchParams.get('strategy');
	return s && s in STRATEGIES ? (s as StrategyId) : null;
}

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.userId) redirect(303, '/login');

	const db = getDb(platform!.env.DB);

	// A saved filter (?filter=id) overrides the query params.
	let filters: ScreenerFilters;
	const savedId = url.searchParams.get('filter');
	if (savedId) {
		const saved = await findSavedFilter(db, locals.userId, savedId);
		filters = saved ? (JSON.parse(saved.filterJson) as ScreenerFilters) : parseFilters(url);
	} else {
		filters = parseFilters(url);
	}
	const strategy = parseStrategy(url);
	const options = await querySectorOptions(db);

	const rows = await queryScreener(db, filters);

	// Watchlist membership for the current user.
	let rowsWithWatch: ScreenerRow[] = [];
	if (rows.length > 0) {
		const watched = await getWatchlistAssetIdsByUser(db, locals.userId);
		rowsWithWatch = rows.map((r) => ({ ...r, watched: watched.has(r.id) }));
	}

	// Strategy ranking.
	let sortedRows = rowsWithWatch;
	if (strategy) {
		sortedRows = [...rowsWithWatch].sort(
			(a, b) => strategySortKey(b, strategy) - strategySortKey(a, strategy)
		);
	}

	// Rule-based scoring.
	const scoreMap = filters.scoring
		? scoreRows(rowsWithWatch, filters.scoring)
		: scoreRows(rowsWithWatch, DEFAULT_SCORING);
	sortedRows = sortedRows.map((row) => ({
		...row,
		score: scoreMap.get(row.id) ?? null
	}));

	const savedFilters = await getSavedFiltersByUser(db, locals.userId);

	return {
		rows: sortedRows as ScreenerRow[],
		filters,
		strategy,
		options,
		scoringWeights: filters.scoring ?? DEFAULT_SCORING,
		hasScore: scoreMap.size > 0,
		savedFilters: savedFilters.map((f) => ({ id: f.id, name: f.name }))
	};
};

export const actions: Actions = {
	saveFilter: async ({ request, locals, platform }) => {
		if (!locals.userId) redirect(303, '/login');
		const form = await request.formData();
		const name = form.get('name');
		const filterJson = form.get('filterJson');
		if (typeof name !== 'string' || typeof filterJson !== 'string' || !name.trim()) {
			return fail(400, { error: 'Dê um nome para o filtro.' });
		}
		const db = getDb(platform!.env.DB);
		await insertSavedFilter(db, {
			userId: locals.userId,
			name: name.trim(),
			filterJson
		});
		return { saved: true };
	}
};
