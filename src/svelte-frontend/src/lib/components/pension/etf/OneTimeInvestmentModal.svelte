<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { toastStore } from '$lib/stores/toast.svelte';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import { todayIsoDate } from '$lib/utils/date-only';

	let {
		open,
		pensionId,
		pensionName,
		onClose,
		onSuccess
	}: {
		open: boolean;
		pensionId: number;
		pensionName: string;
		onClose: () => void;
		onSuccess?: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;
	let submitting = $state(false);

	let amount = $state(0);
	let investmentDate = $state(todayIsoDate());
	let note = $state('');
	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
			// Reset form on open
			amount = 0;
			investmentDate = todayIsoDate();
			note = '';
			errors = {};
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!amount || amount <= 0) newErrors.amount = m.etf_one_time_amount_required();
		if (!investmentDate) newErrors.investment_date = m.etf_one_time_date_required();
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			await pensionApi.addETFOneTimeInvestment(pensionId, {
				amount,
				investment_date: investmentDate,
				note: note.trim() || undefined
			});
			toastStore.success(m.etf_one_time_added());
			onSuccess?.();
			onClose();
		} catch (error) {
			console.error('Error adding one-time investment:', error);
			toastStore.error(error instanceof Error ? error.message : m.etf_one_time_failed());
		} finally {
			submitting = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => {
		if (e.target === dialogEl) onClose();
	}}
	onclose={onClose}
	class="rounded-xl p-0 max-w-md w-full shadow-xl border border-border"
>
	<form onsubmit={handleSubmit}>
		<div class="p-6 space-y-4">
			<div>
				<h2 class="text-lg font-semibold">{m.etf_add_one_time_investment()}</h2>
				<p class="text-sm text-muted-foreground mt-1">{pensionName}</p>
			</div>

			<!-- Amount -->
			<div class="space-y-1">
				<p class="text-sm font-medium">{m.etf_one_time_amount()}</p>
				<CurrencyInput bind:value={amount} />
				{#if errors.amount}
					<p class="text-xs text-destructive">{errors.amount}</p>
				{/if}
			</div>

			<!-- Date -->
			<div class="space-y-1">
				<label for="investment-date" class="text-sm font-medium">{m.etf_one_time_date()}</label>
				<input
					id="investment-date"
					type="date"
					bind:value={investmentDate}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-ring {errors.investment_date ? 'border-destructive' : ''}"
				/>
				{#if errors.investment_date}
					<p class="text-xs text-destructive">{errors.investment_date}</p>
				{/if}
			</div>

			<!-- Note -->
			<div class="space-y-1">
				<label for="investment-note" class="text-sm font-medium">{m.etf_one_time_note()}</label>
				<textarea
					id="investment-note"
					bind:value={note}
					placeholder={m.etf_one_time_note_placeholder()}
					rows="2"
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
				></textarea>
			</div>

			<div class="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onclick={onClose}
					disabled={submitting}
					class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
				>
					{m.cancel()}
				</button>
				<button
					type="submit"
					disabled={submitting}
					class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
				>
					{m.etf_one_time_submit()}
				</button>
			</div>
		</div>
	</form>
</dialog>
