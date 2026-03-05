<!--
@file src/lib/components/dashboard/FixedIncomeCard.svelte
@kind component
@purpose Zeigt das gesicherte monatliche Einkommen bei Rentenbeginn (staatliche Rente, Betriebsrente, Versicherung)
  aus der Kompass-Analyse. Nur sichtbar wenn Kompass konfiguriert ist.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { compassApi } from '$lib/api/compass';
	import { formatCurrency } from '$lib/utils/format';
	import Card from '$lib/components/ui/Card.svelte';

	interface IncomeBreakdown {
		state: number;
		company: number;
		insurance: number;
	}

	let breakdown = $state<IncomeBreakdown | null>(null);
	let loadSeq = 0;

	$effect(() => {
		const memberId = dashboardStore.selectedMemberId;
		const seq = ++loadSeq;

		compassApi.getAllConfigs().then(async (configs) => {
			if (seq !== loadSeq) return;
			if (configs.length === 0) { breakdown = null; return; }

			try {
				if (memberId !== undefined) {
					const config = configs.find((c) => c.member_id === memberId);
					if (!config) { breakdown = null; return; }
					const analysis = await compassApi.getAnalysis(memberId);
					if (seq !== loadSeq) return;
					breakdown = {
						state: Number(analysis.breakdown.state_monthly.realistic),
						company: Number(analysis.breakdown.company_monthly),
						insurance: Number(analysis.breakdown.insurance_monthly)
					};
				} else {
					const analyses = await Promise.all(
						configs.map((c) => compassApi.getAnalysis(c.member_id).catch(() => null))
					);
					if (seq !== loadSeq) return;
					breakdown = {
						state: analyses.reduce((sum, a) => sum + Number(a?.breakdown.state_monthly?.realistic ?? 0), 0),
						company: analyses.reduce((sum, a) => sum + Number(a?.breakdown.company_monthly ?? 0), 0),
						insurance: analyses.reduce((sum, a) => sum + Number(a?.breakdown.insurance_monthly ?? 0), 0)
					};
				}
			} catch {
				if (seq !== loadSeq) return;
				breakdown = null;
			}
		}).catch(() => {
			breakdown = null;
		});
	});

	const total = $derived(breakdown ? breakdown.state + breakdown.company + breakdown.insurance : 0);
	const hasData = $derived(breakdown !== null && total > 0);

	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);
</script>

{#if hasData && breakdown}
	<Card title={m.dashboard_fixed_income_title()} description={m.dashboard_fixed_income_description()}>
		<div class="space-y-2">
			{#if breakdown.state > 0}
				<div class="flex justify-between items-center text-sm">
					<span class="text-muted-foreground">{m.pension_type_state()}</span>
					<span class="font-medium">{formatCurrency(breakdown.state, locale, currency, 0)}/mo</span>
				</div>
			{/if}
			{#if breakdown.company > 0}
				<div class="flex justify-between items-center text-sm">
					<span class="text-muted-foreground">{m.pension_type_company()}</span>
					<span class="font-medium">{formatCurrency(breakdown.company, locale, currency, 0)}/mo</span>
				</div>
			{/if}
			{#if breakdown.insurance > 0}
				<div class="flex justify-between items-center text-sm">
					<span class="text-muted-foreground">{m.pension_type_insurance()}</span>
					<span class="font-medium">{formatCurrency(breakdown.insurance, locale, currency, 0)}/mo</span>
				</div>
			{/if}
			<hr class="border-border" />
			<div class="flex justify-between items-center text-sm font-semibold">
				<span>{m.dashboard_fixed_income_total()}</span>
				<span>{formatCurrency(total, locale, currency, 0)}/mo</span>
			</div>
			<p class="text-xs text-muted-foreground pt-1">{m.dashboard_fixed_income_context()}</p>
		</div>
	</Card>
{/if}
