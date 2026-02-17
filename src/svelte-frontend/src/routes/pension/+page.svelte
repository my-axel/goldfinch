<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { householdApi } from '$lib/api/household';
	import type { HouseholdMember } from '$lib/types/household';
	import { formatMemberName } from '$lib/types/household';
	import { PensionType, PENSION_ROUTE_MAP, type PensionListItem } from '$lib/types/pension';
	import PensionCard from '$lib/components/pension/PensionCard.svelte';
	import PensionTypeSelectionModal from '$lib/components/pension/PensionTypeSelectionModal.svelte';
	import DeletePensionConfirm from '$lib/components/pension/DeletePensionConfirm.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { CirclePlus } from '@lucide/svelte';

	// Data state
	let members = $state<HouseholdMember[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Dialog state — each member can open their own type selection
	let addingForMemberId = $state<number | null>(null);
	let deletingPension = $state<PensionListItem | undefined>(undefined);

	// Toast
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	function showToast(message: string, type: 'success' | 'error') {
		toast = { message, type };
		setTimeout(() => { toast = null; }, 3000);
	}

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

	onMount(() => { loadData(); });

	function handleEdit(pension: PensionListItem) {
		const routeSegment = PENSION_ROUTE_MAP[pension.type];
		goto(`/pension/${routeSegment}/${pension.id}/edit`);
	}

	async function handleDelete() {
		if (!deletingPension) return;
		try {
			await pensionStore.deletePension(deletingPension.type, deletingPension.id);
			deletingPension = undefined;
			showToast(m.pension_deleted(), 'success');
		} catch {
			showToast(m.pension_delete_failed(), 'error');
		}
	}

	function handleTypeSelected(type: PensionType, memberId: number) {
		addingForMemberId = null;
		const routeSegment = PENSION_ROUTE_MAP[type];
		goto(`/pension/${routeSegment}/new?member_id=${memberId}`);
	}
</script>

<!-- Toast -->
{#if toast}
	<div
		class="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border {toast.type === 'success'
			? 'bg-card text-foreground border-primary/30'
			: 'bg-card text-destructive border-destructive/30'}"
	>
		{toast.message}
	</div>
{/if}

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
<DeletePensionConfirm
	open={deletingPension !== undefined}
	pensionName={deletingPension?.name ?? ''}
	onConfirm={handleDelete}
	onCancel={() => { deletingPension = undefined; }}
/>
