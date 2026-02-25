<!--
@file src/lib/components/layout/ThemeToggle.svelte
@kind component
@purpose Ermoeglicht den Wechsel zwischen Light, Dark und System-Theme innerhalb der Seitenleiste.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Kernfunktionen `select()`, `themeLabel()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Moon, Sun } from '@lucide/svelte';

	let {
		collapsed = false
	}: {
		collapsed?: boolean;
	} = $props();

	let showMenu = $state(false);

	const themeValues = ['light', 'dark', 'system'] as const;

	function select(value: 'light' | 'dark' | 'system') {
		themeStore.set(value);
		showMenu = false;
	}

	function themeLabel(value: string): string {
		if (value === 'light') return m.theme_light();
		if (value === 'dark') return m.theme_dark();
		return m.theme_system();
	}
</script>

<div class="relative">
	<button
		onclick={() => {
			showMenu = !showMenu;
		}}
		class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
			text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
		title={m.theme_change()}
	>
		{#if themeStore.current === 'dark'}
			<Moon class="w-5 h-5 shrink-0" />
		{:else}
			<Sun class="w-5 h-5 shrink-0" />
		{/if}
		{#if !collapsed}
			<span>Theme</span>
		{/if}
	</button>

	{#if showMenu}
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default"
			aria-label={m.theme_close_menu()}
			onclick={() => { showMenu = false; }}
		></button>

		<div
			class="absolute z-50 rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[120px]"
			class:bottom-full={true}
			class:left-0={!collapsed}
			class:left-full={collapsed}
			class:mb-1={!collapsed}
			class:ml-2={collapsed}
			class:bottom-0={collapsed}
		>
			{#each themeValues as value}
				<button
					onclick={() => select(value)}
					class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors
						{themeStore.current === value ? 'text-primary font-medium' : 'text-popover-foreground'}"
				>
					{themeLabel(value)}
				</button>
			{/each}
		</div>
	{/if}
</div>
