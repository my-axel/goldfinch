<!--
@file src/lib/components/ui/Button.svelte
@kind component
@purpose Zentrales Button-Component mit Kraken Design System Varianten.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'outlined' | 'subtle' | 'secondary' | 'destructive' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		class: className = '',
		children,
		onclick,
		...restProps
	}: HTMLButtonAttributes & {
		variant?: Variant;
		size?: Size;
		children: Snippet;
		class?: string;
	} = $props();

	const variantClasses: Record<Variant, string> = {
		primary:
			'bg-primary hover:bg-primary/90 text-primary-foreground',
		outlined:
			'bg-card hover:bg-accent text-primary-dark border border-primary-dark',
		subtle:
			'bg-primary-subtle hover:bg-primary-subtle/80 text-primary',
		secondary:
			'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
		destructive:
			'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
		ghost:
			'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-[13px] text-base',
		lg: 'px-6 py-4 text-base'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]} {className}"
	{...restProps}
>
	{@render children()}
</button>
