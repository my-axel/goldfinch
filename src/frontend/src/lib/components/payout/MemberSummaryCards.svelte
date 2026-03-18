<!--
@file src/lib/components/payout/MemberSummaryCards.svelte
@kind component
@purpose Grid von Mini-Cards pro Haushaltsmitglied mit Kapital, Einkommen und Pensionsanzahl.
-->

<script lang="ts">
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { HouseholdMember } from '$lib/types/household';
	import { calculateMemberFields } from '$lib/types/household';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import type { PensionListItem } from '$lib/types/pension';

	const n = (v: unknown): number => Number(v) || 0;

	let {
		members,
		analyses,
		pensions,
		onSelectMember
	}: {
		members: HouseholdMember[];
		analyses: (GapAnalysisResult | null)[];
		pensions: PensionListItem[];
		onSelectMember: (memberId: number) => void;
	} = $props();
</script>

<div>
	<h3 class="text-sm font-semibold mb-3">{m.payout_member_summary_title()}</h3>
	<div class="grid gap-3 md:grid-cols-2">
		{#each members as member, idx (member.id)}
			{@const analysis = analyses[idx]}
			{@const computed = calculateMemberFields(member)}
			{@const memberPensions = pensions.filter((p) => p.member_id === member.id)}
			<button
				type="button"
				onclick={() => onSelectMember(member.id)}
				class="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
			>
				<div class="flex items-center justify-between mb-3">
					<div class="font-semibold text-sm">{member.first_name} {member.last_name}</div>
					<div class="text-xs text-muted-foreground">
						{computed.age} {m.payout_member_age_suffix()} · {m.payout_member_retirement_short({ age: member.retirement_age_planned })}
					</div>
				</div>

				{#if analysis}
					<div class="grid grid-cols-3 gap-3">
						<div>
							<div class="text-[10px] text-muted-foreground">{m.payout_capital_at_retirement_label()}</div>
							<div class="text-sm font-semibold tabular-nums">
								<FormattedCurrency value={n(analysis.projected_capital.realistic)} decimals={0} />
							</div>
						</div>
						<div>
							<div class="text-[10px] text-muted-foreground">{m.payout_total_income_label()}</div>
							<div class="text-sm font-semibold tabular-nums">
								<FormattedCurrency value={n(analysis.monthly_pension_income.realistic) + Math.max(0, n(analysis.remaining_monthly_gap.realistic))} decimals={0} />
							</div>
						</div>
						<div>
							<div class="text-[10px] text-muted-foreground">{m.payout_member_pension_count()}</div>
							<div class="text-sm font-semibold">{memberPensions.length}</div>
						</div>
					</div>
				{:else}
					<p class="text-xs text-muted-foreground italic">{m.payout_member_no_analysis()}</p>
				{/if}
			</button>
		{/each}
	</div>
</div>
