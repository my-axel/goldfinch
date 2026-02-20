<!--
@file src/routes/pension/state/new/+page.svelte
@kind route
@purpose Rendert die Route 'pension/state/new' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `validate()`, `handleSubmit()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { PensionType } from '$lib/types/pension';
	import { todayIsoDate } from '$lib/utils/date-only';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/state/BasicInformationCard.svelte';
	import StatementsCard from '$lib/components/pension/state/StatementsCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		current_monthly_amount: number;
		projected_monthly_amount: number;
		current_value: number;
		note?: string;
	}

	// Form state
	let name = $state('');
	let startDate = $state(todayIsoDate());
	let notes = $state('');
	let statements = $state<StatementFormData[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	let memberId = $derived(data.memberId);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.state_pension_name_required();
		if (!startDate) newErrors.start_date = m.state_pension_start_date_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			const pensionData = {
				type: PensionType.STATE,
				name: name.trim(),
				member_id: memberId,
				start_date: startDate,
				notes: notes.trim() || '',
				status: 'ACTIVE' as const,
				statements: statements.length > 0
					? statements.map(s => ({
							statement_date: s.statement_date,
							current_monthly_amount: s.current_monthly_amount || null,
							projected_monthly_amount: s.projected_monthly_amount || null,
							current_value: s.current_value || null,
							note: s.note || ''
						}))
					: undefined
			};

				await pensionApi.create(PensionType.STATE, pensionData);
				toastStore.success(m.state_pension_created());
				goto('/pension');
			} catch (error) {
				console.error('Error creating state pension:', error);
				toastStore.error(error instanceof Error ? error.message : m.state_pension_create_failed());
			} finally {
				submitting = false;
			}
		}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.state_pension_new_title()}
			description={m.state_pension_new_description()}
		/>
		<div class="flex space-x-4 shrink-0">
			<button
				type="button"
				onclick={() => history.back()}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.cancel()}
			</button>
			<button
				type="submit"
				form="state-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.state_pension_create()}
			</button>
		</div>
	</div>

	<form id="state-pension-form" onsubmit={handleSubmit} class="space-y-8">
		<!-- Basic Information Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.state_pension_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.state_pension_name()}:</strong> {m.state_pension_explanation_name()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.state_pension_start_date()}:</strong> {m.state_pension_explanation_start_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.state_pension_notes()}:</strong> {m.state_pension_explanation_notes()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.state_pension_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card title={m.state_pension_basic_info()} description={m.state_pension_basic_info_description()}>
				<BasicInformationCard bind:name bind:startDate bind:notes {errors} />
			</Card>
		</ContentSection>

		<!-- Statements Section -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.state_pension_statements_explanation_intro()}</p>
					<ExplanationList>
						<ExplanationListItem><strong>{m.state_pension_statement_date()}:</strong> {m.state_pension_statements_explanation_date()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.state_pension_current_monthly()}:</strong> {m.state_pension_statements_explanation_current()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.state_pension_projected_monthly()}:</strong> {m.state_pension_statements_explanation_projected()}</ExplanationListItem>
						<ExplanationListItem><strong>{m.state_pension_current_value()}:</strong> {m.state_pension_statements_explanation_value()}</ExplanationListItem>
					</ExplanationList>
					<ExplanationAlert>
						{m.state_pension_statements_explanation_alert()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
			<Card title={m.state_pension_statements()} description={m.state_pension_statements_description()}>
				<StatementsCard bind:statements />
			</Card>
		</ContentSection>
	</form>
</div>
