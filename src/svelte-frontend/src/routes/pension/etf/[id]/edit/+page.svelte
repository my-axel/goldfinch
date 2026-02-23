<!--
@file src/routes/pension/etf/[id]/edit/+page.svelte
@kind route
@purpose Rendert die Route 'pension/etf/[id]/edit' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `hydrateForm()`, `validate()`, `handleSubmit()`, `handlePause()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionApi } from '$lib/api/pension';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { PensionType } from '$lib/types/pension';
	import type { ETFPension, ContributionStep, ETFPensionStatistics } from '$lib/types/pension';
	import { calculateCombinedScenarios } from '$lib/utils/projection';
	import { formatCurrency, formatPercent, formatDate } from '$lib/utils/format';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationList from '$lib/components/ui/ExplanationList.svelte';
	import ExplanationListItem from '$lib/components/ui/ExplanationListItem.svelte';
	import ExplanationStats from '$lib/components/ui/ExplanationStats.svelte';
	import ExplanationStat from '$lib/components/ui/ExplanationStat.svelte';
	import BasicInformationCard from '$lib/components/pension/etf/BasicInformationCard.svelte';
	import HistoricalPerformanceChart from '$lib/components/pension/etf/HistoricalPerformanceChart.svelte';
	import ProjectionChart from '$lib/components/pension/etf/ProjectionChart.svelte';
	import ContributionPlanCard from '$lib/components/pension/ContributionPlanCard.svelte';
	import ContributionHistoryCard from '$lib/components/pension/ContributionHistoryCard.svelte';
	import ScenarioRatesCard from '$lib/components/pension/ScenarioRatesCard.svelte';
	import PensionStatusActions from '$lib/components/pension/PensionStatusActions.svelte';
	import OneTimeInvestmentModal from '$lib/components/pension/etf/OneTimeInvestmentModal.svelte';
	import type { PageData } from './$types';
	import {
		Wallet,
		TrendingUp,
		TrendingDown,
		ArrowRight,
		Calendar,
		CircleDot,
		CalendarClock
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let pensionId = $derived(data.pensionId);

	// Loading/error state
	let loadError = $state('');
	let submitting = $state(false);

	// Pension data
	let pension = $state<ETFPension | null>(null);

	// Form state
	let name = $state('');
	let etfId = $state('');
	let etfDisplayName = $state('');
	let existingUnits = $state(0);
	let referenceDate = $state('');
	let notes = $state('');
	let contributionPlanSteps = $state<ContributionStep[]>([]);
	let errors = $state<Record<string, string>>({});

	// Per-pension scenario rates (decimal format for PercentInput: 0.07 = 7%)
	let pessimisticRate = $state(0.04);
	let realisticRate = $state(0.07);
	let optimisticRate = $state(0.10);

	// Statistics (loaded non-blocking after page load)
	let statistics = $state<ETFPensionStatistics | null>(null);
	let statisticsLoading = $state(false);

	// One-time investment modal
	let showOneTimeModal = $state(false);

	// Retirement date from loaded member
	const retirementDateStr = $derived(data.member?.retirement_date_planned ?? null);

	// Settings for formatting
	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);

	function hydrateForm(p: ETFPension) {
		name = p.name;
		etfId = p.etf_id;
		etfDisplayName = p.etf ? `${p.etf.symbol} - ${p.etf.name}` : p.etf_id;
		existingUnits = p.existing_units ?? 0;
		referenceDate = p.reference_date ?? '';
		notes = p.notes ?? '';
		contributionPlanSteps = (p.contribution_plan_steps ?? []).map((step) => ({ ...step }));
		// Initialize rates from pension (if set) or fall back to global settings
		pessimisticRate = p.pessimistic_rate != null
			? p.pessimistic_rate / 100
			: settingsStore.current.projection_pessimistic_rate / 100;
		realisticRate = p.realistic_rate != null
			? p.realistic_rate / 100
			: settingsStore.current.projection_realistic_rate / 100;
		optimisticRate = p.optimistic_rate != null
			? p.optimistic_rate / 100
			: settingsStore.current.projection_optimistic_rate / 100;
	}

	$effect(() => {
		loadError = data.initialError;
		pension = data.initialPension;
		if (data.initialPension) {
			hydrateForm(data.initialPension);
		}
	});

	// Load statistics non-blocking
	$effect(() => {
		if (pensionId) {
			statisticsLoading = true;
			pensionApi
				.getETFPensionStatistics(pensionId)
				.then((s) => {
					statistics = s;
				})
				.catch((err) => {
					console.error('Failed to load ETF statistics:', err);
				})
				.finally(() => {
					statisticsLoading = false;
				});
		}
	});

	// Projection calculation for sidebar stats
	const projectionData = $derived.by(() => {
		if (!statistics || !retirementDateStr) return null;

		const { value_history, contribution_history } = statistics;
		if (!value_history || value_history.length === 0) return null;

		const sortedHistory = [...value_history].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		const lastPoint = sortedHistory[sortedHistory.length - 1];
		const initialValue = Number(lastPoint.value);

		const projectionStart = new Date(lastPoint.date);
		projectionStart.setMonth(projectionStart.getMonth() + 1);

		const retirementDate = new Date(retirementDateStr);
		if (retirementDate <= new Date()) return null;

		try {
			return calculateCombinedScenarios({
				initialValue,
				contributionSteps: contributionPlanSteps,
				rates: {
					pessimistic: pessimisticRate * 100,
					realistic: realisticRate * 100,
					optimistic: optimisticRate * 100
				},
				startDate: projectionStart,
				endDate: retirementDate,
				historicalContributions: contribution_history
			});
		} catch {
			return null;
		}
	});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = 'Name is required';
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate() || !pension) return;

		submitting = true;
		try {
			const pensionData = {
				name: name.trim(),
				etf_id: etfId,
				is_existing_investment: pension.is_existing_investment,
				existing_units: existingUnits,
				reference_date: referenceDate || undefined,
				notes: notes.trim() || '',
				pessimistic_rate: pessimisticRate * 100,
				realistic_rate: realisticRate * 100,
				optimistic_rate: optimisticRate * 100,
				contribution_plan_steps: contributionPlanSteps.map((step) => ({
					id: step.id,
					amount: step.amount,
					frequency: step.frequency,
					start_date: step.start_date,
					end_date: step.end_date || undefined,
					note: step.note || ''
				}))
			};

			await pensionApi.update(PensionType.ETF_PLAN, pensionId, pensionData);
			toastStore.success(m.etf_pension_updated());
			goto('/pension');
		} catch (error) {
			console.error('Error updating ETF pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.etf_pension_update_failed());
		} finally {
			submitting = false;
		}
	}

	async function handlePause(pauseDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.ETF_PLAN, pensionId, {
				status: 'PAUSED',
				paused_at: pauseDate
			});
			pension = await pensionApi.get<ETFPension>(PensionType.ETF_PLAN, pensionId);
		} catch (error) {
			console.error('Error pausing pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.etf_pension_update_failed());
		}
	}

	async function handleResume(resumeDate: string) {
		try {
			await pensionStore.updateStatus(PensionType.ETF_PLAN, pensionId, {
				status: 'ACTIVE',
				resume_at: resumeDate
			});
			pension = await pensionApi.get<ETFPension>(PensionType.ETF_PLAN, pensionId);
		} catch (error) {
			console.error('Error resuming pension:', error);
			toastStore.error(error instanceof Error ? error.message : m.etf_pension_update_failed());
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
		<PageHeader title={m.etf_pension_edit_title()} description={m.etf_pension_edit_description()} />
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
				form="etf-pension-form"
				disabled={submitting}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
			>
				{m.etf_pension_save()}
			</button>
		</div>
	</div>

	{#if loadError}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{loadError}</p>
		</div>
	{:else if !pension}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{m.etf_pension_not_found()}</p>
		</div>
	{:else}
		<form id="etf-pension-form" onsubmit={handleSubmit} class="space-y-8">
			<!-- Section 1: Basic Information -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.etf_basic_info_explanation_intro()}</p>
						<ExplanationList>
							<ExplanationListItem
								><strong>{m.etf_pension_name()}:</strong>
								{m.etf_basic_info_explanation_name()}</ExplanationListItem
							>
							<ExplanationListItem
								><strong>{m.etf_pension_etf()}:</strong>
								{m.etf_basic_info_explanation_etf()}</ExplanationListItem
							>
							<ExplanationListItem
								><strong>{m.etf_pension_notes()}:</strong>
								{m.etf_basic_info_explanation_notes()}</ExplanationListItem
							>
						</ExplanationList>
					</Explanation>
				{/snippet}
				<Card title={m.etf_pension_edit_title()}>
					{#snippet headerActions()}
						<PensionStatusActions
							status={pension!.status}
							onPause={handlePause}
							onResume={handleResume}
						/>
					{/snippet}
					<BasicInformationCard
						bind:name
						bind:etfId
						bind:etfDisplayName
						bind:existingUnits
						bind:referenceDate
						bind:notes
						isExistingInvestment={pension.is_existing_investment}
						isEditing={true}
						{errors}
					/>
				</Card>
			</ContentSection>

			<!-- Section 2: Projection Rates -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.pension_scenario_rates_explanation()}</p>
					</Explanation>
				{/snippet}
				<Card title={m.pension_scenario_rates_title()}>
					<ScenarioRatesCard
						bind:pessimisticRate
						bind:realisticRate
						bind:optimisticRate
					/>
				</Card>
			</ContentSection>

			<!-- Section 3: Contribution Plan -->
			<ContentSection>
				{#snippet aside()}
					<Explanation>
						<p>{m.etf_contribution_explanation_intro()}</p>
						<p class="text-sm text-muted-foreground">{m.etf_contribution_explanation_growth()}</p>
					</Explanation>
				{/snippet}
				<ContributionPlanCard bind:steps={contributionPlanSteps} />
			</ContentSection>

			<!-- Section 3: Historical Performance -->
			<ContentSection>
				{#snippet aside()}
					{#if statisticsLoading}
						<div class="space-y-2">
							<div class="h-16 animate-pulse bg-muted rounded-lg"></div>
							<div class="h-16 animate-pulse bg-muted rounded-lg"></div>
						</div>
					{:else if statistics}
						<Explanation>
							<p class="text-sm text-muted-foreground">{m.etf_historical_explanation_intro()}</p>
							<ExplanationStats columns={2}>
								<ExplanationStat
									icon={Wallet}
									label={m.etf_total_invested()}
									value={formatCurrency(statistics.total_invested_amount, locale, currency, 0)}
								/>
								<ExplanationStat
									icon={TrendingUp}
									label={m.etf_current_value()}
									value={formatCurrency(statistics.current_value, locale, currency, 0)}
								/>
								<ExplanationStat
									icon={CircleDot}
									label={m.etf_contributions()}
									value={statistics.contribution_history.length}
									subValue={statistics.contribution_history.length > 0
										? formatDate(
												statistics.contribution_history[
													statistics.contribution_history.length - 1
												].contribution_date,
												locale,
												{ month: 'short', year: 'numeric' }
											)
										: undefined}
								/>
								<ExplanationStat
									icon={CalendarClock}
									label={m.etf_total_return()}
									value={formatCurrency(statistics.total_return, locale, currency, 0)}
									subValue={statistics.annual_return != null
										? formatPercent(statistics.annual_return / 100, locale, 1)
										: undefined}
									subLabel={statistics.annual_return != null ? m.etf_annual_return() : undefined}
								/>
							</ExplanationStats>
						</Explanation>
					{:else}
						<Explanation>
							<p class="text-sm text-muted-foreground">{m.etf_historical_explanation_intro()}</p>
						</Explanation>
					{/if}
				{/snippet}
				<Card title={m.etf_historical_title()}>
					<HistoricalPerformanceChart
						contributionHistory={statistics?.contribution_history ?? []}
						valueHistory={statistics?.value_history ?? []}
						loading={statisticsLoading}
					/>
				</Card>
			</ContentSection>

			<!-- Section 4: Value Projection -->
			<ContentSection>
				{#snippet aside()}
					{#if statisticsLoading}
						<div class="space-y-2">
							<div class="h-16 animate-pulse bg-muted rounded-lg"></div>
							<div class="h-16 animate-pulse bg-muted rounded-lg"></div>
							<div class="h-16 animate-pulse bg-muted rounded-lg"></div>
						</div>
					{:else if projectionData}
						<Explanation>
							<p class="text-sm text-muted-foreground">{m.etf_projection_explanation_intro()}</p>
							<ExplanationStats columns={1}>
								<ExplanationStat
									icon={TrendingDown}
									label={m.etf_pessimistic_value()}
									value={formatCurrency(
										projectionData.scenarios.pessimistic.finalValue,
										locale,
										currency,
										0
									)}
									subValue="{(pessimisticRate * 100).toFixed(1)}% p.a."
								/>
								<ExplanationStat
									icon={ArrowRight}
									label={m.etf_realistic_value()}
									value={formatCurrency(
										projectionData.scenarios.realistic.finalValue,
										locale,
										currency,
										0
									)}
									subValue="{(realisticRate * 100).toFixed(1)}% p.a."
								/>
								<ExplanationStat
									icon={TrendingUp}
									label={m.etf_optimistic_value()}
									value={formatCurrency(
										projectionData.scenarios.optimistic.finalValue,
										locale,
										currency,
										0
									)}
									subValue="{(optimisticRate * 100).toFixed(1)}% p.a."
								/>
							</ExplanationStats>
							<ExplanationStats columns={2}>
								<ExplanationStat
									icon={Wallet}
									label={m.etf_total_contributions_label()}
									value={formatCurrency(
										projectionData.scenarios.realistic.totalContributions,
										locale,
										currency,
										0
									)}
								/>
								{#if retirementDateStr}
									<ExplanationStat
										icon={Calendar}
										label={m.etf_retirement_date_label()}
										value={formatDate(retirementDateStr, locale, {
											month: 'short',
											year: 'numeric'
										})}
									/>
								{/if}
							</ExplanationStats>
						</Explanation>
					{:else}
						<Explanation>
							<p class="text-sm text-muted-foreground">{m.etf_projection_explanation_intro()}</p>
							<p class="text-sm text-muted-foreground">{m.etf_projection_explanation_scenarios()}</p>
						</Explanation>
					{/if}
				{/snippet}
				<Card title={m.etf_projection_title()}>
					<ProjectionChart
						{statistics}
						contributionSteps={contributionPlanSteps}
						retirementDate={retirementDateStr}
						loading={statisticsLoading}
						pessimisticRate={pessimisticRate * 100}
						realisticRate={realisticRate * 100}
						optimisticRate={optimisticRate * 100}
					/>
				</Card>
			</ContentSection>

		<!-- Section 5: Contribution History -->
		<ContentSection>
			{#snippet aside()}
				<Explanation>
					<p>{m.contribution_history_explanation()}</p>
				</Explanation>
			{/snippet}
			<ContributionHistoryCard contributions={statistics?.contribution_history ?? []}>
				{#snippet headerActions()}
					<button
						type="button"
						onclick={() => (showOneTimeModal = true)}
						class="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium transition-colors"
					>
						{m.etf_add_one_time_investment()}
					</button>
				{/snippet}
			</ContributionHistoryCard>
		</ContentSection>

		</form>
	{/if}
</div>

<!-- One-Time Investment Modal -->
<OneTimeInvestmentModal
	open={showOneTimeModal}
	{pensionId}
	pensionName={pension?.name ?? ''}
	onClose={() => (showOneTimeModal = false)}
	onSuccess={() => {
		// Reload statistics after adding one-time investment
		if (pensionId) {
			statisticsLoading = true;
			pensionApi
				.getETFPensionStatistics(pensionId)
				.then((s) => {
					statistics = s;
				})
				.finally(() => {
					statisticsLoading = false;
				});
		}
	}}
/>
