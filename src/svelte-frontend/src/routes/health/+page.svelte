<script lang="ts">
	let status = $state<'loading' | 'healthy' | 'error'>('loading');
	let responseData = $state<Record<string, unknown> | null>(null);
	let errorMessage = $state('');

	async function checkHealth() {
		status = 'loading';
		errorMessage = '';
		try {
			const res = await fetch('http://localhost:8000/health');
			responseData = await res.json();
			status = 'healthy';
		} catch (e) {
			status = 'error';
			errorMessage = e instanceof Error ? e.message : 'Unbekannter Fehler';
			responseData = null;
		}
	}

	$effect(() => {
		checkHealth();
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Backend Health Check</h1>
		<p class="mt-1 text-muted-foreground">Verbindung zum FastAPI-Backend auf Port 8000.</p>
	</div>

	<div class="bg-card rounded-xl border border-border shadow-sm p-6">
		<div class="flex items-center gap-3 mb-4">
			<div
				class="w-3 h-3 rounded-full"
				class:bg-green-500={status === 'healthy'}
				class:bg-destructive={status === 'error'}
				class:bg-muted-foreground={status === 'loading'}
				class:animate-pulse={status === 'loading'}
			></div>
			<span class="font-medium">
				{#if status === 'loading'}
					Prüfe Verbindung...
				{:else if status === 'healthy'}
					Backend erreichbar
				{:else}
					Backend nicht erreichbar
				{/if}
			</span>
		</div>

		{#if responseData}
			<pre
				class="bg-muted rounded-lg p-3 text-sm text-muted-foreground font-mono">{JSON.stringify(responseData, null, 2)}</pre>
		{/if}

		{#if errorMessage}
			<p class="text-sm text-destructive mt-2">{errorMessage}</p>
			<p class="text-sm text-muted-foreground mt-1">
				Stelle sicher, dass das Backend läuft: <code
					class="bg-muted px-1 rounded"
					>cd src/backend && uvicorn app.main:app --reload</code
				>
			</p>
		{/if}

		<button
			onclick={checkHealth}
			class="mt-4 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
		>
			Erneut prüfen
		</button>
	</div>

	<div class="bg-accent/30 border border-accent rounded-xl p-4">
		<h3 class="font-medium">Svelte 5 Features auf dieser Seite</h3>
		<ul class="mt-2 text-sm text-muted-foreground space-y-1">
			<li>
				<strong class="text-foreground">$effect():</strong> Ersetzt
				<code class="bg-accent px-1 rounded">onMount</code> — läuft automatisch beim Mount
			</li>
			<li>
				<strong class="text-foreground">class: Directive:</strong>
				<code class="bg-accent px-1 rounded">class:bg-green-500=&#123;bedingung&#125;</code> für bedingte
				Klassen
			</li>
			<li>
				<strong class="text-foreground">#if/#else:</strong> Template-Logik bleibt wie in Svelte 4
			</li>
			<li>
				<strong class="text-foreground">fetch:</strong> Normales Browser-fetch, kein spezielles Framework
				nötig
			</li>
		</ul>
	</div>
</div>
