const BASE_URL = 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
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

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, data: unknown) =>
		request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
	put: <T>(path: string, data: unknown) =>
		request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
	delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
