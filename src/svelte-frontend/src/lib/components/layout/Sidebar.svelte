<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import logoIcon from '$lib/assets/logo-icon.svg';
	import logoFull from '$lib/assets/logo-full.svg';
	import { m } from '$lib/paraglide/messages.js';
	import { LayoutDashboard, Users, PiggyBank, Compass, Wallet, Settings, ChevronsLeft } from '@lucide/svelte';

	let collapsed = $state(false);

	const navItems = [
		{ key: 'dashboard' as const, href: '/', icon: LayoutDashboard },
		{ key: 'household' as const, href: '/household', icon: Users },
		{ key: 'pensions' as const, href: '/pension', icon: PiggyBank },
		{ key: 'compass' as const, href: '/compass', icon: Compass },
		{ key: 'payout' as const, href: '/payout-strategy', icon: Wallet }
	];

	const navLabels: Record<string, () => string> = {
		dashboard: m.nav_dashboard,
		household: m.nav_household,
		pensions: m.nav_pensions,
		compass: m.nav_compass,
		payout: m.nav_payout
	};

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0"
	class:w-60={!collapsed}
	class:w-16={collapsed}
>
	<!-- Logo -->
	<div class="flex items-center justify-center h-14 border-b border-sidebar-border px-3">
		<a href="/" class="flex items-center">
			{#if collapsed}
				<img src={logoIcon} alt="Goldfinch" class="h-9 w-9" />
			{:else}
				<img src={logoFull} alt="Goldfinch" class="h-8" />
			{/if}
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
		{#each navItems as item}
			{@const active = isActive(item.href)}
			{@const label = navLabels[item.key]()}
			<a
				href={item.href}
				class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
					{active
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
					: 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}"
				title={collapsed ? label : undefined}
			>
				<item.icon class="w-5 h-5 shrink-0" />
				{#if !collapsed}
					<span>{label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Footer: Settings + Theme + Collapse -->
	<div class="px-3 py-3 border-t border-sidebar-border space-y-1">
		<a
			href="/settings"
			class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
				{isActive('/settings')
				? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
				: 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}"
			title={collapsed ? m.nav_settings() : undefined}
		>
			<Settings class="w-5 h-5 shrink-0" />
			{#if !collapsed}
				<span>{m.nav_settings()}</span>
			{/if}
		</a>

		<ThemeToggle {collapsed} />

		<button
			onclick={() => {
				collapsed = !collapsed;
			}}
			class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
				text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
			title={collapsed ? m.nav_expand_sidebar() : m.nav_collapse_sidebar()}
		>
			<ChevronsLeft
				class="w-5 h-5 shrink-0 transition-transform duration-200 {collapsed ? 'rotate-180' : ''}"
			/>
			{#if !collapsed}
				<span>{m.nav_collapse()}</span>
			{/if}
		</button>
	</div>
</aside>
