<!--
@file src/lib/components/pension/insurance/StatementsCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'StatementsCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Kernfunktionen `getLatestStatementIndex()`, `handleAddStatement()`, `handleRemoveStatement()`, `toggleStatement()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Plus, Trash2, ChevronDown, ChevronRight } from '@lucide/svelte';
	import { pensionApi } from '$lib/api/pension';
	import { compareIsoDate, todayIsoDate } from '$lib/utils/date-only';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import PercentInput from '$lib/components/ui/PercentInput.svelte';
	import FormattedDate from '$lib/components/ui/FormattedDate.svelte';

	interface ProjectionFormData {
		id: number;
		scenario_type: 'with_contributions' | 'without_contributions';
		return_rate: number; // form decimal: 0.02 = 2%
		value_at_retirement: number;
		monthly_payout: number;
	}

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		value: number;
		total_contributions: number;
		total_benefits: number;
		costs_amount: number;
		costs_percentage: number; // form decimal: 0.015 = 1.5%
		note?: string;
		projections: ProjectionFormData[];
	}

	let {
		statements = $bindable([]),
		pensionId
	}: {
		statements: StatementFormData[];
		pensionId?: number;
	} = $props();

	let expandedStatements = $state<Record<number, boolean>>({});
	let deletingIndex = $state<number | null>(null);
	let deleteDialogEl: HTMLDialogElement;

	$effect(() => {
		if (!deleteDialogEl) return;
		if (deletingIndex !== null && !deleteDialogEl.open) deleteDialogEl.showModal();
		else if (deletingIndex === null && deleteDialogEl.open) deleteDialogEl.close();
	});

	function getLatestStatementIndex(): number {
		if (statements.length === 0) return -1;
		let latestIndex = 0;
		let latestDate = statements[0].statement_date;
		statements.forEach((s, i) => {
			if (compareIsoDate(s.statement_date, latestDate) > 0) {
				latestDate = s.statement_date;
				latestIndex = i;
			}
		});
		return latestIndex;
	}

	let latestIndex = $derived(getLatestStatementIndex());
	let previousStatements = $derived(
		statements
			.map((s, i) => ({ statement: s, originalIndex: i }))
			.filter((_, i) => i !== latestIndex)
			.sort((a, b) => compareIsoDate(b.statement.statement_date, a.statement.statement_date))
	);

	function handleAddStatement() {
		statements = [
			...statements,
			{
				id: 0,
				pension_id: pensionId ?? 0,
				statement_date: todayIsoDate(),
				value: 0,
				total_contributions: 0,
				total_benefits: 0,
				costs_amount: 0,
				costs_percentage: 0,
				note: '',
				projections: []
			}
		];
	}

	async function handleRemoveStatement(index: number) {
		const statement = statements[index];
		if (pensionId && statement?.id) {
			try {
				await pensionApi.deleteInsurancePensionStatement(pensionId, statement.id);
			} catch (error) {
				console.error('Error deleting statement:', error);
				return;
			}
		}
		statements = statements.filter((_, i) => i !== index);
		deletingIndex = null;
	}

	function toggleStatement(index: number) {
		expandedStatements = { ...expandedStatements, [index]: !expandedStatements[index] };
	}

	function handleAddProjection(statementIndex: number) {
		const updated = [...statements];
		updated[statementIndex] = {
			...updated[statementIndex],
			projections: [
				...updated[statementIndex].projections,
				{
					id: 0,
					scenario_type: 'with_contributions',
					return_rate: 0,
					value_at_retirement: 0,
					monthly_payout: 0
				}
			]
		};
		statements = updated;
	}

	function handleRemoveProjection(statementIndex: number, projIndex: number) {
		const updated = [...statements];
		updated[statementIndex] = {
			...updated[statementIndex],
			projections: updated[statementIndex].projections.filter((_, i) => i !== projIndex)
		};
		statements = updated;
	}
</script>

<div class="space-y-6">
	<!-- Add Statement Button (shown when statements exist) -->
	{#if statements.length > 0}
		<button
			type="button"
			onclick={handleAddStatement}
			class="flex items-center justify-center w-full border-2 border-dashed border-border rounded-lg
				py-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
		>
			<Plus class="h-4 w-4 mr-2" />
			{m.insurance_pension_add_statement()}
		</button>
	{/if}

	<!-- Latest Statement Form -->
	{#if statements.length > 0}
		{@const li = latestIndex}
		<div class="space-y-4">
			<h3 class="text-lg font-medium">
				{m.insurance_pension_latest_statement()} (<FormattedDate value={statements[li].statement_date} />)
			</h3>
			<div class="p-4 border border-border rounded-lg">
				{@render statementForm(li)}
			</div>
		</div>
	{/if}

	<!-- Previous Statements (collapsible) -->
	{#if previousStatements.length > 0}
		<div class="space-y-4">
			<h3 class="text-lg font-medium">{m.insurance_pension_previous_statements()}</h3>
			{#each previousStatements as { originalIndex } (originalIndex)}
				<div class="border border-border rounded-lg overflow-hidden">
					<div class="p-4 flex justify-between items-center bg-muted/30">
						<button
							type="button"
							onclick={() => toggleStatement(originalIndex)}
							class="flex items-center gap-2 text-sm font-medium hover:text-foreground/80"
						>
							{#if expandedStatements[originalIndex]}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<ChevronRight class="h-4 w-4" />
							{/if}
							<span>
								Statement from <FormattedDate value={statements[originalIndex].statement_date} />
							</span>
						</button>
						<button
							type="button"
							onclick={() => { deletingIndex = originalIndex; }}
							class="p-1 text-muted-foreground hover:text-destructive transition-colors"
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
					{#if expandedStatements[originalIndex]}
						<div class="p-4">
							{@render statementForm(originalIndex)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Empty State -->
	{#if statements.length === 0}
		<button
			type="button"
			onclick={handleAddStatement}
			class="flex items-center justify-center w-full border-2 border-dashed border-border rounded-lg
				py-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
		>
			<Plus class="h-4 w-4 mr-2" />
			{m.insurance_pension_add_first_statement()}
		</button>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={deleteDialogEl}
	onclick={(e) => { if (e.target === deleteDialogEl) deletingIndex = null; }}
	onclose={() => deletingIndex = null}
	class="rounded-xl p-0 max-w-sm shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold">{m.insurance_pension_delete_statement_title()}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{m.insurance_pension_delete_statement_confirm()}</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={() => deletingIndex = null}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.cancel()}
			</button>
			<button
				onclick={() => { if (deletingIndex !== null) handleRemoveStatement(deletingIndex); }}
				class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.delete_action()}
			</button>
		</div>
	</div>
</dialog>

{#snippet statementForm(index: number)}
	<div class="space-y-4">
		<!-- Statement Date + Value -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_statement_date()}
					<input
						type="date"
						bind:value={statements[index].statement_date}
						class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
				</label>
			</div>
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_value()}
				</label>
				<CurrencyInput bind:value={statements[index].value} min={0} />
			</div>
		</div>

		<!-- Total Contributions + Total Benefits -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_total_contributions()}
				</label>
				<CurrencyInput bind:value={statements[index].total_contributions} min={0} />
			</div>
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_total_benefits()}
				</label>
				<CurrencyInput bind:value={statements[index].total_benefits} min={0} />
			</div>
		</div>

		<!-- Costs Amount + Costs Percentage -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_costs_amount()}
				</label>
				<CurrencyInput bind:value={statements[index].costs_amount} min={0} />
			</div>
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium mb-1.5">
					{m.insurance_pension_costs_percentage()}
				</label>
				<PercentInput bind:value={statements[index].costs_percentage} max={0.50} decimals={2} />
			</div>
		</div>

		<!-- Note -->
		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.insurance_pension_statement_note()}
				<textarea
					bind:value={statements[index].note}
					placeholder={m.insurance_pension_statement_note_placeholder()}
					rows="2"
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
				></textarea>
			</label>
		</div>

		<!-- Projections -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-medium">{m.insurance_pension_projections()}</h4>
				<button
					type="button"
					onclick={() => handleAddProjection(index)}
					class="flex items-center gap-1 px-2 py-1 border border-dashed border-border rounded text-xs text-muted-foreground
						hover:border-primary/50 hover:bg-accent/30 transition-colors"
				>
					<Plus class="h-3 w-3" />
					{m.insurance_pension_add_projection()}
				</button>
			</div>

			{#if statements[index].projections.length === 0}
				<p class="text-xs text-muted-foreground">{m.insurance_pension_no_projections()}</p>
			{:else}
				<!-- Column headers -->
				<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
					<span class="text-xs text-muted-foreground font-medium">Scenario</span>
					<span class="text-xs text-muted-foreground font-medium">{m.insurance_pension_return_rate()}</span>
					<span class="text-xs text-muted-foreground font-medium">{m.insurance_pension_value_at_retirement()}</span>
					<span class="text-xs text-muted-foreground font-medium">{m.insurance_pension_monthly_payout()}</span>
					<span></span>
				</div>
				{#each statements[index].projections as _, projIndex}
					<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
						<!-- Scenario Type -->
						<select
							bind:value={statements[index].projections[projIndex].scenario_type}
							class="h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="with_contributions">{m.insurance_pension_scenario_with_contributions()}</option>
							<option value="without_contributions">{m.insurance_pension_scenario_without_contributions()}</option>
						</select>

						<!-- Return Rate -->
						<PercentInput bind:value={statements[index].projections[projIndex].return_rate} max={0.50} decimals={2} />

						<!-- Value at Retirement -->
						<CurrencyInput bind:value={statements[index].projections[projIndex].value_at_retirement} min={0} />

						<!-- Monthly Payout -->
						<CurrencyInput bind:value={statements[index].projections[projIndex].monthly_payout} min={0} />

						<!-- Delete Projection -->
						<button
							type="button"
							onclick={() => handleRemoveProjection(index, projIndex)}
							class="p-1 text-muted-foreground hover:text-destructive transition-colors"
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/snippet}
