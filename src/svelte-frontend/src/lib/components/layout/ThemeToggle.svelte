<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';

	let {
		collapsed = false
	}: {
		collapsed?: boolean;
	} = $props();

	let showMenu = $state(false);

	const options: { value: 'light' | 'dark' | 'system'; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	function select(value: 'light' | 'dark' | 'system') {
		themeStore.set(value);
		showMenu = false;
	}
</script>

<div class="relative">
	<button
		onclick={() => {
			showMenu = !showMenu;
		}}
		class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
			text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
		title="Change theme"
	>
		<!-- Sun icon (light) / Moon icon (dark) -->
		{#if themeStore.current === 'dark'}
			<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
			</svg>
		{:else}
			<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
			</svg>
		{/if}
		{#if !collapsed}
			<span>Theme</span>
		{/if}
	</button>

	{#if showMenu}
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label="Close menu"
			onclick={() => { showMenu = false; }}
		></button>

		<!-- Menu -->
		<div
			class="absolute z-50 rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[120px]"
			class:bottom-full={true}
			class:left-0={!collapsed}
			class:left-full={collapsed}
			class:mb-1={!collapsed}
			class:ml-2={collapsed}
			class:bottom-0={collapsed}
		>
			{#each options as option}
				<button
					onclick={() => select(option.value)}
					class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors
						{themeStore.current === option.value ? 'text-primary font-medium' : 'text-popover-foreground'}"
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
