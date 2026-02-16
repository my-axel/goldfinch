<script lang="ts">
	import { calculateMemberFields, formatMemberName } from '$lib/types/household';
	import type { HouseholdMember } from '$lib/types/household';

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
		new Date(member.birthday).toLocaleDateString('de-DE', {
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
				title="Bearbeiten"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
					/>
				</svg>
			</button>
			<button
				onclick={() => onDelete(member)}
				class="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent/50"
				title="Löschen"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
					/>
				</svg>
			</button>
		</div>
	</div>
	<div class="px-4 pb-4">
		<dl class="space-y-2 text-sm">
			<div>
				<dt class="text-muted-foreground">Geburtstag</dt>
				<dd>{formattedBirthday}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Alter</dt>
				<dd>{computed.age} Jahre</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Geplante Rente</dt>
				<dd>
					In {computed.years_to_retirement_planned} Jahren (mit {member.retirement_age_planned})
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Früheste Rente</dt>
				<dd>
					In {computed.years_to_retirement_possible} Jahren (mit {member.retirement_age_possible})
				</dd>
			</div>
		</dl>
	</div>
</div>
