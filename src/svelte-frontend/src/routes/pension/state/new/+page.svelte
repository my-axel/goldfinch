<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { PensionType } from '$lib/types/pension';
	import { toISODate } from '$lib/utils/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import BasicInformationCard from '$lib/components/pension/state/BasicInformationCard.svelte';
	import StatementsCard from '$lib/components/pension/state/StatementsCard.svelte';

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
	let startDate = $state(toISODate(new Date()));
	let notes = $state('');
	let statements = $state<StatementFormData[]>([]);
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);

	// Toast
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	function showToast(message: string, type: 'success' | 'error') {
		toast = { message, type };
		setTimeout(() => { toast = null; }, 3000);
	}

	// Get member_id from URL
	let memberId = $derived(Number($page.url.searchParams.get('member_id')) || 0);

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
			showToast(m.state_pension_created(), 'success');
			goto('/pension');
		} catch (error) {
			console.error('Error creating state pension:', error);
			showToast(
				error instanceof Error ? error.message : m.state_pension_create_failed(),
				'error'
			);
		} finally {
			submitting = false;
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
