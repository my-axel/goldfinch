<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { PensionType } from '$lib/types/pension';
	import type { StatePension } from '$lib/types/pension';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/state/BasicInformationCard.svelte';
	import StatementsCard from '$lib/components/pension/state/StatementsCard.svelte';
	import ScenarioViewer from '$lib/components/pension/state/ScenarioViewer.svelte';
	import PensionStatusActions from '$lib/components/pension/PensionStatusActions.svelte';

	// Get pension ID from route params
	let pensionId = $derived(Number($page.params.id));

	// Loading/error state
	let loading = $state(true);
	let loadError = $state('');
	let submitting = $state(false);

	// Pension data
	let pension = $state<StatePension | null>(null);

	// Form state
	let name = $state('');
	let startDate = $state('');
	let notes = $state('');
	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		current_monthly_amount: number;
		projected_monthly_amount: number;
		current_value: number;
		note?: string;
	}
	let statements = $state<StatementFormData[]>([]);
	let errors = $state<Record<string, string>>({});

	// Toast
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	function showToast(message: string, type: 'success' | 'error') {
		toast = { message, type };
		setTimeout(() => { toast = null; }, 3000);
	}

	onMount(async () => {
		try {
			pension = await pensionApi.get<StatePension>(PensionType.STATE, pensionId);
			// Populate form
			name = pension.name;
			startDate = pension.start_date;
			notes = pension.notes ?? '';
			statements = (pension.statements ?? []).map(s => ({
				...s,
				current_monthly_amount: s.current_monthly_amount ?? 0,
				projected_monthly_amount: s.projected_monthly_amount ?? 0,
				current_value: s.current_value ?? 0
			}));
		} catch (e) {
			loadError = e instanceof Error ? e.message : m.state_pension_not_found();
		} finally {
			loading = false;
		}
	});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = m.state_pension_name_required();
		if (!startDate) newErrors.start_date = m.state_pension_start_date_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate() || !pension) return;

		submitting = true;
		try {
			const pensionData = {
				type: PensionType.STATE,
				name: name.trim(),
				member_id: pension.member_id,
				start_date: startDate,
				notes: notes.trim() || '',
				status: pension.status,
				statements: statements
					.filter(s => s.statement_date)
					.map(s => ({
						id: s.id || 0,
						pension_id: pensionId,
						statement_date: s.statement_date,
						current_monthly_amount: s.current_monthly_amount || undefined,
						projected_monthly_amount: s.projected_monthly_amount || undefined,
						current_value: s.current_value || undefined,
						note: s.note || ''
					}))
			};

			await pensionApi.update(PensionType.STATE, pensionId, pensionData);
			showToast(m.state_pension_updated(), 'success');
			goto('/pension');
		} catch (error) {
			console.error('Error updating state pension:', error);
			showToast(
				error instanceof Error ? error.message : m.state_pension_update_failed(),
				'error'
			);
		} finally {
			submitting = false;
		}
	}

	async function handlePause(pauseDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.STATE, pensionId, {
				status: 'PAUSED',
				paused_at: pauseDate
			});
			pension = await pensionApi.get<StatePension>(PensionType.STATE, pensionId);
		} catch (error) {
			console.error('Error pausing pension:', error);
			showToast(error instanceof Error ? error.message : 'Failed to pause pension', 'error');
		}
	}

	async function handleResume(resumeDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.STATE, pensionId, {
				status: 'ACTIVE',
				resume_at: resumeDate
			});
			pension = await pensionApi.get<StatePension>(PensionType.STATE, pensionId);
		} catch (error) {
			console.error('Error resuming pension:', error);
			showToast(error instanceof Error ? error.message : 'Failed to resume pension', 'error');
		}
	}
</script>

<!-- Toast -->
{#if toast}
	<div
		class="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border {toast.type === 'success'
			? 'bg-card text-foreground border-primary/30'
			: 'bg-card text-destructive border-destructive/30'}"
	>
		{toast.message}
	</div>
{/if}

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader
			title={m.state_pension_edit_title()}
			description={m.state_pension_edit_description()}
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
				disabled={loading || submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.state_pension_save()}
			</button>
		</div>
	</div>

	{#if loading}
		<p class="text-center text-muted-foreground py-8">{m.state_pension_loading()}</p>
	{:else if loadError}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{loadError}</p>
		</div>
	{:else if !pension}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{m.state_pension_not_found()}</p>
		</div>
	{:else}
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
				<Card title={m.state_pension_basic_info()} description={m.state_pension_basic_info_edit_description()}>
					{#snippet headerActions()}
						<PensionStatusActions
							status={pension!.status}
							onPause={handlePause}
							onResume={handleResume}
						/>
					{/snippet}
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
					<StatementsCard bind:statements {pensionId} />
				</Card>
			</ContentSection>

			<!-- Scenarios Section -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.state_pension_scenarios_explanation_intro()}</p>
						<p>{m.state_pension_scenarios_explanation_text()}</p>
						<ExplanationList>
							<ExplanationListItem><strong>{m.state_pension_planned_retirement({ age: '' })}:</strong> {m.state_pension_scenarios_explanation_planned()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.state_pension_alternative_retirement({ age: '' })}:</strong> {m.state_pension_scenarios_explanation_alternative()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.state_pension_pessimistic()}:</strong> {m.state_pension_scenarios_explanation_pessimistic()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.state_pension_realistic()}:</strong> {m.state_pension_scenarios_explanation_realistic()}</ExplanationListItem>
							<ExplanationListItem><strong>{m.state_pension_optimistic()}:</strong> {m.state_pension_scenarios_explanation_optimistic()}</ExplanationListItem>
						</ExplanationList>
						<ExplanationAlert>
							{m.state_pension_scenarios_explanation_alert()}
						</ExplanationAlert>
					</Explanation>
				{/snippet}
				<Card title={m.state_pension_scenarios()} description={m.state_pension_scenarios_description()}>
					<ScenarioViewer {pensionId} />
				</Card>
			</ContentSection>
		</form>
	{/if}
</div>
