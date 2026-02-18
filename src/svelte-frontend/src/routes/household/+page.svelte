<script lang="ts">
	import { householdApi } from '$lib/api/household';
	import type { HouseholdMember, HouseholdMemberFormData } from '$lib/types/household';
	import { formatMemberName } from '$lib/types/household';
	import MemberCard from '$lib/components/household/MemberCard.svelte';
	import MemberModal from '$lib/components/household/MemberModal.svelte';
	import ConfirmDeleteDialog from '$lib/components/ui/ConfirmDeleteDialog.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { CirclePlus } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State
	let members = $state<HouseholdMember[]>([]);
	let loading = $state(false);
	let error = $state('');

	// Dialog state
	let showAddModal = $state(false);
	let editingMember = $state<HouseholdMember | undefined>(undefined);
	let deletingMember = $state<HouseholdMember | undefined>(undefined);

	$effect(() => {
		members = data.initialMembers;
		error = data.initialError;
	});

	// Load members
	async function loadMembers() {
		loading = true;
		error = '';
		try {
			members = await householdApi.list();
		} catch (e) {
			error = e instanceof Error ? e.message : m.household_failed_to_load();
		} finally {
			loading = false;
		}
	}

	// CRUD handlers
	async function handleAdd(data: HouseholdMemberFormData) {
		try {
			await householdApi.create(data);
			showAddModal = false;
			toastStore.success(m.household_member_added());
			await loadMembers();
		} catch {
			toastStore.error(m.household_add_failed());
		}
	}

	async function handleEdit(data: HouseholdMemberFormData) {
		if (!editingMember) return;
		try {
			await householdApi.update(editingMember.id, data);
			editingMember = undefined;
			toastStore.success(m.household_member_updated());
			await loadMembers();
		} catch {
			toastStore.error(m.household_update_failed());
		}
	}

	async function handleDelete() {
		if (!deletingMember) return;
		try {
			await householdApi.delete(deletingMember.id);
			deletingMember = undefined;
			toastStore.success(m.household_member_deleted());
			await loadMembers();
		} catch {
			toastStore.error(m.household_delete_failed());
		}
	}
</script>

<div class="space-y-6">
	<PageHeader
		title={m.household_title()}
		description={m.household_description()}
	/>

	<!-- Content -->
	{#if loading}
		<p class="text-center text-muted-foreground py-8">{m.household_loading()}</p>
	{:else if error}
		<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
			<p>{error}</p>
			<button onclick={loadMembers} class="mt-2 text-sm underline">{m.household_try_again()}</button>
		</div>
	{:else}
		<div class="flex flex-wrap gap-4">
			{#each members as member (member.id)}
				<MemberCard
					{member}
					onEdit={(m) => {
						editingMember = m;
					}}
					onDelete={(m) => {
						deletingMember = m;
					}}
				/>
			{/each}

			<!-- Add Member Button -->
			<button
				onclick={() => {
					showAddModal = true;
				}}
				class="flex flex-col items-center justify-center w-[270px] min-h-[200px]
					border-2 border-dashed border-border rounded-xl
					hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer"
			>
				<CirclePlus class="w-8 h-8 text-muted-foreground mb-2" />
				<span class="text-sm text-muted-foreground">{m.household_new_member()}</span>
			</button>
		</div>
	{/if}
</div>

<!-- Add Modal -->
<MemberModal
	open={showAddModal}
	onSubmit={handleAdd}
	onClose={() => {
		showAddModal = false;
	}}
/>

<!-- Edit Modal -->
<MemberModal
	open={editingMember !== undefined}
	member={editingMember}
	onSubmit={handleEdit}
	onClose={() => {
		editingMember = undefined;
	}}
/>

<!-- Delete Confirmation -->
<ConfirmDeleteDialog
	open={deletingMember !== undefined}
	itemName={deletingMember ? formatMemberName(deletingMember) : ''}
	title={m.household_delete_member()}
	descriptionBefore={m.household_delete_confirm_before()}
	descriptionAfter={m.household_delete_confirm_after()}
	cancelLabel={m.household_cancel()}
	confirmLabel={m.household_delete()}
	onConfirm={handleDelete}
	onCancel={() => {
		deletingMember = undefined;
	}}
/>
