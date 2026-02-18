<script lang="ts">
	import { goto } from '$app/navigation';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { householdApi } from '$lib/api/household';
	import type { HouseholdMember } from '$lib/types/household';
	import { formatMemberName } from '$lib/types/household';
	import { PensionType, PENSION_ROUTE_MAP, type PensionListItem } from '$lib/types/pension';
	import PensionCard from '$lib/components/pension/PensionCard.svelte';
	import PensionTypeSelectionModal from '$lib/components/pension/PensionTypeSelectionModal.svelte';
	import ConfirmDeleteDialog from '$lib/components/ui/ConfirmDeleteDialog.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { CirclePlus } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Data state
	let members = $state<HouseholdMember[]>([]);
	let loading = $state(false);
	let error = $state('');

	// Dialog state — each member can open their own type selection
	let addingForMemberId = $state<number | null>(null);
	let deletingPension = $state<PensionListItem | undefined>(undefined);

	$effect(() => {
		members = data.initialMembers;
		error = data.initialError;
		pensionStore.pensions = data.initialPensions;
	});

	// Group pensions by member
	let pensionsByMember = $derived(() => {
		const grouped = new Map<number, PensionListItem[]>();
		for (const p of pensionStore.pensions) {
			const list = grouped.get(p.member_id) ?? [];
			list.push(p);
			grouped.set(p.member_id, list);
		}
		return grouped;
	});

	// Sort order for pension types in list
	const TYPE_ORDER: Record<PensionType, number> = {
		[PensionType.STATE]: 0,
		[PensionType.COMPANY]: 1,
		[PensionType.INSURANCE]: 2,
		[PensionType.ETF_PLAN]: 3,
		[PensionType.SAVINGS]: 4
	};

	function sortedPensions(pensions: PensionListItem[]): PensionListItem[] {
		return [...pensions].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name));
	}

	async function loadData() {
		loading = true;
		error = '';
		try {
			const [membersData] = await Promise.all([
				householdApi.list(),
				pensionStore.load()
			]);
			members = membersData;
		} catch (e) {
			error = e instanceof Error ? e.message : m.pension_failed_to_load();
		} finally {
			loading = false;
		}
	}

	function handleEdit(pension: PensionListItem) {
		const routeSegment = PENSION_ROUTE_MAP[pension.type];
		goto(`/pension/${routeSegment}/${pension.id}/edit`);
	}

	async function handleDelete() {
		if (!deletingPension) return;
		try {
			await pensionStore.deletePension(deletingPension.type, deletingPension.id);
			deletingPension = undefined;
			toastStore.success(m.pension_deleted());
		} catch {
			toastStore.error(m.pension_delete_failed());
		}
	}

	function handleTypeSelected(type: PensionType, memberId: number) {
		addingForMemberId = null;
		const routeSegment = PENSION_ROUTE_MAP[type];
		goto(`/pension/${routeSegment}/new?member_id=${memberId}`);
	}
</script>

<div class="space-y-6">
	<PageHeader
		title={m.pension_title()}
		description={m.pension_description()}
	/>

	{#if loading}
		<p class="text-center text-muted-foreground py-8">{m.pension_loading()}</p>
	{:else if error}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{error}</p>
			<button onclick={loadData} class="mt-2 text-sm underline">{m.pension_try_again()}</button>
		</div>
	{:else if members.length === 0}
		<p class="text-muted-foreground text-sm">{m.pension_no_members()}</p>
	{:else}
		<div class="space-y-8">
			{#each members as member (member.id)}
				{@const memberPensions = pensionsByMember().get(member.id) ?? []}
				<div class="space-y-4">
					<h2 class="text-lg font-semibold">{formatMemberName(member)}</h2>
					<div class="flex flex-wrap gap-4">
						{#each sortedPensions(memberPensions) as pension (pension.id + '-' + pension.type)}
							<PensionCard
								{pension}
								onEdit={handleEdit}
								onDelete={(p) => { deletingPension = p; }}
							/>
						{/each}

						<!-- Add Pension Card (inline, per member) -->
						<button
							onclick={() => { addingForMemberId = member.id; }}
							class="flex flex-col items-center justify-center w-[270px] min-h-[150px]
								border-2 border-dashed border-border rounded-xl
								hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
						>
							<CirclePlus class="w-6 h-6 text-muted-foreground mb-2" />
							<span class="text-sm text-muted-foreground">{m.pension_add()}</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Type Selection Modal (single member pre-selected) -->
<PensionTypeSelectionModal
	open={addingForMemberId !== null}
	members={addingForMemberId !== null ? members.filter((m) => m.id === addingForMemberId) : []}
	onSelect={handleTypeSelected}
	onCancel={() => { addingForMemberId = null; }}
/>

<!-- Delete Confirmation -->
<ConfirmDeleteDialog
	open={deletingPension !== undefined}
	itemName={deletingPension?.name ?? ''}
	title={m.pension_delete_confirm_title()}
	descriptionBefore={m.pension_delete_confirm_before()}
	descriptionAfter={m.pension_delete_confirm_after()}
	cancelLabel={m.pension_cancel()}
	confirmLabel={m.pension_delete()}
	onConfirm={handleDelete}
	onCancel={() => { deletingPension = undefined; }}
/>
