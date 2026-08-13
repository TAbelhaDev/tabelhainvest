// REIT (FII) data — the comparator endpoint returns all indicators for one FII
// in a single JSON call (PLANO.md §Endpoints). It also carries the segment and
// fund type, which the asset page does not expose cleanly.

import { getJson } from './client';
import type { FiiComparatorResponse, FiiDividendPoint } from './types';

export async function fetchFiiComparator(companyId: number): Promise<FiiComparatorResponse> {
	return getJson<FiiComparatorResponse>(`/api/fii/comparador/table/${companyId}/all/`);
}

export async function fetchFiiDividends(companyId: number): Promise<FiiDividendPoint[]> {
	return getJson<FiiDividendPoint[]>(`/api/fii/dividendos/chart/${companyId}/`);
}
