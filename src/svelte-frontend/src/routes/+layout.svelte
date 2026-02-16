<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = settingsStore.locale;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
{/key}
