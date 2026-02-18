<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Plus, Trash2, ChevronDown, ChevronRight } from '@lucide/svelte';
	import { pensionApi } from '$lib/api/pension';
	import { compareIsoDate, todayIsoDate } from '$lib/utils/date-only';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import FormattedDate from '$lib/components/ui/FormattedDate.svelte';

	interface StatementFormData {
		id: number;
		pension_id: number;
		statement_date: string;
		balance: number;
		note?: string;
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
				balance: 0,
				note: ''
			}
		];
	}

	async function handleRemoveStatement(index: number) {
		const statement = statements[index];
		if (pensionId && statement?.id) {
			try {
				await pensionApi.deleteSavingsPensionStatement(pensionId, statement.id);
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
			{m.savings_pension_add_statement()}
		</button>
	{/if}

	<!-- Latest Statement Form -->
	{#if statements.length > 0}
		{@const li = latestIndex}
		<div class="space-y-4">
			<h3 class="text-lg font-medium">
				{m.savings_pension_latest_statement()} (<FormattedDate value={statements[li].statement_date} />)
			</h3>
			<div class="p-4 border border-border rounded-lg">
				{@render statementForm(li)}
			</div>
		</div>
	{/if}

	<!-- Previous Statements (collapsible) -->
	{#if previousStatements.length > 0}
		<div class="space-y-4">
			<h3 class="text-lg font-medium">{m.savings_pension_previous_statements()}</h3>
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
			{m.savings_pension_add_first_statement()}
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
		<h2 class="text-lg font-semibold">{m.savings_pension_delete_statement_title()}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{m.savings_pension_delete_statement_confirm()}</p>
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
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium mb-1.5">
					{m.savings_pension_statement_date()}
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
					{m.savings_pension_balance()}
				</label>
				<CurrencyInput bind:value={statements[index].balance} min={0} />
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.savings_pension_statement_note()}
				<textarea
					bind:value={statements[index].note}
					placeholder={m.savings_pension_statement_note_placeholder()}
					rows="3"
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
				></textarea>
			</label>
		</div>
	</div>
{/snippet}
