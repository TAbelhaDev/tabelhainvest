import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, Investidor10Error } from './client';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('client', () => {
	beforeEach(() => {
		fetchMock.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('sends a browser user-agent and the ajax header', async () => {
		fetchMock.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
		await getJson('/api/foo');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://investidor10.com.br/api/foo');
		const headers = init.headers as Record<string, string>;
		expect(headers['user-agent']).toMatch(/Mozilla\/5\.0/);
		expect(headers['x-requested-with']).toBe('XMLHttpRequest');
	});

	it('throws Investidor10Error on a non-ok response', async () => {
		fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));
		await expect(getJson('/api/foo')).rejects.toThrow(Investidor10Error);
		await expect(getJson('/api/foo')).rejects.toThrow('investidor10 /api/foo → 404');
	});

	it('throws Investidor10Error on timeout', async () => {
		fetchMock.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));
		await expect(getJson('/api/foo')).rejects.toThrow(Investidor10Error);
		await expect(getJson('/api/foo')).rejects.toThrow('timeout');
	});
});
