<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
		size?: 'sm' | 'md' | 'lg';
		color?: 'cyan' | 'magenta' | 'green';
		onInput?: (value: number) => void;
		onChange?: (value: number) => void;
		class?: string;
	}

	let {
		value,
		min = 0,
		max = 100,
		step = 1,
		label = '',
		unit = '',
		size = 'md',
		color = 'cyan',
		onInput,
		onChange,
		class: className = ''
	}: Props = $props();

	let localValue = $state(value);
	let dragging = $state(false);
	let startY = 0;
	let startValue = 0;

	$effect(() => {
		if (!dragging) localValue = value;
	});

	const sizeClasses = {
		sm: 'w-12 h-12',
		md: 'w-16 h-16',
		lg: 'w-20 h-20'
	};

	const colorClasses = {
		cyan: 'from-cyan-400 to-blue-500',
		magenta: 'from-fuchsia-400 to-pink-500',
		green: 'from-emerald-400 to-green-500'
	};

	function normalizeValue(val: number): number {
		return Math.min(max, Math.max(min, val));
	}

	function getRotation(value: number): number {
		const normalized = (value - min) / (max - min);
		return -135 + normalized * 270;
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		startY = e.clientY;
		startValue = localValue;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const deltaY = startY - e.clientY;
		const range = max - min;
		const sensitivity = 0.5;
		const newValue = normalizeValue(startValue + (deltaY / 100) * range * sensitivity);
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

	function getPercentage(): number {
		return ((localValue - min) / (max - min)) * 100;
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
			'relative rounded-full cursor-grab transition-transform duration-100',
			sizeClasses[size],
			dragging ? 'scale-105 cursor-grabbing' : 'hover:scale-105',
			'bg-gradient-to-br from-gray-800 to-gray-900',
			'ring-2 ring-gray-700 hover:ring-gray-600',
			'shadow-lg shadow-black/50'
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
		aria-label={label || 'Knob control'}
		tabindex="0"
	>
		<!-- Outer ring with ticks -->
		<svg class="absolute inset-0 w-full h-full rotate-[-135deg]" viewBox="0 0 100 100">
			<!-- Background track -->
			<circle
				cx="50"
				cy="50"
				r="42"
				fill="none"
				stroke="#1f2937"
				stroke-width="8"
				stroke-linecap="round"
				stroke-dasharray="198"
				stroke-dashoffset="0"
				transform="rotate(135 50 50)"
			/>
			<!-- Value arc -->
			<circle
				cx="50"
				cy="50"
				r="42"
				fill="none"
				stroke="url(#gradient)"
				stroke-width="8"
				stroke-linecap="round"
				stroke-dasharray="198"
				stroke-dashoffset={198 * (1 - getPercentage() / 100)}
				transform="rotate(135 50 50)"
				class="transition-all duration-75"
			/>
			<defs>
				<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" class={color === 'cyan' ? 'stop-cyan-400' : color === 'magenta' ? 'stop-fuchsia-400' : 'stop-emerald-400'} style="stop-color: var(--tw-gradient-from)" />
					<stop offset="100%" class={color === 'cyan' ? 'stop-blue-500' : color === 'magenta' ? 'stop-pink-500' : 'stop-green-500'} style="stop-color: var(--tw-gradient-to)" />
				</linearGradient>
			</defs>
		</svg>

		<!-- Inner knob -->
		<div
			class={cn(
				'absolute inset-2 rounded-full bg-gradient-to-br',
				colorClasses[color],
				'flex items-center justify-center',
				'shadow-inner'
			)}
			style="transform: rotate({getRotation(localValue)}deg)"
		>
			<!-- Indicator line -->
			<div class="absolute top-1 w-1 h-3 bg-white rounded-full shadow-lg"></div>
			
			<!-- Value display -->
			<span class="text-[10px] font-bold text-white drop-shadow-md">
				{localValue.toFixed(step < 1 ? 2 : 0)}{unit}
			</span>
		</div>

		<!-- Glow effect -->
		<div
			class={cn(
				'absolute inset-0 rounded-full opacity-0 transition-opacity duration-200',
				dragging ? 'opacity-30' : 'hover:opacity-20',
				'bg-gradient-to-br',
				colorClasses[color],
				'blur-md'
			)}
			style="z-index: -1"
		></div>
	</div>

	{#if unit && !label}
		<span class="text-[10px] text-gray-500">{unit}</span>
	{/if}
</div>

<style>
	.stop-cyan-400 { --tw-gradient-from: #22d3ee; }
	.stop-blue-500 { --tw-gradient-to: #3b82f6; }
	.stop-fuchsia-400 { --tw-gradient-from: #e879f9; }
	.stop-pink-500 { --tw-gradient-to: #ec4899; }
	.stop-emerald-400 { --tw-gradient-from: #34d399; }
	.stop-green-500 { --tw-gradient-to: #22c55e; }
</style>
