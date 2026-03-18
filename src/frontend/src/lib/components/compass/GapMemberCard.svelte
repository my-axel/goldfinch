<!--
@file src/lib/components/compass/GapMemberCard.svelte
@kind component
@purpose Compact status card per household member for the Compass overview page.
Shows status, gap details and link to detail page. Styled like PensionCard.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { HouseholdMember } from '$lib/types/household';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import { gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';
	import { Compass } from '@lucide/svelte';

	let {
		member,
		analysis
	}: {
		member: HouseholdMember;
		analysis: GapAnalysisResult | null;
	} = $props();

	const initials = $derived(
		`${member.first_name.charAt(0)}${member.last_name.charAt(0)}`.toUpperCase()
	);

	const status = $derived.by(() => {
		if (!analysis) return null;
		const s = gapStatusFor(analysis.gap.realistic, analysis.required_capital_adjusted.realistic);
		if (s === 'on_track')
			return {
				key: 'on_track' as const,
				label: m.compass_gap_on_track(),
				badgeCls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
				valueCls: 'text-green-600 dark:text-green-400'
			};
		if (s === 'needs_attention')
			return {
				key: 'needs_attention' as const,
				label: m.compass_gap_needs_attention(),
				badgeCls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				valueCls: 'text-yellow-600 dark:text-yellow-400'
			};
		return {
			key: 'critical' as const,
			label: m.compass_gap_critical(),
			badgeCls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
			valueCls: 'text-red-600 dark:text-red-400'
		};
	});

	const realisticDisplay = $derived(analysis ? toGapDisplayValue(analysis.remaining_monthly_gap.realistic) : null);
	const yearsToRetirement = $derived(analysis ? Math.max(0, Math.round(analysis.years_to_retirement)) : null);
</script>

{#if analysis && status}
	<!-- Configured member card -->
	<a
		href="/plan/{member.id}"
		class="group bg-card rounded-xl border border-border shadow-sm w-[270px] min-h-[180px] flex flex-col hover:shadow-md hover:border-primary/30 transition-all duration-200"
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-4 pt-4 pb-2">
			<div class="flex items-center gap-2 min-w-0">
				<Compass class="w-4 h-4 shrink-0 text-muted-foreground" />
				<h3 class="font-semibold text-card-foreground truncate">{member.first_name} {member.last_name}</h3>
			</div>
			<span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 {status.badgeCls}">
				{status.label}
			</span>
		</div>

		<!-- Details -->
		<div class="px-4 pb-4 flex-1">
			<dl class="space-y-2 text-sm">
				{#if realisticDisplay}
					<div>
						<dt class="text-muted-foreground">{m.compass_overview_monthly_gap()}</dt>
						<dd class="font-semibold {status.valueCls}">
							{#if status.key === 'on_track'}+{/if}<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
							<span class="text-xs font-normal text-muted-foreground ml-1">
								{status.key === 'on_track' ? m.compass_gap_surplus() : m.compass_gap_shortfall()} / Mo
							</span>
						</dd>
					</div>
				{/if}
				{#if yearsToRetirement !== null}
					<div>
						<dt class="text-muted-foreground">{m.compass_gap_years_to_retirement()}</dt>
						<dd>{yearsToRetirement}</dd>
					</div>
				{/if}
				<div>
					<dt class="text-muted-foreground">{m.compass_gap_required_capital_adjusted()}</dt>
					<dd><FormattedCurrency value={analysis.required_capital_adjusted.realistic} decimals={0} /></dd>
				</div>
			</dl>
		</div>

		<!-- Footer CTA -->
		<div class="px-4 py-2.5 border-t border-border/60">
			<span class="text-xs font-medium text-primary group-hover:underline">
				{m.compass_member_card_view_details()} →
			</span>
		</div>
	</a>
{:else}
	<!-- Not-configured member: dashed border card -->
	<a
		href="/plan/{member.id}"
		class="group flex flex-col items-center justify-center w-[270px] min-h-[180px] border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all duration-200"
	>
		<div class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground mb-3">
			{initials}
		</div>
		<p class="text-sm font-medium text-foreground">{member.first_name} {member.last_name}</p>
		<p class="text-xs text-muted-foreground mt-1 mb-4">{m.compass_member_card_not_configured()}</p>
		<span class="text-xs font-medium text-primary group-hover:underline">
			{m.compass_member_card_configure()} →
		</span>
	</a>
{/if}
