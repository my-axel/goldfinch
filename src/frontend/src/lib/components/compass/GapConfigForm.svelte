<!--
@file src/lib/components/compass/GapConfigForm.svelte
@kind component
@purpose Form for entering a member's retirement gap configuration (net income, rates, optional desired pension).
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import PercentInput from '$lib/components/ui/PercentInput.svelte';
	import { compassApi } from '$lib/api/compass';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { RetirementGapConfig, RetirementGapConfigCreate, GapAnalysisResult } from '$lib/types/compass';

	let {
		memberId,
		config,
		onSave,
		onDelete
	}: {
		memberId: number;
		config: RetirementGapConfig | null;
		onSave: (savedConfig: RetirementGapConfig, analysis: GapAnalysisResult) => void;
		onDelete: () => void;
	} = $props();

	// Form state — rates are decimal (0.80 = 80%), displayed as % via PercentInput
	let netMonthlyIncome = $state(0);
	let replacementRate = $state(0.8);
	let withdrawalRate = $state(0.04);
	let hasDesiredPension = $state(false);
	let desiredPensionAmount = $state(0);

	let saving = $state(false);
	let deleting = $state(false);

	// Sync form from config prop (runs on mount and whenever config changes)
	$effect(() => {
		netMonthlyIncome = config?.net_monthly_income ?? 0;
		replacementRate = config?.replacement_rate ?? 0.8;
		withdrawalRate = config?.withdrawal_rate ?? 0.04;
		hasDesiredPension = config?.desired_monthly_pension != null;
		desiredPensionAmount = config?.desired_monthly_pension ?? 0;
	});

	async function handleSave() {
		if (netMonthlyIncome <= 0) {
			toastStore.error('Monthly net income must be greater than 0');
			return;
		}
		saving = true;
		try {
			const payload: RetirementGapConfigCreate = {
				net_monthly_income: netMonthlyIncome,
				replacement_rate: replacementRate,
				withdrawal_rate: withdrawalRate,
				desired_monthly_pension: hasDesiredPension ? desiredPensionAmount : null
			};
			const savedConfig = config
				? await compassApi.updateConfig(memberId, payload)
				: await compassApi.createConfig(memberId, payload);
			const analysis = await compassApi.getAnalysis(memberId);
			toastStore.success(m.compass_gap_save());
			onSave(savedConfig, analysis);
		} catch {
			toastStore.error('Failed to save configuration');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			await compassApi.deleteConfig(memberId);
			toastStore.success(m.compass_gap_delete());
			onDelete();
		} catch {
			toastStore.error('Failed to delete configuration');
		} finally {
			deleting = false;
		}
	}
</script>

<div class="space-y-5">
	<!-- Net Monthly Income -->
	<div>
		<p class="text-sm font-medium mb-1.5">{m.compass_gap_net_income_label()}</p>
		<CurrencyInput bind:value={netMonthlyIncome} min={0} />
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Replacement Rate -->
		<div>
			<p class="text-sm font-medium mb-1.5">{m.compass_gap_replacement_rate_label()}</p>
			<PercentInput bind:value={replacementRate} min={0.5} max={1.0} decimals={0} />
		</div>

		<!-- Withdrawal Rate -->
		<div>
			<p class="text-sm font-medium mb-1.5">{m.compass_gap_withdrawal_rate_label()}</p>
			<PercentInput bind:value={withdrawalRate} min={0.02} max={0.06} decimals={1} />
		</div>
	</div>

	<!-- Desired Monthly Pension (optional override) -->
	<div>
		<label class="flex items-center gap-2 mb-2 cursor-pointer">
			<input type="checkbox" bind:checked={hasDesiredPension} class="rounded border-border" />
			<span class="text-sm font-medium">{m.compass_gap_desired_pension_label()}</span>
		</label>
		{#if hasDesiredPension}
			<CurrencyInput bind:value={desiredPensionAmount} min={0} />
			<p class="text-xs text-muted-foreground mt-1">{m.compass_gap_desired_pension_hint()}</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-3 pt-2">
		<button
			onclick={handleSave}
			disabled={saving}
			class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{saving ? '…' : m.compass_gap_save()}
		</button>

		{#if config}
			<button
				onclick={handleDelete}
				disabled={deleting}
				class="px-4 py-2 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{deleting ? '…' : m.compass_gap_delete()}
			</button>
		{/if}
	</div>
</div>
