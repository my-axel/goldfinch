<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { PensionType } from '$lib/types/pension';
	import type { HouseholdMember } from '$lib/types/household';
	import { formatMemberName } from '$lib/types/household';
	import { TrendingUp, Shield, Building2, Landmark, Coins } from '@lucide/svelte';

	let {
		open,
		members,
		onSelect,
		onCancel
	}: {
		open: boolean;
		members: HouseholdMember[];
		onSelect: (type: PensionType, memberId: number) => void;
		onCancel: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;
	let selectedMemberId = $state<number | null>(null);
	let selectedType = $state<PensionType | null>(null);

	// If only one member, auto-select
	let step = $derived<'member' | 'type'>(
		members.length === 1 ? 'type' : selectedMemberId ? 'type' : 'member'
	);

	$effect(() => {
		if (members.length === 1 && !selectedMemberId) {
			selectedMemberId = members[0].id;
		}
	});

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			selectedType = null;
			if (members.length > 1) selectedMemberId = null;
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleConfirm() {
		if (selectedType && selectedMemberId) {
			onSelect(selectedType, selectedMemberId);
		}
	}

	const pensionTypes = [
		{ type: PensionType.ETF_PLAN, label: () => m.pension_type_etf(), description: () => m.pension_type_etf_description(), icon: TrendingUp },
		{ type: PensionType.INSURANCE, label: () => m.pension_type_insurance(), description: () => m.pension_type_insurance_description(), icon: Shield },
		{ type: PensionType.COMPANY, label: () => m.pension_type_company(), description: () => m.pension_type_company_description(), icon: Building2 },
		{ type: PensionType.STATE, label: () => m.pension_type_state(), description: () => m.pension_type_state_description(), icon: Landmark },
		{ type: PensionType.SAVINGS, label: () => m.pension_type_savings(), description: () => m.pension_type_savings_description(), icon: Coins }
	];
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => { if (e.target === dialogEl) onCancel(); }}
	onclose={onCancel}
	class="rounded-xl p-0 max-w-md w-full shadow-xl border border-border"
>
	<div class="p-6">
		{#if step === 'member'}
			<h2 class="text-lg font-semibold">{m.pension_select_member()}</h2>
			<p class="mt-1 text-sm text-muted-foreground">{m.pension_select_member_description()}</p>
			<div class="mt-4 space-y-2">
				{#each members as member}
					<button
						onclick={() => { selectedMemberId = member.id; }}
						class="w-full text-left px-4 py-3 rounded-lg border transition-colors {selectedMemberId === member.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'}"
					>
						<span class="font-medium">{formatMemberName(member)}</span>
					</button>
				{/each}
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					onclick={onCancel}
					class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
				>
					{m.pension_cancel()}
				</button>
				<button
					onclick={() => { /* selectedMemberId triggers step change via $derived */ }}
					disabled={!selectedMemberId}
					class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
				>
					{m.pension_continue()}
				</button>
			</div>
		{:else}
			<h2 class="text-lg font-semibold">{m.pension_select_type()}</h2>
			<p class="mt-1 text-sm text-muted-foreground">{m.pension_select_type_description()}</p>
			<div class="mt-4 space-y-2">
				{#each pensionTypes as pt}
					<button
						onclick={() => { selectedType = pt.type; }}
						class="w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-start gap-3 {selectedType === pt.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'}"
					>
						<pt.icon class="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
						<div>
							<span class="font-medium">{pt.label()}</span>
							<p class="text-sm text-muted-foreground mt-0.5">{pt.description()}</p>
						</div>
					</button>
				{/each}
			</div>
			<div class="mt-4 flex justify-end gap-2">
				{#if members.length > 1}
					<button
						onclick={() => { selectedMemberId = null; selectedType = null; }}
						class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
					>
						{m.pension_cancel()}
					</button>
				{:else}
					<button
						onclick={onCancel}
						class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
					>
						{m.pension_cancel()}
					</button>
				{/if}
				<button
					onclick={handleConfirm}
					disabled={!selectedType}
					class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
				>
					{m.pension_continue()}
				</button>
			</div>
		{/if}
	</div>
</dialog>
