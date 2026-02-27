<!--
@file src/lib/components/compass/GapBreakdown.svelte
@kind component
@purpose Collapsible breakdown showing monthly income sources (State/Company/Insurance) and projected capital (ETF/Savings).
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';

	let { result }: { result: GapAnalysisResult } = $props();

	let open = $state(false);
</script>

<div class="border-t border-border pt-4">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		<svg
			class="w-4 h-4 transition-transform {open ? 'rotate-90' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
		{m.compass_gap_breakdown_toggle()}
	</button>

	{#if open}
		<div class="mt-4 space-y-4">
			<!-- Monthly Income Breakdown -->
			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
					{m.compass_gap_breakdown_monthly_income()}
				</p>
				<div class="space-y-1.5">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">{m.compass_gap_breakdown_state()}</span>
						<span class="font-medium"><FormattedCurrency value={result.breakdown.state_monthly} decimals={0} /></span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">{m.compass_gap_breakdown_company()}</span>
						<span class="font-medium"><FormattedCurrency value={result.breakdown.company_monthly} decimals={0} /></span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">{m.compass_gap_breakdown_insurance()}</span>
						<span class="font-medium"><FormattedCurrency value={result.breakdown.insurance_monthly} decimals={0} /></span>
					</div>
				</div>
			</div>

			<!-- Projected Capital Breakdown -->
			<div>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
					{m.compass_gap_breakdown_projected_capital()}
				</p>
				<div class="space-y-2">
					<div>
						<p class="text-sm text-muted-foreground mb-1">{m.compass_gap_breakdown_etf()}</p>
						<div class="grid grid-cols-3 gap-2 text-xs">
							<div class="text-center">
								<p class="text-muted-foreground">Pessimistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.etf_projected.pessimistic} decimals={0} /></p>
							</div>
							<div class="text-center">
								<p class="text-muted-foreground">Realistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.etf_projected.realistic} decimals={0} /></p>
							</div>
							<div class="text-center">
								<p class="text-muted-foreground">Optimistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.etf_projected.optimistic} decimals={0} /></p>
							</div>
						</div>
					</div>
					<div>
						<p class="text-sm text-muted-foreground mb-1">{m.compass_gap_breakdown_savings()}</p>
						<div class="grid grid-cols-3 gap-2 text-xs">
							<div class="text-center">
								<p class="text-muted-foreground">Pessimistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.savings_projected.pessimistic} decimals={0} /></p>
							</div>
							<div class="text-center">
								<p class="text-muted-foreground">Realistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.savings_projected.realistic} decimals={0} /></p>
							</div>
							<div class="text-center">
								<p class="text-muted-foreground">Optimistic</p>
								<p class="font-medium"><FormattedCurrency value={result.breakdown.savings_projected.optimistic} decimals={0} /></p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
