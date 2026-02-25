import { SvelteMap } from 'svelte/reactivity';
import { pensionStore } from '$lib/stores/pension.svelte';
import { PensionType, type PensionListItem, type AggregateSeriesResponse } from '$lib/types/pension';
import { dashboardApi } from '$lib/api/dashboard';

function currentValueOf(pension: PensionListItem): number {
	// API returns Decimal fields as strings; Number() coerces safely to avoid string concatenation
	if (pension.type === PensionType.STATE) return Number(pension.latest_current_value ?? 0);
	if (pension.type === PensionType.SAVINGS) return Number(pension.latest_balance ?? 0);
	return Number(pension.current_value);
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

	// ─── Time Series Data ─────────────────────────────────────────────────────

	seriesData = $state<AggregateSeriesResponse | null>(null);
	seriesLoading = $state(false);
	seriesError = $state<string | null>(null);

	/**
	 * Load aggregate time series from the backend.
	 * Automatically uses selectedMemberId if set.
	 * Call this whenever selectedMemberId changes or on initial mount.
	 */
	async loadSeries(pensionType?: string) {
		this.seriesLoading = true;
		this.seriesError = null;
		try {
			this.seriesData = await dashboardApi.getAggregateSeries({
				member_id: this.selectedMemberId,
				pension_type: pensionType
			});
		} catch (e) {
			this.seriesError = e instanceof Error ? e.message : 'Failed to load series data';
			this.seriesData = null;
		} finally {
			this.seriesLoading = false;
		}
	}

	// ─── Existing getters ─────────────────────────────────────────────────────

	get hasData() {
		return pensionStore.pensions.length > 0;
	}

	get loading() {
		return pensionStore.loading;
	}
}

export const dashboardStore = new DashboardStore();
