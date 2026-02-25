<!--
@file src/routes/+layout.svelte
@kind route
@purpose Definiert die globale App-Shell mit Sidebar, Dokument-Sprache und gerendertem Seiteninhalt.
-->

<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import ToastViewport from '$lib/components/ui/ToastViewport.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = settingsStore.locale;
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" sizes="144x144" href="/ms-icon-144x144.png" />
	<title>{m.app_title()}</title>
</svelte:head>

{#key settingsStore.locale}
	<div class="flex h-screen overflow-hidden">
		<Sidebar />

			<main class="flex-1 overflow-y-auto">
				<div class="px-8 py-8">
					{@render children()}
				</div>
			</main>
		</div>
		<ToastViewport />
	{/key}
