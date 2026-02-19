import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		memberId: Number(url.searchParams.get('member_id')) || 0
	};
};
