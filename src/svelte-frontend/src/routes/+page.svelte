<script lang="ts">
	let count = $state(0);
	let name = $state('');

	let greeting = $derived(name ? `Hallo, ${name}!` : 'Gib deinen Namen ein...');
	let doubled = $derived(count * 2);
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Goldfinch — Svelte 5 Demo</h1>
		<p class="mt-2 text-muted-foreground">
			SvelteKit mit Svelte 5 Runes, TypeScript und Tailwind CSS v4.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="bg-card rounded-xl border border-border shadow-sm p-6">
			<h2 class="text-lg font-semibold mb-4">$state() + $derived()</h2>
			<div class="space-y-4">
				<div>
					<label for="name-input" class="block text-sm font-medium text-foreground/80 mb-1"
						>Name</label
					>
					<input
						id="name-input"
						type="text"
						bind:value={name}
						placeholder="Dein Name..."
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
					/>
				</div>
				<p class="text-muted-foreground">{greeting}</p>
			</div>
		</div>

		<div class="bg-card rounded-xl border border-border shadow-sm p-6">
			<h2 class="text-lg font-semibold mb-4">Reaktiver Counter</h2>
			<div class="space-y-4">
				<p class="text-4xl font-bold text-primary">{count}</p>
				<p class="text-sm text-muted-foreground">Verdoppelt: {doubled}</p>
				<div class="flex gap-2">
					<button
						onclick={() => count--}
						class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
					>
						-1
					</button>
					<button
						onclick={() => count++}
						class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
					>
						+1
					</button>
					<button
						onclick={() => (count = 0)}
						class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-accent/30 border border-accent rounded-xl p-4">
		<h3 class="font-medium">Was hier läuft</h3>
		<ul class="mt-2 text-sm text-muted-foreground space-y-1">
			<li>
				<strong class="text-foreground">Svelte 5 Runes:</strong>
				<code class="bg-accent px-1 rounded">$state()</code> und
				<code class="bg-accent px-1 rounded">$derived()</code> statt altem
				<code class="bg-accent px-1 rounded">let</code>/<code class="bg-accent px-1 rounded"
					>$:</code
				>
			</li>
			<li>
				<strong class="text-foreground">Event-Handler:</strong>
				<code class="bg-accent px-1 rounded">onclick</code> statt
				<code class="bg-accent px-1 rounded">on:click</code>
			</li>
			<li>
				<strong class="text-foreground">Props:</strong>
				<code class="bg-accent px-1 rounded">$props()</code> im Layout statt
				<code class="bg-accent px-1 rounded">export let</code>
			</li>
			<li>
				<strong class="text-foreground">Snippets:</strong>
				<code class="bg-accent px-1 rounded">&#123;@render children()&#125;</code> statt
				<code class="bg-accent px-1 rounded">&lt;slot /&gt;</code>
			</li>
			<li>
				<strong class="text-foreground">Tailwind CSS v4:</strong> Kein Config nötig, nur
				<code class="bg-accent px-1 rounded">@import 'tailwindcss'</code>
			</li>
		</ul>
	</div>
</div>
