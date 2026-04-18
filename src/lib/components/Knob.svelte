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

	$effect(() => {
		localValue = value;
	});

	let dragging = $state(false);
	let startY = 0;
	let startValue = 0;

	const sizeMap = { sm: 32, md: 40, lg: 48 };
	const sizePx = $derived(sizeMap[size]);

	const colorValues = {
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	const colors = $derived(colorValues[color]);

	function normalizeValue(val: number): number {
		return Math.min(max, Math.max(min, val));
	}

	function getRotation(value: number): number {
		const normalized = (value - min) / (max - min);
		return -135 + normalized * 270;
	}

	function getPercentage(): number {
		return ((localValue - min) / (max - min)) * 100;
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
		onInput?.(localValue);
		onChange?.(localValue);
	}

	const tickAngles = Array.from({ length: 11 }, (_, i) => -135 + i * 27);
</script>

<div
	class={cn(
		'flex flex-col items-center gap-1.5 select-none',
		className
	)}
>
	{#if label}
		<span class="text-[10px] font-medium text-[var(--ns-text-secondary)] uppercase tracking-wider">{label}</span>
	{/if}

	<div
		class="relative rounded-full cursor-grab transition-transform duration-100"
		style="width: {sizePx}px; height: {sizePx}px;"
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
		<div
			class="absolute inset-0 rounded-full transition-opacity duration-200"
			style="opacity: {dragging ? 0.4 : 0.15}; background: radial-gradient(circle, {colors.glow} 0%, transparent 70%); filter: blur(6px); z-index: -1;"
		></div>

		<svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style="overflow: visible;">
			<circle cx="50" cy="50" r="47" fill="none" stroke="url(#knob-chrome-{color})" stroke-width="1.25" opacity="0.7" />

			{#each Array.from({ length: 13 }, (_, i) => -150 + i * 27.5) as tAngle, i}
				{@const tickPct = i / 12}
				{@const on = tickPct <= getPercentage() / 100}
				<rect
					x="49.1" y="1.5" width="1.8" height="5"
					fill={on ? colors.primary : 'rgba(255,255,255,0.12)'}
					transform="rotate({tAngle} 50 50)"
					style="filter: {on ? `drop-shadow(0 0 2px ${colors.glow})` : 'none'};"
				/>
			{/each}

			<circle
				cx="50" cy="50" r="38" fill="none"
				stroke="#12131d" stroke-width="6" stroke-linecap="round"
				stroke-dasharray="198" stroke-dashoffset="0"
				transform="rotate(135 50 50)"
			/>
			<circle
				cx="50" cy="50" r="38" fill="none"
				stroke="url(#knob-gradient-{color})" stroke-width="6" stroke-linecap="round"
				stroke-dasharray="198"
				stroke-dashoffset={198 * (1 - getPercentage() / 100)}
				transform="rotate(135 50 50)"
				class="transition-all duration-75"
				style="filter: drop-shadow(0 0 6px {colors.glow});"
			/>

			<defs>
				<linearGradient id="knob-gradient-{color}" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color={colors.primary} />
					<stop offset="100%" stop-color={colors.secondary} />
				</linearGradient>
				<linearGradient id="knob-chrome-{color}" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#3a3a4a" />
					<stop offset="50%" stop-color="#1a1a2e" />
					<stop offset="100%" stop-color="#3a3a4a" />
				</linearGradient>
			</defs>
		</svg>

		<div
			class="absolute rounded-full flex items-center justify-center"
			style="
				inset: 8px;
				background: radial-gradient(ellipse at 35% 30%, #3a3a4a 0%, #1a1a2e 60%, #0d0d15 100%);
				box-shadow: inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.4);
				transform: rotate({getRotation(localValue)}deg);
			"
		>
			<div
				class="absolute rounded-full"
				style="
					top: 2px;
					left: 50%;
					transform: translateX(-50%);
					width: 2px;
					height: {sizePx < 40 ? 4 : 6}px;
					background: white;
					box-shadow: 0 0 4px rgba(255,255,255,0.6);
				"
			></div>

			<span
				class="font-bold text-white absolute"
				style="
					font-size: {sizePx < 40 ? 8 : 10}px;
					transform: rotate(-{getRotation(localValue)}deg);
					font-variant-numeric: tabular-nums;
				"
			>
				{localValue.toFixed(step < 1 ? (step < 0.01 ? 3 : 2) : 0)}
			</span>
		</div>
	</div>

	{#if unit}
		<span class="text-[8px] text-[var(--ns-text-dim)] uppercase">{unit}</span>
	{/if}
</div>
