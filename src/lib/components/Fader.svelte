<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
		vertical?: boolean;
		color?: 'cyan' | 'magenta' | 'green';
		onInput?: (value: number) => void;
		onChange?: (value: number) => void;
		class?: string;
		showValue?: boolean;
	}

	let {
		value,
		min = 0,
		max = 100,
		step = 1,
		label = '',
		unit = '',
		vertical = true,
		color = 'cyan',
		onInput,
		onChange,
		class: className = '',
		showValue = true
	}: Props = $props();

	let localValue = $state(value);
	let dragging = $state(false);
	let startPos = 0;
	let startValue = 0;

	$effect(() => {
		if (!dragging) localValue = value;
	});

	const colorClasses = {
		cyan: 'from-cyan-400 to-blue-500 bg-cyan-500/20 border-cyan-500/50',
		magenta: 'from-fuchsia-400 to-pink-500 bg-fuchsia-500/20 border-fuchsia-500/50',
		green: 'from-emerald-400 to-green-500 bg-emerald-500/20 border-emerald-500/50'
	};

	const handleColorClasses = {
		cyan: 'bg-cyan-400',
		magenta: 'bg-fuchsia-400',
		green: 'bg-emerald-400'
	};

	function normalizeValue(val: number): number {
		return Math.min(max, Math.max(min, val));
	}

	function getPercentage(): number {
		return ((localValue - min) / (max - min)) * 100;
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		startPos = vertical ? e.clientY : e.clientX;
		startValue = localValue;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const delta = vertical ? startPos - e.clientY : e.clientX - startPos;
		const range = max - min;
		const sensitivity = 0.5;
		const newValue = normalizeValue(startValue + (delta / 100) * range * sensitivity);
		localValue = Math.round(newValue * 100) / 100;
		onInput?.(localValue);
	}

	function handlePointerUp(e: PointerEvent) {
		dragging = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		onChange?.(localValue);
	}

	function handleDoubleClick() {
		localValue = min;
		onChange?.(localValue);
	}
</script>

<div
	class={cn(
		'flex flex-col items-center gap-2 select-none',
		className
	)}
>
	{#if label}
		<span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
	{/if}

	<div
		class={cn(
			'relative bg-gray-900 rounded-lg overflow-hidden',
			'ring-2 ring-gray-700 hover:ring-gray-600',
			'shadow-lg shadow-black/50',
			vertical ? 'w-12 h-48' : 'w-48 h-12'
		)}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		ondblclick={handleDoubleClick}
		role="slider"
		aria-valuenow={localValue}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label={label || 'Fader control'}
		aria-orientation={vertical ? 'vertical' : 'horizontal'}
		tabindex="0"
	>
		<!-- Track background -->
		<div
			class={cn(
				'absolute bg-gray-800',
				vertical ? 'left-1/2 -translate-x-1/2 w-2 h-full' : 'top-1/2 -translate-y-1/2 h-2 w-full'
			)}
		></div>

		<!-- Value indicator -->
		<div
			class={cn(
				'absolute transition-all duration-75',
				vertical
					? `bottom-0 left-0 right-0 bg-gradient-to-t ${colorClasses[color].split(' ').slice(0, 3).join(' ')}`
					: `left-0 top-0 bottom-0 bg-gradient-to-r ${colorClasses[color].split(' ').slice(0, 3).join(' ')}`
			)}
			style={vertical ? `height: ${getPercentage()}%` : `width: ${getPercentage()}%`}
		></div>

		<!-- Handle -->
		<div
			class={cn(
				'absolute w-8 h-4 bg-gradient-to-br from-gray-700 to-gray-800',
				'rounded shadow-lg cursor-ew-resize',
				'border border-gray-600 hover:border-gray-500',
				'transition-transform duration-75',
				dragging ? 'scale-110' : 'hover:scale-105',
				vertical
					? `left-1/2 -translate-x-1/2 -translate-y-1/2`
					: `top-1/2 -translate-y-1/2 -translate-x-1/2`
			)}
			style={
				vertical
					? `bottom: calc(${getPercentage()}% - 8px)`
					: `left: calc(${getPercentage()}% - 8px)`
			}
		>
			<!-- Handle indicator line -->
			<div
				class={cn(
					'absolute w-6 h-0.5 rounded-full',
					handleColorClasses[color],
					vertical ? 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 rotate-90'
				)}
			></div>
		</div>

		<!-- Tick marks -->
		{#if vertical}
			<div class="absolute left-0 top-0 bottom-0 w-full pointer-events-none">
				{#each [0, 25, 50, 75, 100] as tick}
					<div
						class="absolute w-4 h-px bg-gray-600 left-1/2 -translate-x-1/2"
						style="bottom: {tick}%"
					></div>
				{/each}
			</div>
		{:else}
			<div class="absolute left-0 top-0 w-full h-full pointer-events-none">
				{#each [0, 25, 50, 75, 100] as tick}
					<div
						class="absolute h-4 w-px bg-gray-600 top-1/2 -translate-y-1/2"
						style="left: {tick}%"
					></div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showValue}
		<span class="text-xs font-mono text-gray-300">
			{localValue.toFixed(step < 1 ? 2 : 0)}{unit}
		</span>
	{/if}
</div>
