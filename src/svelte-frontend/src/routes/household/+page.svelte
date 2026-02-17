<script lang="ts">
	import { onMount } from 'svelte';
	import { householdApi } from '$lib/api/household';
	import type { HouseholdMember, HouseholdMemberFormData } from '$lib/types/household';
	import { formatMemberName } from '$lib/types/household';
	import MemberCard from '$lib/components/household/MemberCard.svelte';
	import MemberModal from '$lib/components/household/MemberModal.svelte';
	import DeleteConfirm from '$lib/components/household/DeleteConfirm.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { CirclePlus } from '@lucide/svelte';

	// State
	let members = $state<HouseholdMember[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Dialog state
	let showAddModal = $state(false);
	let editingMember = $state<HouseholdMember | undefined>(undefined);
	let deletingMember = $state<HouseholdMember | undefined>(undefined);

	// Toast
	let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	function showToast(message: string, type: 'success' | 'error') {
		toast = { message, type };
		setTimeout(() => {
			toast = null;
		}, 3000);
	}

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

	// Load on mount
	onMount(() => {
		loadMembers();
	});

	// CRUD handlers
	async function handleAdd(data: HouseholdMemberFormData) {
		try {
			await householdApi.create(data);
			showAddModal = false;
			showToast(m.household_member_added(), 'success');
			await loadMembers();
		} catch {
			showToast(m.household_add_failed(), 'error');
		}
	}

	async function handleEdit(data: HouseholdMemberFormData) {
		if (!editingMember) return;
		try {
			await householdApi.update(editingMember.id, data);
			editingMember = undefined;
			showToast(m.household_member_updated(), 'success');
			await loadMembers();
		} catch {
			showToast(m.household_update_failed(), 'error');
		}
	}

	async function handleDelete() {
		if (!deletingMember) return;
		try {
			await householdApi.delete(deletingMember.id);
			deletingMember = undefined;
			showToast(m.household_member_deleted(), 'success');
			await loadMembers();
		} catch {
			showToast(m.household_delete_failed(), 'error');
		}
	}
</script>

<!-- Toast -->
{#if toast}
	<div
		class="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border {toast.type ===
		'success'
			? 'bg-card text-foreground border-primary/30'
			: 'bg-card text-destructive border-destructive/30'}"
	>
		{toast.message}
	</div>
{/if}

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
<DeleteConfirm
	open={deletingMember !== undefined}
	memberName={deletingMember ? formatMemberName(deletingMember) : ''}
	onConfirm={handleDelete}
	onCancel={() => {
		deletingMember = undefined;
	}}
/>
