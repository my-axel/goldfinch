<!--
@file src/lib/components/settings/RateStepperInput.svelte
@kind component
@purpose Drop-in replacement for RateInput with stepper buttons. Bridges the callback API (value as %, onChange) with PercentStepperInput (value as decimal).
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import PercentStepperInput from '$lib/components/ui/PercentStepperInput.svelte';

	let {
		value,
		onChange,
		disabled = false
	}: {
		value: number;
		onChange: (value: number) => void;
		disabled?: boolean;
	} = $props();

	// PercentStepperInput stores value as decimal (0.02 = 2%), settings store as percentage (2.0 = 2%)
	let localValue = $state(value / 100);

	// Sync inward: when parent value changes externally
	$effect(() => {
		const decimalFromParent = value / 100;
		if (Math.abs(decimalFromParent - untrack(() => localValue)) > 0.000001) {
			localValue = decimalFromParent;
		}
	});

	// Sync outward: when user changes the stepper
	$effect(() => {
		const percentValue = Math.round(localValue * 100 * 10) / 10;
		if (Math.abs(percentValue - untrack(() => value)) > 0.0001) {
			onChange(percentValue);
		}
	});
</script>

<PercentStepperInput bind:value={localValue} step={0.1} min={0} max={0.15} decimals={1} {disabled} />
