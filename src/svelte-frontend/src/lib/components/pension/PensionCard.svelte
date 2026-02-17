<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { PensionType, ContributionFrequency, type PensionListItem } from '$lib/types/pension';
	import { formatCurrency as fmtCurrency, formatPercent as fmtPercent } from '$lib/utils/format';
	import { TrendingUp, Shield, Building2, Landmark, Coins, Pencil, Trash2 } from '@lucide/svelte';

	let {
		pension,
		onEdit,
		onDelete
	}: {
		pension: PensionListItem;
		onEdit: (pension: PensionListItem) => void;
		onDelete: (pension: PensionListItem) => void;
	} = $props();

	let isInactive = $derived(pension.status === 'PAUSED');
	let locale = $derived(settingsStore.current.number_locale);
	let currency = $derived(settingsStore.current.currency);

	function formatCurrency(value: number): string {
		return fmtCurrency(value, locale, currency);
	}

	function formatPercent(value: number): string {
		return fmtPercent(value / 100, locale, 1);
	}

	function frequencyLabel(freq: ContributionFrequency): string {
		switch (freq) {
			case ContributionFrequency.MONTHLY: return m.pension_per_month();
			case ContributionFrequency.QUARTERLY: return m.pension_per_quarter();
			case ContributionFrequency.SEMI_ANNUALLY: return m.pension_per_half_year();
			case ContributionFrequency.ANNUALLY: return m.pension_per_year();
			case ContributionFrequency.ONE_TIME: return m.pension_one_time();
		}
	}

	const typeIcons = {
		[PensionType.ETF_PLAN]: TrendingUp,
		[PensionType.INSURANCE]: Shield,
		[PensionType.COMPANY]: Building2,
		[PensionType.STATE]: Landmark,
		[PensionType.SAVINGS]: Coins
	} as const;

	let TypeIcon = $derived(typeIcons[pension.type]);
</script>

<div class="bg-card rounded-xl border border-border shadow-sm w-[270px] {isInactive ? 'opacity-60' : ''}">
	<div class="flex items-center justify-between px-4 pt-4 pb-2">
		<div class="flex items-center gap-2 min-w-0">
			<TypeIcon class="w-4 h-4 shrink-0 text-muted-foreground" />
			<h3 class="font-semibold text-card-foreground truncate {isInactive ? 'text-muted-foreground' : ''}">{pension.name}</h3>
			{#if isInactive}
				<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground shrink-0">
					{m.pension_status_paused()}
				</span>
			{/if}
		</div>
		<div class="flex gap-1 shrink-0">
			<button
				onclick={() => onEdit(pension)}
				class="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
				title={m.pension_edit()}
			>
				<Pencil class="w-4 h-4" />
			</button>
			<button
				onclick={() => onDelete(pension)}
				class="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent/50"
				title={m.pension_delete()}
			>
				<Trash2 class="w-4 h-4" />
			</button>
		</div>
	</div>
	<div class="px-4 pb-4 {isInactive ? 'text-muted-foreground' : ''}">
		<dl class="space-y-2 text-sm">
			{#if pension.type === PensionType.ETF_PLAN}
				<div>
					<dt class="text-muted-foreground">ETF</dt>
					<dd>{pension.etf_name || pension.etf_id}</dd>
				</div>
				{#if pension.current_step_amount && pension.current_step_frequency}
					<div>
						<dt class="text-muted-foreground">{m.pension_contribution()}</dt>
						<dd>{formatCurrency(pension.current_step_amount)} {frequencyLabel(pension.current_step_frequency)}</dd>
					</div>
				{/if}
				<div>
					<dt class="text-muted-foreground">{m.pension_value()}</dt>
					<dd>{formatCurrency(pension.current_value)}</dd>
				</div>
			{:else if pension.type === PensionType.INSURANCE}
				<div>
					<dt class="text-muted-foreground">{m.pension_provider()}</dt>
					<dd>{pension.provider}</dd>
				</div>
				{#if pension.guaranteed_interest != null}
					<div>
						<dt class="text-muted-foreground">{m.pension_interest_rate()}</dt>
						<dd>{formatPercent(pension.guaranteed_interest)}</dd>
					</div>
				{/if}
				{#if pension.expected_return != null}
					<div>
						<dt class="text-muted-foreground">{m.pension_expected_return()}</dt>
						<dd>{formatPercent(pension.expected_return)}</dd>
					</div>
				{/if}
				<div>
					<dt class="text-muted-foreground">{m.pension_value()}</dt>
					<dd>{formatCurrency(pension.current_value)}</dd>
				</div>
			{:else if pension.type === PensionType.COMPANY}
				<div>
					<dt class="text-muted-foreground">{m.pension_employer()}</dt>
					<dd>{pension.employer}</dd>
				</div>
				{#if pension.current_step_amount && pension.current_step_frequency}
					<div>
						<dt class="text-muted-foreground">{m.pension_contribution()}</dt>
						<dd>{formatCurrency(pension.current_step_amount)} {frequencyLabel(pension.current_step_frequency)}</dd>
					</div>
				{/if}
				{#if pension.latest_projections && pension.latest_projections.length > 0}
					<div>
						<dt class="text-muted-foreground">{m.pension_projected_payout()}</dt>
						<dd>{formatCurrency(pension.latest_projections[0].monthly_payout)}</dd>
					</div>
				{/if}
			{:else if pension.type === PensionType.STATE}
				{#if pension.latest_monthly_amount != null}
					<div>
						<dt class="text-muted-foreground">{m.pension_monthly_amount()}</dt>
						<dd>{formatCurrency(pension.latest_monthly_amount)}</dd>
					</div>
				{/if}
				{#if pension.latest_projected_amount != null}
					<div>
						<dt class="text-muted-foreground">{m.pension_projected_amount()}</dt>
						<dd>{formatCurrency(pension.latest_projected_amount)}</dd>
					</div>
				{/if}
			{:else if pension.type === PensionType.SAVINGS}
				<div>
					<dt class="text-muted-foreground">{m.pension_balance()}</dt>
					<dd>{formatCurrency(pension.latest_balance ?? 0)}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground">{m.pension_interest_rate()}</dt>
					<dd>{formatPercent(pension.realistic_rate)}</dd>
				</div>
				{#if pension.current_step_amount && pension.current_step_frequency}
					<div>
						<dt class="text-muted-foreground">{m.pension_contribution()}</dt>
						<dd>{formatCurrency(pension.current_step_amount)} {frequencyLabel(pension.current_step_frequency)}</dd>
					</div>
				{/if}
			{/if}
		</dl>
	</div>
</div>
