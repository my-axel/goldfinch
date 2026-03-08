<!--
@file src/routes/compass/[member_id]/+page.svelte
@kind route
@purpose Detailseite für einen Haushaltsmitglied — Gap-Konfiguration, Analyseergebnisse und Timeline.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { compassApi } from '$lib/api/compass';
	import type { RetirementGapConfig, GapAnalysisResult, GapTimeline } from '$lib/types/compass';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import GapConfigForm from '$lib/components/compass/GapConfigForm.svelte';
	import GapResultDisplay from '$lib/components/compass/GapResultDisplay.svelte';
	import GapBreakdown from '$lib/components/compass/GapBreakdown.svelte';
	import GapTimelineChart from '$lib/components/compass/GapTimelineChart.svelte';

	let { data } = $props();

	// Local overrides: undefined = fall through to data prop, null/value = local mutation
	let localConfig = $state<RetirementGapConfig | null | undefined>(undefined);
	let localAnalysis = $state<GapAnalysisResult | null | undefined>(undefined);
	let localTimeline = $state<GapTimeline | null | undefined>(undefined);

	const config = $derived(localConfig !== undefined ? localConfig : data.config);
	const analysis = $derived(localAnalysis !== undefined ? localAnalysis : data.analysis);
	const timeline = $derived(localTimeline !== undefined ? localTimeline : data.timeline);

	async function handleSave(savedConfig: RetirementGapConfig, savedAnalysis: GapAnalysisResult) {
		localConfig = savedConfig;
		localAnalysis = savedAnalysis;
		try {
			localTimeline = await compassApi.getTimeline(data.member.id);
		} catch {
			localTimeline = null;
		}
	}

	function handleDelete() {
		localConfig = null;
		localAnalysis = null;
		localTimeline = null;
	}
</script>

<div class="space-y-6">
	<!-- Back link -->
	<a
		href="/compass"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		← {m.compass_detail_back()}
	</a>

	<PageHeader
		title={m.compass_gap_member_section_title({ name: data.member.first_name })}
		description={m.compass_gap_description()}
	/>

	<!-- Configuration section -->
	<ContentSection>
		<Card title={m.compass_gap_setup_title()} description={m.compass_gap_setup_description()}>
			<GapConfigForm
				memberId={data.member.id}
				{config}
				onSave={handleSave}
				onDelete={handleDelete}
			/>
		</Card>

		{#snippet aside()}
			<Explanation title={m.compass_explanation_title()}>
				<p>{m.compass_explanation_formula()}</p>
				<p class="mt-2">{m.compass_explanation_income()}</p>
				<p class="mt-2">{m.compass_explanation_replacement_rate()}</p>
				<p class="mt-2">{m.compass_explanation_withdrawal_rate()}</p>
				{#if config?.desired_monthly_pension != null}
					<p class="mt-2">{m.compass_explanation_desired_pension()}</p>
				{/if}
			</Explanation>
		{/snippet}
	</ContentSection>

	<!-- Results section -->
	{#if analysis}
		<ContentSection>
			<Card title={m.compass_gap_results_card_title()}>
				<GapResultDisplay result={analysis} />
				<GapBreakdown result={analysis} />
			</Card>

			{#snippet aside()}
				<Explanation title={m.compass_explanation_results_title()}>
					<p>{m.compass_explanation_results_text()}</p>
					<p class="mt-2">{m.compass_explanation_capital_note_text()}</p>
				</Explanation>
			{/snippet}
		</ContentSection>
	{/if}

	<!-- Timeline chart -->
	{#if timeline}
		<Card title={m.compass_timeline_title()} description={m.compass_timeline_description()}>
			<GapTimelineChart
				timelines={[timeline]}
				analyses={[analysis]}
				members={[data.member]}
				householdOnly={true}
			/>
		</Card>
	{/if}
</div>
