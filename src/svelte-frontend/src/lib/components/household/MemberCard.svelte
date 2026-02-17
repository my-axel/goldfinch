<script lang="ts">
	import { calculateMemberFields, formatMemberName } from '$lib/types/household';
	import type { HouseholdMember } from '$lib/types/household';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Pencil, Trash2 } from '@lucide/svelte';

	let {
		member,
		onEdit,
		onDelete
	}: {
		member: HouseholdMember;
		onEdit: (member: HouseholdMember) => void;
		onDelete: (member: HouseholdMember) => void;
	} = $props();

	let computed = $derived(calculateMemberFields(member));
	let formattedBirthday = $derived(
		new Date(member.birthday).toLocaleDateString(settingsStore.current.number_locale, {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<div class="bg-card rounded-xl border border-border shadow-sm w-[270px]">
	<div class="flex items-center justify-between px-4 pt-4 pb-2">
		<h3 class="font-semibold text-card-foreground">{formatMemberName(member)}</h3>
		<div class="flex gap-1">
			<button
				onclick={() => onEdit(member)}
				class="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
				title={m.household_edit()}
			>
				<Pencil class="w-4 h-4" />
			</button>
			<button
				onclick={() => onDelete(member)}
				class="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent/50"
				title={m.household_delete()}
			>
				<Trash2 class="w-4 h-4" />
			</button>
		</div>
	</div>
	<div class="px-4 pb-4">
		<dl class="space-y-2 text-sm">
			<div>
				<dt class="text-muted-foreground">{m.household_birthday()}</dt>
				<dd>{formattedBirthday}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">{m.household_age()}</dt>
				<dd>{m.household_years({ age: computed.age })}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">{m.household_planned_retirement()}</dt>
				<dd>
					{m.household_in_years_at_age({ years: computed.years_to_retirement_planned, age: member.retirement_age_planned })}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">{m.household_earliest_retirement()}</dt>
				<dd>
					{m.household_in_years_at_age({ years: computed.years_to_retirement_possible, age: member.retirement_age_possible })}
				</dd>
			</div>
		</dl>
	</div>
</div>
