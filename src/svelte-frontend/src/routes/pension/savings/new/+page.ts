/**
 * @file src/routes/pension/savings/new/+page.ts
 * @kind route
 * @purpose Laedt Initialdaten fuer die Route 'pension/savings/new', verarbeitet Parameter und liefert fehlertolerantes PageData.
 */

import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	return {
		memberId: Number(url.searchParams.get('member_id')) || 0
	};
};
