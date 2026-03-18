<!--
@file src/lib/components/compass/GapConfigForm.svelte
@kind component
@purpose Form for entering a member's retirement gap configuration (net income, rates, optional desired pension).
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import PercentInput from '$lib/components/ui/PercentInput.svelte';
	import StepperInput from '$lib/components/ui/StepperInput.svelte';
	import { compassApi } from '$lib/api/compass';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { RetirementGapConfig, RetirementGapConfigCreate, GapAnalysisResult } from '$lib/types/compass';

	let {
		memberId,
		retirementAge,
		config,
		onSave,
		onDelete
	}: {
		memberId: number;
		retirementAge: number;
		config: RetirementGapConfig | null;
		onSave: (savedConfig: RetirementGapConfig, analysis: GapAnalysisResult) => void;
		onDelete: () => void;
	} = $props();

	// Form state — rates are decimal (0.80 = 80%), displayed as % via PercentInput.
	// annual_salary_growth_rate: API stores as percentage (2.0 = 2%),
	// but PercentInput expects decimal (0.02 = 2%) → divide/multiply by 100 on load/save.
	let netMonthlyIncome = $state(0);
	let replacementRate = $state(0.8);
	let withdrawalUntilAge = $state(90);
	let capitalDepletion = $state(true);
	let annualSalaryGrowthRate = $state(0.02); // decimal form for PercentInput
	let hasPensionDeduction = $state(false);
	let pensionDeductionRate = $state(0.15); // decimal form for PercentInput (15% default when enabled)
	let hasDesiredPension = $state(false);
	let desiredPensionAmount = $state(0);

	let saving = $state(false);
	let deleting = $state(false);

	// Sync form from config prop (runs on mount and whenever config changes)
	$effect(() => {
		netMonthlyIncome = config?.net_monthly_income ?? 0;
		replacementRate = config?.replacement_rate ?? 0.8;
		withdrawalUntilAge = config?.withdrawal_until_age ?? Math.min(105, retirementAge + 25);
		capitalDepletion = config?.capital_depletion ?? true;
		annualSalaryGrowthRate = (config?.annual_salary_growth_rate ?? 2.0) / 100;
		hasPensionDeduction = config?.pension_deduction_rate != null;
		pensionDeductionRate = (config?.pension_deduction_rate ?? 15.0) / 100;
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
				withdrawal_until_age: withdrawalUntilAge,
				capital_depletion: capitalDepletion,
				annual_salary_growth_rate: annualSalaryGrowthRate * 100,
				pension_deduction_rate: hasPensionDeduction ? pensionDeductionRate * 100 : null,
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

	<!-- Retirement need: Replacement rate + Salary growth (clean 2-col) -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<p class="text-sm font-medium mb-1.5">{m.compass_gap_replacement_rate_label()}</p>
			<PercentInput bind:value={replacementRate} min={0.5} max={1.0} decimals={0} />
		</div>
		<div>
			<p class="text-sm font-medium mb-1.5">{m.compass_gap_salary_growth_rate_label()}</p>
			<PercentInput bind:value={annualSalaryGrowthRate} min={0} max={0.10} decimals={1} />
			<p class="text-xs text-muted-foreground mt-1">{m.compass_gap_salary_growth_rate_hint()}</p>
		</div>
	</div>

	<!-- Withdrawal strategy: Age + Capital depletion (visually paired) -->
	<div class="rounded-lg border border-border bg-muted/20 p-4 flex flex-wrap items-start gap-x-8 gap-y-4">
		<div>
			<p class="text-sm font-medium mb-1.5">{m.compass_gap_withdrawal_until_age_label()}</p>
			<div class="w-36">
				<StepperInput bind:value={withdrawalUntilAge} min={retirementAge + 1} max={105} step={1} />
			</div>
		</div>
		<div class="pt-0.5">
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" bind:checked={capitalDepletion} class="rounded border-border" />
				<span class="text-sm font-medium">{m.compass_gap_capital_depletion_label()}</span>
			</label>
			<p class="text-xs text-muted-foreground mt-1.5">{m.compass_gap_capital_depletion_hint()}</p>
		</div>
	</div>

	<!-- Optional adjustments (visually secondary) -->
	<div class="space-y-3 pt-1 border-t border-border">
		<!-- Pension Deduction Rate -->
		<div class="pt-3">
			<label class="flex items-center gap-2 mb-2 cursor-pointer">
				<input type="checkbox" bind:checked={hasPensionDeduction} class="rounded border-border" />
				<span class="text-sm text-muted-foreground font-medium">{m.compass_gap_pension_deduction_label()}</span>
			</label>
			{#if hasPensionDeduction}
				<PercentInput bind:value={pensionDeductionRate} min={0} max={0.50} decimals={0} />
				<p class="text-xs text-muted-foreground mt-1">{m.compass_gap_pension_deduction_hint()}</p>
			{/if}
		</div>

		<!-- Desired Monthly Pension override -->
		<div>
			<label class="flex items-center gap-2 mb-2 cursor-pointer">
				<input type="checkbox" bind:checked={hasDesiredPension} class="rounded border-border" />
				<span class="text-sm text-muted-foreground font-medium">{m.compass_gap_desired_pension_label()}</span>
			</label>
			{#if hasDesiredPension}
				<CurrencyInput bind:value={desiredPensionAmount} min={0} />
				<p class="text-xs text-muted-foreground mt-1">{m.compass_gap_desired_pension_hint()}</p>
			{/if}
		</div>
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
