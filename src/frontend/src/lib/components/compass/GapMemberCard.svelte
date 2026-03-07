<!--
@file src/lib/components/compass/GapMemberCard.svelte
@kind component
@purpose Compact status card per household member for the Compass overview page.
Shows status, hero realistic gap, secondary scenario values, and link to detail page.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { HouseholdMember } from '$lib/types/household';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import { gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';

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
				avatarCls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
				valueCls: 'text-green-600 dark:text-green-400'
			};
		if (s === 'needs_attention')
			return {
				key: 'needs_attention' as const,
				label: m.compass_gap_needs_attention(),
				badgeCls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				avatarCls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
				valueCls: 'text-yellow-600 dark:text-yellow-400'
			};
		return {
			key: 'critical' as const,
			label: m.compass_gap_critical(),
			badgeCls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
			avatarCls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
			valueCls: 'text-red-600 dark:text-red-400'
		};
	});

	const realisticDisplay = $derived(analysis ? toGapDisplayValue(analysis.remaining_monthly_gap.realistic) : null);
	const pessimisticDisplay = $derived(analysis ? toGapDisplayValue(analysis.remaining_monthly_gap.pessimistic) : null);
	const optimisticDisplay = $derived(analysis ? toGapDisplayValue(analysis.remaining_monthly_gap.optimistic) : null);
	const yearsToRetirement = $derived(analysis ? Math.max(0, Math.round(analysis.years_to_retirement)) : null);
</script>

{#if analysis && status}
	<!-- Configured member card -->
	<a
		href="/compass/{member.id}"
		class="group flex flex-col w-[260px] min-h-[220px] bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 pb-3">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 {status.avatarCls}">
					{initials}
				</div>
				<div>
					<p class="text-sm font-semibold leading-tight">{member.first_name} {member.last_name}</p>
					{#if yearsToRetirement !== null}
						<p class="text-xs text-muted-foreground">{yearsToRetirement} Jahre bis Rente</p>
					{/if}
				</div>
			</div>
			<span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 {status.badgeCls}">
				{status.label}
			</span>
		</div>

		<!-- Hero metric: realistic monthly gap -->
		<div class="px-4 py-3 border-t border-border/60">
			<p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{m.compass_timeline_realistic()} · {m.compass_overview_monthly_gap()}</p>
			{#if realisticDisplay}
				<p class="text-2xl font-bold {status.valueCls}">
					{#if status.key === 'on_track'}+{/if}<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
				</p>
				<p class="text-xs text-muted-foreground mt-0.5">
					{status.key === 'on_track' ? m.compass_gap_surplus() : m.compass_gap_shortfall()} / Monat
				</p>
			{/if}
		</div>

		<!-- Secondary: pess / opt -->
		<div class="px-4 py-2.5 border-t border-border/60 flex gap-4 flex-1">
			{#if pessimisticDisplay}
				<div>
					<p class="text-[10px] text-muted-foreground">{m.compass_timeline_pessimistic()}</p>
					<p class="text-xs font-medium" style="color: hsl(320, 65%, 55%)">
						{#if pessimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={pessimisticDisplay.absolute} decimals={0} />
					</p>
				</div>
			{/if}
			{#if optimisticDisplay}
				<div>
					<p class="text-[10px] text-muted-foreground">{m.compass_timeline_optimistic()}</p>
					<p class="text-xs font-medium" style="color: hsl(30, 80%, 50%)">
						{#if optimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={optimisticDisplay.absolute} decimals={0} />
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer CTA -->
		<div class="px-4 py-3 border-t border-border/60 flex items-center justify-end">
			<span class="text-xs font-medium text-primary group-hover:underline">
				{m.compass_member_card_view_details()} →
			</span>
		</div>
	</a>
{:else}
	<!-- Not-configured member: dashed border card -->
	<a
		href="/compass/{member.id}"
		class="group flex flex-col items-center justify-center w-[260px] min-h-[220px] border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-accent/20 transition-all duration-200"
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
