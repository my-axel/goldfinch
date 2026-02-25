<!--
@file src/routes/compass/+page.svelte
@kind route
@purpose Rendert die Route 'compass' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
-->

<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<div class="space-y-6">
	<PageHeader
		title={m.compass_title()}
		description={m.compass_description()}
	/>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		<Card
			title="Gap Analysis"
			description="Calculate and visualize the difference between your needed and current pension"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Enter your current wage for baseline calculations</li>
				<li class="font-bold">View your pension gap with real-time updates</li>
				<li class="text-muted-foreground">Automatic integration with household member data</li>
				<li class="font-bold">Compare with your existing pension plans</li>
			</ul>
		</Card>

		<Card
			title="Smart Recommendations"
			description="Get personalized suggestions to improve your pension health"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold text-red-800/70">Actionable steps to close your pension gap</li>
				<li class="font-bold">Risk level assessment</li>
				<li class="font-bold text-red-800/70">Savings adjustment recommendations</li>
				<li class="text-muted-foreground">Investment strategy suggestions</li>
			</ul>
		</Card>

		<Card
			title="Interactive Planning"
			description="Explore different scenarios and their impact on your retirement"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Adjust retirement age to see immediate impact</li>
				<li class="text-muted-foreground">Toggle between lifestyle scenarios</li>
				<li class="text-muted-foreground">Explore "What if" scenarios</li>
				<li class="font-bold">View projected timeline visualization</li>
			</ul>
		</Card>
	</div>

	<div class="mt-8">
		<p class="text-muted-foreground text-sm">
			{m.compass_coming_soon()}
		</p>
	</div>
</div>
