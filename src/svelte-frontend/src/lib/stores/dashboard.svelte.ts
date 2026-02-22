import { SvelteMap } from 'svelte/reactivity';
import { pensionStore } from '$lib/stores/pension.svelte';
import { PensionType, type PensionListItem } from '$lib/types/pension';

function currentValueOf(pension: PensionListItem): number {
	if (pension.type === PensionType.STATE) return pension.latest_current_value ?? 0;
	if (pension.type === PensionType.SAVINGS) return pension.latest_balance ?? 0;
	return pension.current_value;
}

class DashboardStore {
	selectedMemberId = $state<number | undefined>(undefined);

	selectedPensions = $derived.by(() =>
		this.selectedMemberId === undefined
			? pensionStore.pensions
			: pensionStore.pensions.filter((p) => p.member_id === this.selectedMemberId)
	);

	householdTotal = $derived(
		pensionStore.pensions.reduce((sum, p) => sum + currentValueOf(p), 0)
	);

	selectedTotal = $derived(
		this.selectedPensions.reduce((sum, p) => sum + currentValueOf(p), 0)
	);

	memberSummaries = $derived.by(() => {
		const map = new SvelteMap<number, { total: number; pensionCount: number }>();
		for (const p of pensionStore.pensions) {
			const existing = map.get(p.member_id) ?? { total: 0, pensionCount: 0 };
			map.set(p.member_id, {
				total: existing.total + currentValueOf(p),
				pensionCount: existing.pensionCount + 1
			});
		}
		return map;
	});

	get hasData() {
		return pensionStore.pensions.length > 0;
	}

	get loading() {
		return pensionStore.loading;
	}
}

export const dashboardStore = new DashboardStore();
