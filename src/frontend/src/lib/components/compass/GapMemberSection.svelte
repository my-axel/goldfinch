<!--
@file src/lib/components/compass/GapMemberSection.svelte
@kind component
@purpose Per-member expandable section: config form + results + breakdown for one household member.
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import GapConfigForm from './GapConfigForm.svelte';
	import GapResultDisplay from './GapResultDisplay.svelte';
	import GapBreakdown from './GapBreakdown.svelte';
	import type { HouseholdMember } from '$lib/types/household';
	import type { RetirementGapConfig, GapAnalysisResult } from '$lib/types/compass';

	let {
		member,
		config: initialConfig,
		analysis: initialAnalysis
	}: {
		member: HouseholdMember;
		config: RetirementGapConfig | null;
		analysis: GapAnalysisResult | null;
	} = $props();

	// Use untrack to read initial prop values once without creating reactive dependencies.
	// This is intentional: config/analysis are local state managed by user actions after mount.
	let config = $state<RetirementGapConfig | null>(untrack(() => initialConfig));
	let analysis = $state<GapAnalysisResult | null>(untrack(() => initialAnalysis));
	let open = $state(true); // expanded by default

	function handleSave(savedConfig: RetirementGapConfig, result: GapAnalysisResult) {
		config = savedConfig;
		analysis = result;
	}

	function handleDelete() {
		config = null;
		analysis = null;
	}

	// Derive status badge
	const statusLabel = $derived.by(() => {
		if (!analysis) return null;
		const gap = analysis.gap.realistic;
		const required = analysis.required_capital_adjusted;
		if (gap <= 0) return { label: m.compass_gap_on_track(), cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
		if (required > 0 && gap <= required * 0.25) return { label: m.compass_gap_needs_attention(), cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
		return { label: m.compass_gap_critical(), cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
	});
</script>

<div class="bg-card rounded-xl border border-border shadow-sm">
	<!-- Header -->
	<button
		class="w-full flex items-center justify-between px-6 py-4 text-left"
		onclick={() => (open = !open)}
	>
		<div class="flex items-center gap-3">
			<svg
				class="w-4 h-4 text-muted-foreground transition-transform {open ? 'rotate-90' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
			<h3 class="text-base font-semibold">
				{m.compass_gap_member_section_title({ name: member.first_name })}
			</h3>
			{#if config}
				<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.compass_gap_configured()}</span>
			{/if}
		</div>
		{#if statusLabel}
			<span class="text-xs px-2.5 py-1 rounded-full font-medium {statusLabel.cls}">{statusLabel.label}</span>
		{/if}
	</button>

	<!-- Body -->
	{#if open}
		<div class="px-6 pb-6 border-t border-border pt-5">
			<!-- Config Form -->
			<GapConfigForm
				memberId={member.id}
				{config}
				onSave={handleSave}
				onDelete={handleDelete}
			/>

			<!-- Results (shown once analysis is available) -->
			{#if analysis}
				<div class="border-t border-border mt-6 pt-6 space-y-4">
					<GapResultDisplay result={analysis} />
					<GapBreakdown result={analysis} />
				</div>
			{:else if !config}
				<p class="text-sm text-muted-foreground mt-4">{m.compass_gap_no_config_cta()}</p>
			{/if}
		</div>
	{/if}
</div>
