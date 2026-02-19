import { env } from '$env/dynamic/public';

const BASE_URL = env.PUBLIC_API_BASE_URL || 'http://localhost:8000';
const NORMALIZED_BASE_URL = BASE_URL.replace(/\/$/, '');

export function createApi(fetchFn: typeof fetch = globalThis.fetch) {
	async function request<T>(path: string, options?: RequestInit): Promise<T> {
		const res = await fetchFn(`${NORMALIZED_BASE_URL}${path}`, {
			headers: { 'Content-Type': 'application/json' },
			...options
		});

		if (!res.ok) {
			const body = await res.text().catch(() => res.statusText);
			throw new Error(`API error ${res.status}: ${body}`);
		}

		if (res.status === 204) return undefined as T;
		return res.json();
	}

	return {
		get: <T>(path: string) => request<T>(path),
		post: <T>(path: string, data: unknown) =>
			request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
		put: <T>(path: string, data: unknown) =>
			request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
		delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
	};
}

// Default singleton — used in stores and event handlers (outside load functions)
export const api = createApi();
