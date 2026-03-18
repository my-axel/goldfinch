<!--
@file src/lib/components/payout/MemberRetirementInfo.svelte
@kind component
@purpose Kompakte Info-Leiste mit Mitgliedsdaten: Name, Alter, Rentenalter, benoetigtes Monatseinkommen.
-->

<script lang="ts">
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { HouseholdMember } from '$lib/types/household';
	import { calculateMemberFields, formatMemberName } from '$lib/types/household';
	import type { GapAnalysisResult } from '$lib/types/compass';

	const n = (v: unknown): number => Number(v) || 0;

	let {
		member,
		analysis
	}: {
		member: HouseholdMember;
		analysis: GapAnalysisResult;
	} = $props();

	const computed = $derived(calculateMemberFields(member));
</script>

<div class="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-x-8 gap-y-2">
	<div>
		<div class="text-[10px] uppercase tracking-wide text-muted-foreground">{m.payout_member_name_label()}</div>
		<div class="text-sm font-semibold">{formatMemberName(member)}</div>
	</div>
	<div>
		<div class="text-[10px] uppercase tracking-wide text-muted-foreground">{m.payout_member_age_label()}</div>
		<div class="text-sm font-semibold">{computed.age}</div>
	</div>
	<div>
		<div class="text-[10px] uppercase tracking-wide text-muted-foreground">{m.payout_member_retirement_age_label()}</div>
		<div class="text-sm font-semibold">{member.retirement_age_planned}</div>
	</div>
	<div>
		<div class="text-[10px] uppercase tracking-wide text-muted-foreground">{m.payout_years_to_retirement_label()}</div>
		<div class="text-sm font-semibold">{Math.round(n(analysis.years_to_retirement))} {m.payout_years_suffix()}</div>
	</div>
	<div>
		<div class="text-[10px] uppercase tracking-wide text-muted-foreground">{m.payout_member_needed_monthly_label()}</div>
		<div class="text-sm font-semibold tabular-nums">
			<FormattedCurrency value={n(analysis.needed_monthly_at_retirement)} decimals={0} />
		</div>
	</div>
</div>
