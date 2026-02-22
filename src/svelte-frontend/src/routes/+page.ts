import { createHouseholdApi } from '$lib/api/household';

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
	const members = await createHouseholdApi(fetch).list();
	return { members };
};
