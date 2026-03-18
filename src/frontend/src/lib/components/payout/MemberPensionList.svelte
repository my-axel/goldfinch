<!--
@file src/lib/components/payout/MemberPensionList.svelte
@kind component
@purpose Listet individuelle Pensionsplaene eines Mitglieds, gruppiert nach Typ, mit Links zur Detailseite.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { PensionType, PENSION_ROUTE_MAP, type PensionListItem } from '$lib/types/pension';

	let {
		pensions
	}: {
		pensions: PensionListItem[];
	} = $props();

	const typeOrder: PensionType[] = [
		PensionType.STATE,
		PensionType.COMPANY,
		PensionType.INSURANCE,
		PensionType.ETF_PLAN,
		PensionType.SAVINGS
	];

	const typeLabels: Record<PensionType, () => string> = {
		[PensionType.STATE]: () => m.payout_state_pension_label(),
		[PensionType.COMPANY]: () => m.payout_company_pension_label(),
		[PensionType.INSURANCE]: () => m.payout_insurance_pension_label(),
		[PensionType.ETF_PLAN]: () => m.pension_type_etf(),
		[PensionType.SAVINGS]: () => m.pension_type_savings()
	};

	const grouped = $derived.by(() => {
		const groups: { type: PensionType; label: string; items: PensionListItem[] }[] = [];
		for (const type of typeOrder) {
			const items = pensions.filter((p) => p.type === type);
			if (items.length > 0) {
				groups.push({ type, label: typeLabels[type](), items });
			}
		}
		return groups;
	});

	function getValue(p: PensionListItem): number {
		if (p.type === PensionType.ETF_PLAN) return p.current_value ?? 0;
		if (p.type === PensionType.INSURANCE) return p.current_value ?? 0;
		if (p.type === PensionType.COMPANY) return p.current_value ?? 0;
		if (p.type === PensionType.SAVINGS) return p.latest_balance ?? 0;
		if (p.type === PensionType.STATE) return p.latest_projected_amount ?? 0;
		return 0;
	}

	function getValueLabel(type: PensionType): string {
		if (type === PensionType.STATE) return m.payout_member_projected_monthly();
		return m.payout_member_current_value();
	}

	function getSubtitle(p: PensionListItem): string {
		if (p.type === PensionType.ETF_PLAN) return p.etf_name;
		if (p.type === PensionType.COMPANY) return p.employer;
		if (p.type === PensionType.INSURANCE) return p.provider;
		return '';
	}

	function detailHref(p: PensionListItem): string {
		return `/pension/${PENSION_ROUTE_MAP[p.type]}/${p.id}`;
	}
</script>

<Card title={m.payout_member_pension_plans_title()}>
	{#if grouped.length === 0}
		<p class="text-sm text-muted-foreground">{m.payout_member_no_pensions()}</p>
	{:else}
		<div class="space-y-4">
			{#each grouped as group (group.type)}
				<div>
					<div class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
						{group.label}
					</div>
					<div class="space-y-1.5">
						{#each group.items as pension (pension.id)}
							<a
								href={detailHref(pension)}
								class="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors group"
							>
								<div class="min-w-0">
									<div class="text-sm font-medium truncate group-hover:text-primary transition-colors">
										{pension.name}
									</div>
									{#if getSubtitle(pension)}
										<div class="text-xs text-muted-foreground truncate">
											{getSubtitle(pension)}
										</div>
									{/if}
								</div>
								<div class="text-right shrink-0 ml-4">
									<div class="text-[10px] text-muted-foreground">{getValueLabel(pension.type)}</div>
									<div class="text-sm font-semibold tabular-nums">
										<FormattedCurrency value={getValue(pension)} decimals={0} />
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
