<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { CirclePause, CirclePlay } from '@lucide/svelte';
	import { todayIsoDate } from '$lib/utils/date-only';

	let {
		status,
		onPause,
		onResume
	}: {
		status: 'ACTIVE' | 'PAUSED';
		onPause: (pauseDate: string) => Promise<void>;
		onResume: (resumeDate: string) => Promise<void>;
	} = $props();

	let showPauseDialog = $state(false);
	let showResumeDialog = $state(false);
	let pauseDate = $state(todayIsoDate());
	let resumeDate = $state(todayIsoDate());
	let submitting = $state(false);

	let pauseDialogEl: HTMLDialogElement;
	let resumeDialogEl: HTMLDialogElement;

	$effect(() => {
		if (!pauseDialogEl) return;
		if (showPauseDialog && !pauseDialogEl.open) pauseDialogEl.showModal();
		else if (!showPauseDialog && pauseDialogEl.open) pauseDialogEl.close();
	});

	$effect(() => {
		if (!resumeDialogEl) return;
		if (showResumeDialog && !resumeDialogEl.open) resumeDialogEl.showModal();
		else if (!showResumeDialog && resumeDialogEl.open) resumeDialogEl.close();
	});

	async function handlePauseConfirm() {
		submitting = true;
		try {
			await onPause(pauseDate);
		} finally {
			submitting = false;
			showPauseDialog = false;
		}
	}

	async function handleResumeConfirm() {
		submitting = true;
		try {
			await onResume(resumeDate);
		} finally {
			submitting = false;
			showResumeDialog = false;
		}
	}
</script>

<div class="flex items-center gap-3">
	<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}">
		{status === 'ACTIVE' ? m.pension_status_active() : m.pension_status_paused()}
	</span>

	<button
		type="button"
		onclick={() => { if (status === 'ACTIVE') showPauseDialog = true; else showResumeDialog = true; }}
		class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-accent/50 transition-colors"
	>
		{#if status === 'ACTIVE'}
			<CirclePause class="h-4 w-4" />
			{m.pension_pause()}
		{:else}
			<CirclePlay class="h-4 w-4" />
			{m.pension_resume()}
		{/if}
	</button>
</div>

<!-- Pause Dialog -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={pauseDialogEl}
	onclick={(e) => { if (e.target === pauseDialogEl) showPauseDialog = false; }}
	onclose={() => showPauseDialog = false}
	class="rounded-xl p-0 max-w-sm shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold">{m.pension_pause_title()}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{m.pension_pause_description()}</p>
		<div class="mt-4">
			<label class="block text-sm font-medium mb-1">
				{m.pension_pause_date()}
				<input
					type="date"
					bind:value={pauseDate}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
				/>
			</label>
		</div>
		<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => showPauseDialog = false}
					disabled={submitting}
					class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.cancel()}
			</button>
				<button
					type="button"
					onclick={handlePauseConfirm}
					disabled={submitting}
					class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.confirm()}
			</button>
		</div>
	</div>
</dialog>

<!-- Resume Dialog -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={resumeDialogEl}
	onclick={(e) => { if (e.target === resumeDialogEl) showResumeDialog = false; }}
	onclose={() => showResumeDialog = false}
	class="rounded-xl p-0 max-w-sm shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold">{m.pension_resume_title()}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{m.pension_resume_description()}</p>
		<div class="mt-4">
			<label class="block text-sm font-medium mb-1">
				{m.pension_resume_date()}
				<input
					type="date"
					bind:value={resumeDate}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
				/>
			</label>
		</div>
		<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => showResumeDialog = false}
					disabled={submitting}
					class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.cancel()}
			</button>
				<button
					type="button"
					onclick={handleResumeConfirm}
					disabled={submitting}
					class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.confirm()}
			</button>
		</div>
	</div>
</dialog>
