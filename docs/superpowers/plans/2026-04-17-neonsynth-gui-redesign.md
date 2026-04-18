# NeonSynth GUI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually overhaul the NeonSynth UI from a basic 3-column layout to a premium futuristic cyberpunk design with a dominant central bilateral waveform visualizer, compact glowing knobs, recessed faders with level metering, frosted panels, and a cohesive neon color system — all using CSS + Canvas, no new dependencies.

**Architecture:** Visual redesign only — all existing audio functionality preserved. Layout restructures from 3-column sidebar to visualizer-top/controls-below. Each component (Knob, Fader, Visualizer, PresetButton) gets a full visual rebuild. CSS custom properties in `app.css` provide the color system. The Visualizer gains a new `bilateral` mode with afterimage trails, dot-grid background, and integrated spectrum strip.

**Tech Stack:** Svelte 5, TypeScript, CSS (custom properties, gradients, shadows, backdrop-blur), Canvas 2D API (visualizer rendering). No new dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app.css` | Modify | CSS custom properties (color system), Inter font import, global glow utilities, scrollbar styling |
| `src/lib/components/Knob.svelte` | Rewrite | Compact sizes (32/40/48px), 3D bevel, glow ring, tick marks, improved value display |
| `src/lib/components/Fader.svelte` | Rewrite | Recessed track, level meter bar, 3D handle, glow fill boundary |
| `src/lib/components/Visualizer.svelte` | Rewrite | Bilateral waveform mode, afterimage trails, dot-grid, mini spectrum strip, idle animation |
| `src/lib/components/PresetButton.svelte` | Rewrite | Pill shape, glow states, press animation, dot indicator for active |
| `src/App.svelte` | Rewrite template | Visualizer-top layout, compact header, control grid, export bar |

---

### Task 1: CSS Foundation — Color System & Global Styles

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Replace `src/app.css` with the full CSS foundation**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  color-scheme: dark;

  /* Color system */
  --ns-bg-deep: #08080c;
  --ns-bg-panel: #0d0d12;
  --ns-bg-surface: #16161e;
  --ns-border: rgba(255, 255, 255, 0.06);
  --ns-border-bright: rgba(255, 255, 255, 0.1);
  --ns-accent-primary: #22d3ee;
  --ns-accent-secondary: #e879f9;
  --ns-accent-tertiary: #34d399;
  --ns-accent-warning: #f97316;
  --ns-text-primary: #f0f0f5;
  --ns-text-secondary: #9ca3af;
  --ns-text-dim: #4b5563;

  /* Glow colors (with alpha for shadow usage) */
  --ns-glow-primary: rgba(34, 211, 238, 0.5);
  --ns-glow-secondary: rgba(232, 121, 249, 0.5);
  --ns-glow-tertiary: rgba(52, 211, 153, 0.5);
  --ns-glow-warning: rgba(249, 115, 22, 0.5);
}

body {
  margin: 0;
  background: var(--ns-bg-deep);
  color: var(--ns-text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100svh;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--ns-bg-deep);
}
::-webkit-scrollbar-thumb {
  background: var(--ns-bg-surface);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--ns-text-dim);
}

/* Panel base styles */
.ns-panel {
  background: rgba(13, 13, 18, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--ns-border);
  border-top-color: var(--ns-border-bright);
  border-left-color: var(--ns-border-bright);
  border-radius: 12px;
  padding: 20px;
  position: relative;
}

.ns-panel-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ns-text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ns-border);
  position: relative;
}

.ns-panel-corner {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ns-text-dim);
}

/* Range input styling */
:global(input[type="range"]) {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

:global(input[type="range"]::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6);
  cursor: pointer;
  box-shadow: 0 0 8px var(--ns-glow-primary);
}

:global(input[type="range"]::-moz-range-thumb) {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px var(--ns-glow-primary);
}

:global(input[type="range"]::-webkit-slider-runnable-track) {
  height: 4px;
  background: var(--ns-bg-surface);
  border-radius: 2px;
}

:global(input[type="range"]::-moz-range-track) {
  height: 4px;
  background: var(--ns-bg-surface);
  border-radius: 2px;
}

/* Select styling */
:global(select) {
  background: var(--ns-bg-surface);
  border: 1px solid var(--ns-border);
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--ns-text-primary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
}

:global(select:focus) {
  border-color: var(--ns-accent-primary);
  box-shadow: 0 0 8px var(--ns-glow-primary);
}
```

- [ ] **Step 2: Verify the CSS loads without errors**

Run: `npm run dev -- --host 2>&1 | head -20`
Expected: Vite dev server starts, no CSS compilation errors

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "feat: add CSS foundation with color system, Inter font, global utilities"
```

---

### Task 2: Knob Component Redesign

**Files:**
- Rewrite: `src/lib/components/Knob.svelte`

- [ ] **Step 1: Replace `src/lib/components/Knob.svelte` with the compact premium knob**

```svelte
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
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)', glowStrong: 'rgba(34, 211, 238, 0.7)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)', glowStrong: 'rgba(232, 121, 249, 0.7)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)', glowStrong: 'rgba(52, 211, 153, 0.7)' }
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

	// Tick mark positions (11 dots around the arc from -135 to +135 degrees)
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
		<!-- Outer glow -->
		<div
			class="absolute inset-0 rounded-full transition-opacity duration-200"
			style="opacity: {dragging ? 0.4 : 0.15}; background: radial-gradient(circle, {colors.glow} 0%, transparent 70%); filter: blur(6px); z-index: -1;"
		></div>

		<!-- SVG ring with ticks + arcs -->
		<svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style="overflow: visible;">
			<!-- Tick marks -->
			{#each tickAngles as angle, i}
				{@const tickPercent = i / 10}
				{@const isActive = tickPercent <= getPercentage() / 100}
				<circle
					cx="50"
					cy="50"
					r="47"
					fill="none"
					stroke={isActive ? colors.primary : 'rgba(255,255,255,0.08)'}
					stroke-width="1.5"
					stroke-dasharray="2 28.7"
					stroke-dashoffset="0"
					transform="rotate({angle} 50 50)"
					style="filter: {isActive ? `drop-shadow(0 0 3px ${colors.glow})` : 'none'};"
				/>
			{/each}

			<!-- Background track -->
			<circle
				cx="50"
				cy="50"
				r="38"
				fill="none"
				stroke="#1a1a2e"
				stroke-width="6"
				stroke-linecap="round"
				stroke-dasharray="198"
				stroke-dashoffset="0"
				transform="rotate(135 50 50)"
			/>

			<!-- Value arc -->
			<circle
				cx="50"
				cy="50"
				r="38"
				fill="none"
				stroke="url(#knob-gradient-{canvasId ?? color})"
				stroke-width="6"
				stroke-linecap="round"
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
			</defs>
		</svg>

		<!-- Inner knob body (3D bevel) -->
		<div
			class="absolute rounded-full flex items-center justify-center"
			style="
				inset: 8px;
				background: radial-gradient(ellipse at 35% 30%, #3a3a4a 0%, #1a1a2e 60%, #0d0d15 100%);
				box-shadow: inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.4);
				transform: rotate({getRotation(localValue)}deg);
			"
		>
			<!-- Indicator line -->
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

			<!-- Value readout -->
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
```

- [ ] **Step 2: Verify knob renders and interacts**

Run: `npm run dev`
Expected: Dev server starts, no TypeScript or Svelte compilation errors. Knob renders at compact sizes, drag interaction works.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Knob.svelte
git commit -m "feat: redesign Knob component — compact sizes, 3D bevel, glow ring, tick marks"
```

---

### Task 3: Fader Component Redesign

**Files:**
- Rewrite: `src/lib/components/Fader.svelte`

- [ ] **Step 1: Replace `src/lib/components/Fader.svelte` with recessed track + level meter fader**

```svelte
<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { levelLeft, levelRight } from '$lib/stores/audioStore';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
		color?: 'cyan' | 'magenta' | 'green';
		channel?: 'left' | 'right';
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
		color = 'cyan',
		channel,
		onInput,
		onChange,
		class: className = '',
		showValue = true
	}: Props = $props();

	let localValue = $state(value);

	$effect(() => {
		localValue = value;
	});

	let dragging = $state(false);
	let startPos = 0;
	let startValue = 0;

	const colorValues = {
		cyan: { primary: '#22d3ee', dark: '#0e7490', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', dark: '#a21caf', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', dark: '#059669', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	const colors = $derived(colorValues[color]);

	// Level for this channel
	const level = $derived(channel === 'left' ? $levelLeft : channel === 'right' ? $levelRight : 0);
	const levelPct = $derived(Math.min(100, level * 100 * 3)); // amplified for visibility

	function normalizeValue(val: number): number {
		return Math.min(max, Math.max(min, val));
	}

	function getPercentage(): number {
		return ((localValue - min) / (max - min)) * 100;
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		startPos = e.clientY;
		startValue = localValue;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const deltaY = startPos - e.clientY;
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
</script>

<div
	class={cn(
		'flex flex-col items-center gap-2 select-none',
		className
	)}
>
	{#if label}
		<span class="text-[10px] font-medium text-[var(--ns-text-secondary)] uppercase tracking-wider">{label}</span>
	{/if}

	<div class="flex items-end gap-1">
		<!-- Level meter (thin bar on left side) -->
		<div
			class="w-1.5 h-40 rounded-full overflow-hidden relative"
			style="background: var(--ns-bg-surface); box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);"
		>
			<div
				class="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75"
				style="height: {levelPct}%; background: linear-gradient(to top, {colors.dark}, {colors.primary}, #fbbf24, #ef4444); box-shadow: 0 0 4px {colors.glow};"
			></div>
		</div>

		<!-- Fader track -->
		<div
			class="relative w-10 h-40 rounded-lg overflow-hidden cursor-grab"
			style="background: var(--ns-bg-surface); box-shadow: inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.03);"
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
			aria-orientation="vertical"
			tabindex="0"
		>
			<!-- Fill gradient -->
			<div
				class="absolute bottom-0 left-0 right-0 transition-all duration-75"
				style="height: {getPercentage()}%; background: linear-gradient(to top, {colors.dark}, {colors.primary}); box-shadow: 0 -2px 8px {colors.glow};"
			></div>

			<!-- Fill boundary glow line -->
			<div
				class="absolute left-0 right-0 h-px transition-all duration-75"
				style="bottom: {getPercentage()}%; background: {colors.primary}; box-shadow: 0 0 6px {colors.glow}, 0 0 12px {colors.glow};"
			></div>

			<!-- Tick marks -->
			{#each [0, 25, 50, 75, 100] as tick}
				<div
					class="absolute left-1 right-1 h-px"
					style="bottom: {tick}%; background: rgba(255,255,255,0.08);"
				></div>
			{/each}

			<!-- Handle -->
			<div
				class="absolute left-0.5 right-0.5 h-5 rounded transition-transform duration-75"
				style="
					bottom: calc({getPercentage()}% - 10px);
					background: linear-gradient(180deg, #4a4a5a 0%, #2a2a3a 40%, #1a1a2e 100%);
					box-shadow: 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08);
					transform: scale({dragging ? 1.08 : 1});
				"
			>
				<!-- Handle illuminated center line -->
				<div
					class="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-0.5 rounded-full"
					style="background: {colors.primary}; box-shadow: 0 0 4px {colors.glow};"
				></div>
			</div>
		</div>
	</div>

	{#if showValue}
		<span class="text-[10px] font-bold text-[var(--ns-text-primary)]" style="font-variant-numeric: tabular-nums;">
			{localValue.toFixed(step < 1 ? 2 : 0)}{unit}
		</span>
	{/if}
</div>
```

- [ ] **Step 2: Verify fader renders and interacts**

Run: `npm run dev`
Expected: Dev server starts. Fader shows recessed track, level meter, glowing handle. Drag works.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Fader.svelte
git commit -m "feat: redesign Fader component — recessed track, level meter, 3D handle, glow"
```

---

### Task 4: Visualizer Component Overhaul

**Files:**
- Rewrite: `src/lib/components/Visualizer.svelte`

- [ ] **Step 1: Replace `src/lib/components/Visualizer.svelte` with the bilateral waveform + spectrum strip visualizer**

```svelte
<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import {
		waveformLeft,
		waveformRight,
		spectrumData,
		levelLeft,
		levelRight,
		isPlaying,
		currentRate
	} from '$lib/stores/audioStore';
	import { onDestroy } from 'svelte';

	interface Props {
		canvasId: string;
		type?: 'bilateral' | 'spectrum' | 'meter';
		color?: 'cyan' | 'magenta' | 'green';
		width?: number;
		height?: number;
		class?: string;
	}

	let {
		canvasId,
		type = 'bilateral',
		color = 'cyan',
		width = 800,
		height = 300,
		class: className = ''
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let animFrameId: number;

	// Afterimage trail: store last 4 frames
	const TRAIL_COUNT = 4;
	const trailFrames: Float32Array[] = [];
	for (let i = 0; i < TRAIL_COUNT; i++) {
		trailFrames.push(new Float32Array(2048));
	}
	let trailFramesR: Float32Array[] = [];
	for (let i = 0; i < TRAIL_COUNT; i++) {
		trailFramesR.push(new Float32Array(2048));
	}

	const colorMap = {
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	// Idle animation phase
	let idlePhase = 0;

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;
		const mainH = type === 'bilateral' ? h - 48 : h; // Reserve 48px for spectrum strip

		// Clear with deep background
		ctx.fillStyle = '#08080c';
		ctx.fillRect(0, 0, w, h);

		if (type === 'bilateral') {
			drawBilateralWaveform(ctx, w, mainH);
			drawMiniSpectrum(ctx, w, h, mainH);
		} else if (type === 'spectrum') {
			drawSpectrum(ctx, w, h);
		} else if (type === 'meter') {
			drawMeter(ctx, w, h);
		}

		animFrameId = requestAnimationFrame(draw);
	}

	function drawBilateralWaveform(ctx: CanvasRenderingContext2D, w: number, h: number) {
		// Dot grid
		ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
		const gridSize = 20;
		for (let x = gridSize; x < w; x += gridSize) {
			for (let y = gridSize; y < h; y += gridSize) {
				ctx.beginPath();
				ctx.arc(x, y, 0.5, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Grid lines
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
		ctx.lineWidth = 0.5;
		for (let i = 1; i < 8; i++) {
			const y = (h / 8) * i;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}
		for (let i = 1; i < 16; i++) {
			const x = (w / 16) * i;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}

		// Center line (brighter)
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();

		const dataL = $waveformLeft;
		const dataR = $waveformRight;
		const playing = $isPlaying;

		if (playing && dataL && dataL.length > 0) {
			// Shift trail frames
			for (let i = TRAIL_COUNT - 1; i > 0; i--) {
				trailFrames[i].set(trailFrames[i - 1]);
				trailFramesR[i].set(trailFramesR[i - 1]);
			}
			trailFrames[0].set(dataL);
			trailFramesR[0].set(dataR);

			// Draw afterimage trails
			const trailOpacities = [0.08, 0.05, 0.03, 0.01];
			for (let t = TRAIL_COUNT - 1; t >= 1; t--) {
				drawWaveformLine(ctx, trailFrames[t], w, h, '#22d3ee', trailOpacities[t - 1], 1);
				drawWaveformLine(ctx, trailFramesR[t], w, h, '#e879f9', trailOpacities[t - 1], 1);
			}

			// Draw main waveforms
			drawWaveformLine(ctx, dataL, w, h, '#22d3ee', 1, 2);
			drawWaveformLine(ctx, dataR, w, h, '#e879f9', 1, 2);
		} else {
			// Idle breathing animation
			idlePhase += 0.02;
			const breathAmp = 0.15 + Math.sin(idlePhase * 0.5) * 0.05;
			const idleData = new Float32Array(256);
			for (let i = 0; i < 256; i++) {
				idleData[i] = Math.sin((i / 256) * Math.PI * 4 + idlePhase) * breathAmp;
			}
			drawWaveformLine(ctx, idleData, w, h, '#22d3ee', 0.25, 1.5);
			const idleDataR = new Float32Array(256);
			for (let i = 0; i < 256; i++) {
				idleDataR[i] = Math.sin((i / 256) * Math.PI * 4 + idlePhase + Math.PI) * breathAmp;
			}
			drawWaveformLine(ctx, idleDataR, w, h, '#e879f9', 0.25, 1.5);
		}

		// Corner brackets & labels
		ctx.font = '10px Inter, system-ui, sans-serif';
		ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
		ctx.textAlign = 'left';
		ctx.fillText('L', 8, 16);
		ctx.fillStyle = 'rgba(232, 121, 249, 0.6)';
		ctx.textAlign = 'right';
		ctx.fillText('R', w - 8, 16);

		// Corner bracket marks
		ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(4, 4);
		ctx.lineTo(4, 20);
		ctx.moveTo(4, 4);
		ctx.lineTo(20, 4);
		ctx.stroke();

		ctx.strokeStyle = 'rgba(232, 121, 249, 0.2)';
		ctx.beginPath();
		ctx.moveTo(w - 4, 4);
		ctx.lineTo(w - 4, 20);
		ctx.moveTo(w - 4, 4);
		ctx.lineTo(w - 20, 4);
		ctx.stroke();

		// Rate readout overlay
		const rate = $currentRate;
		ctx.font = 'bold 28px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center';

		// Glow
		ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
		ctx.shadowBlur = 16;
		ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
		ctx.fillText(rate.toFixed(1), w / 2, h / 2 + 10);
		ctx.shadowBlur = 0;

		ctx.font = '11px Inter, system-ui, sans-serif';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.fillText('Hz', w / 2 + 30, h / 2 + 10);
	}

	function drawWaveformLine(
		ctx: CanvasRenderingContext2D,
		data: Float32Array,
		w: number,
		h: number,
		color: string,
		alpha: number,
		lineWidth: number
	) {
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = alpha > 0.5 ? 8 : 4;
		ctx.beginPath();

		const sliceWidth = w / data.length;
		let x = 0;

		for (let i = 0; i < data.length; i++) {
			const v = (data[i] + 1) / 2;
			const y = v * h;
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
			x += sliceWidth;
		}

		ctx.stroke();
		ctx.shadowBlur = 0;
		ctx.restore();
	}

	function drawMiniSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number, mainH: number) {
		const stripY = mainH;
		const stripH = h - mainH;
		const data = $spectrumData;

		if (!data || data.length === 0) return;

		// Background
		ctx.fillStyle = 'rgba(8, 8, 12, 0.9)';
		ctx.fillRect(0, stripY, w, stripH);

		// Top border line
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, stripY);
		ctx.lineTo(w, stripY);
		ctx.stroke();

		// Spectrum bars (64 bars from 128 data points, take every other)
		const barCount = 64;
		const barWidth = (w - 20) / barCount; // 10px padding each side
		const levelL = $levelLeft;
		const levelR = $levelRight;

		for (let i = 0; i < barCount; i++) {
			const dataIdx = Math.floor(i * (data.length / barCount));
			const normalized = Math.max(0, (data[dataIdx] + 140) / 140);
			const barHeight = normalized * stripH * 0.8;

			// Color gradient: cyan → magenta → orange
			const t = i / barCount;
			let r: number, g: number, b: number;
			if (t < 0.5) {
				const p = t * 2;
				r = Math.round(34 + (232 - 34) * p);
				g = Math.round(211 + (121 - 211) * p);
				b = Math.round(238 + (249 - 238) * p);
			} else {
				const p = (t - 0.5) * 2;
				r = Math.round(232 + (249 - 232) * p);
				g = Math.round(121 + (115 - 121) * p);
				b = Math.round(249 + (22 - 249) * p);
			}

			const barX = 10 + i * barWidth;
			ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
			ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
			ctx.shadowBlur = 4;
			ctx.fillRect(barX, stripY + stripH - barHeight - 2, barWidth - 1, barHeight);
		}
		ctx.shadowBlur = 0;

		// L/R level meters on edges
		const meterL = Math.min(1, levelL * 3);
		const meterR = Math.min(1, levelR * 3);

		// Left meter
		ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
		ctx.shadowColor = 'rgba(34, 211, 238, 0.3)';
		ctx.shadowBlur = 4;
		ctx.fillRect(2, stripY + stripH * (1 - meterL), 4, stripH * meterL);

		// Right meter
		ctx.fillStyle = 'rgba(232, 121, 249, 0.6)';
		ctx.shadowColor = 'rgba(232, 121, 249, 0.3)';
		ctx.fillRect(w - 6, stripY + stripH * (1 - meterR), 4, stripH * meterR);
		ctx.shadowBlur = 0;
	}

	function drawSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const data = $spectrumData;
		if (!data || data.length === 0) return;

		const colors = colorMap[color];
		const barWidth = (w / data.length) * 2.5;
		let x = 0;

		for (let i = 0; i < data.length; i++) {
			const normalized = Math.max(0, (data[i] + 140) / 140);
			const barHeight = normalized * h;

			const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
			gradient.addColorStop(0, colors.primary);
			gradient.addColorStop(1, colors.secondary);

			ctx.fillStyle = gradient;
			ctx.shadowColor = colors.glow;
			ctx.shadowBlur = 5;
			ctx.fillRect(x, h - barHeight, barWidth, barHeight);
			ctx.shadowBlur = 0;

			x += barWidth + 1;
		}
	}

	function drawMeter(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const level = Math.max($levelLeft, $levelRight);
		const pct = Math.min(1, level * 3);
		const colors = colorMap[color];

		ctx.fillStyle = '#1f2937';
		ctx.fillRect(0, 0, w, h);

		const gradient = ctx.createLinearGradient(0, h, 0, 0);
		gradient.addColorStop(0, colors.secondary);
		gradient.addColorStop(0.7, colors.primary);
		gradient.addColorStop(1, '#ffffff');

		ctx.fillStyle = gradient;
		ctx.shadowColor = colors.glow;
		ctx.shadowBlur = 10;
		ctx.fillRect(0, h * (1 - pct), w, h * pct);
		ctx.shadowBlur = 0;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, h * (1 - pct) - 2, w, 2);
	}

	$effect(() => {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;
			animFrameId = requestAnimationFrame(draw);
		}
		return () => {
			if (animFrameId) cancelAnimationFrame(animFrameId);
		};
	});
</script>

<canvas
	bind:this={canvas}
	id={canvasId}
	class={cn(
		'rounded-xl',
		className
	)}
	{width}
	{height}
	style="background: #08080c;"
></canvas>
```

- [ ] **Step 2: Verify visualizer renders bilateral mode**

Run: `npm run dev`
Expected: Dev server starts. Canvas shows dot grid, idle breathing waveforms (cyan L / magenta R), corner brackets, rate readout.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Visualizer.svelte
git commit -m "feat: overhaul Visualizer — bilateral waveform, afterimage trails, dot-grid, spectrum strip"
```

---

### Task 5: PresetButton Component Redesign

**Files:**
- Rewrite: `src/lib/components/PresetButton.svelte`

- [ ] **Step 1: Replace `src/lib/components/PresetButton.svelte` with pill-shaped glowing buttons**

```svelte
<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		active?: boolean;
		label?: string;
		icon?: any;
		color?: 'cyan' | 'magenta' | 'green';
		onClick?: () => void;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
	}

	let {
		active = false,
		label = '',
		icon: Icon,
		color = 'cyan',
		onClick,
		class: className = '',
		size = 'md',
		disabled = false
	}: Props = $props();

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-[10px]',
		md: 'px-4 py-2 text-xs',
		lg: 'px-5 py-2.5 text-sm'
	};

	const colorValues = {
		cyan: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)', bg15: 'rgba(34, 211, 238, 0.15)' },
		magenta: { primary: '#e879f9', glow: 'rgba(232, 121, 249, 0.3)', bg15: 'rgba(232, 121, 249, 0.15)' },
		green: { primary: '#34d399', glow: 'rgba(52, 211, 153, 0.3)', bg15: 'rgba(52, 211, 153, 0.15)' }
	};

	const cv = $derived(colorValues[color]);
</script>

<button
	class={cn(
		'relative flex items-center justify-center gap-1.5',
		'rounded-lg border transition-all duration-200',
		'font-semibold uppercase tracking-wider',
		'disabled:opacity-40 disabled:cursor-not-allowed',
		'active:scale-95',
		sizeClasses[size],
		className
	)}
	style="
		background: {active ? cv.bg15 : 'var(--ns-bg-surface)'};
		border-color: {active ? cv.primary : 'var(--ns-border)'};
		color: {active ? cv.primary : 'var(--ns-text-secondary)'};
		box-shadow: {active ? `0 0 12px ${cv.glow}, inset 0 0 12px ${cv.glow}` : 'none'};
	"
	onclick={onClick}
	disabled={disabled}
	type="button"
>
	{#if active}
		<!-- Dot indicator -->
		<span
			class="w-1.5 h-1.5 rounded-full"
			style="background: {cv.primary}; box-shadow: 0 0 4px {cv.glow};"
		></span>
	{/if}

	{#if Icon}
		<Icon class="w-3.5 h-3.5" />
	{/if}

	{#if label}
		<span>{label}</span>
	{/if}

	{#if active}
		<!-- Outer glow layer -->
		<div
			class="absolute inset-0 rounded-lg opacity-20 blur-md"
			style="background: {cv.primary}; z-index: -1;"
		></div>
	{/if}
</button>
```

- [ ] **Step 2: Verify preset buttons render with glow states**

Run: `npm run dev`
Expected: Buttons render with pill shape, glow on active, dot indicator, press scale.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/PresetButton.svelte
git commit -m "feat: redesign PresetButton — pill shape, glow states, dot indicator, press animation"
```

---

### Task 6: App Layout Restructure

**Files:**
- Rewrite template: `src/App.svelte`

This is the largest task. The `<script>` block stays mostly the same (same imports, same functions). The template restructures from 3-column to visualizer-top + controls-below.

- [ ] **Step 1: Replace the entire `src/App.svelte`**

```svelte
<script lang="ts">
	import { engine } from '$lib/audio/AudioEngine';
	import { 
		isPlaying,
		pattern,
		ratePreset,
		rateValue,
		currentRate,
		activeCarriers,
		carrierFreq,
		attackTime,
		decayTime,
		dutyCycle,
		leftGain,
		rightGain,
		userAudioBuffer,
		userAudioGain,
		masterGain,
		exportDuration,
		exportBitDepth,
		waveformLeft,
		waveformRight,
		levelLeft,
		levelRight,
		spectrumData,
		soundLibrary,
		selectedSampleId,
		sampleAudioBuffer,
		toggleCarrier,
		type CarrierType
	} from '$lib/stores/audioStore';
	import Visualizer from '$lib/components/Visualizer.svelte';
	import Knob from '$lib/components/Knob.svelte';
	import Fader from '$lib/components/Fader.svelte';
	import PresetButton from '$lib/components/PresetButton.svelte';
	import { Play, Square, Upload, Download, Info, AlertTriangle, Activity } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	
	function cn(...classes: Array<string | undefined | null | false>): string {
		return classes.filter(Boolean).join(' ');
	}
	
	let isInitialized = $state(false);
	let showSafetyModal = $state(false);
	let showInfoPanel = $state(false);
	let isExporting = $state(false);
	let visualizerAnimationId: number | null = null;
	
	const patternPresets = {
		pure: { label: 'Pure', icon: '⇄' },
		mirrored: { label: 'Mirror', icon: '⟷' },
		asymmetric: { label: 'Asym', icon: '≠' },
		clustered: { label: 'Cluster', icon: '⋯' },
		randomized: { label: 'Random', icon: '⚡' }
	};
	
	const ratePresets = {
		delta: { label: 'Delta', range: '0.5-3 Hz', default: 2 },
		theta: { label: 'Theta', range: '4-7 Hz', default: 6 },
		alpha: { label: 'Alpha', range: '8-12 Hz', default: 10 },
		beta: { label: 'Beta', range: '13-30 Hz', default: 20 },
		emdr: { label: 'EMDR', range: '1-3 Hz', default: 2 }
	};

	let isLoadingSample = $state(false);

	async function loadSample(id: string) {
		selectedSampleId.set(id);
		isLoadingSample = true;
		const entry = soundLibrary.find((s: { id: string; label: string; filename: string; description: string }) => s.id === id);
		if (!entry) { isLoadingSample = false; return; }
		try {
			const response = await fetch(`/sounds/${entry.filename}`);
			const arrayBuffer = await response.arrayBuffer();
			const ctx = new AudioContext();
			const buffer = await ctx.decodeAudioData(arrayBuffer);
			sampleAudioBuffer.set(buffer);
			await ctx.close();
			if ($isPlaying) updateEngineConfig();
		} catch (e) {
			console.error('Failed to load sample:', e);
		}
		isLoadingSample = false;
	}
	
	async function handleInitialize() {
		if (!isInitialized) {
			await engine.init();
			isInitialized = true;
			showSafetyModal = true;
			startVisualizerLoop();
		}
	}
	
	function startVisualizerLoop() {
		function update() {
			if (!$isPlaying) {
				waveformLeft.set(new Float32Array(2048));
				waveformRight.set(new Float32Array(2048));
				levelLeft.set(0);
				levelRight.set(0);
				spectrumData.set(new Float32Array(128));
			} else {
				const data = engine.getAnalyserData();
				waveformLeft.set(data.waveformLeft);
				waveformRight.set(data.waveformRight);
				levelLeft.set(data.levelLeft);
				levelRight.set(data.levelRight);
				spectrumData.set(data.spectrum);
			}
			visualizerAnimationId = requestAnimationFrame(update);
		}
		update();
	}

	onDestroy(() => {
		if (visualizerAnimationId !== null) {
			cancelAnimationFrame(visualizerAnimationId);
		}
	});
	
	function handlePlay() {
		if (!isInitialized) return;
		if ($isPlaying) {
			engine.stop();
			isPlaying.set(false);
		} else {
			updateEngineConfig();
			engine.play();
			isPlaying.set(true);
		}
	}
	
	function updateEngineConfig() {
		engine.updateConfig({
			pattern: $pattern,
			rate: $currentRate,
			carrierTypes: $activeCarriers,
			carrierFreq: $carrierFreq,
			attack: $attackTime,
			decay: $decayTime,
			dutyCycle: $dutyCycle,
			leftGain: $leftGain,
			rightGain: $rightGain,
			masterGain: $masterGain,
			userAudioBuffer: $userAudioBuffer,
			userAudioGain: $userAudioGain,
			sampleBuffer: $sampleAudioBuffer
		});
	}
	
	function setPattern(p: keyof typeof patternPresets) {
		pattern.set(p);
		if ($isPlaying) updateEngineConfig();
	}
	
	function setRatePreset(p: keyof typeof ratePresets) {
		ratePreset.set(p);
		rateValue.set(ratePresets[p].default);
		if ($isPlaying) updateEngineConfig();
	}

	function applyRatePreset(p: keyof typeof ratePresets) {
		setRatePreset(p);
	}

	function setRate(value: number) {
		rateValue.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function setCarrier(type: CarrierType) {
		toggleCarrier(type);
		if (type === 'sample' && !$sampleAudioBuffer) {
			loadSample($selectedSampleId);
		}
		if ($isPlaying) updateEngineConfig();
	}

	function setCarrierFreq(value: number) {
		carrierFreq.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function updateEnvelope(values: { attack?: number; decay?: number; dutyCycle?: number }) {
		if (values.attack !== undefined) attackTime.set(values.attack);
		if (values.decay !== undefined) decayTime.set(values.decay);
		if (values.dutyCycle !== undefined) dutyCycle.set(values.dutyCycle);
		if ($isPlaying) updateEngineConfig();
	}

	function setLeftGain(value: number) {
		leftGain.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function setRightGain(value: number) {
		rightGain.set(value);
		if ($isPlaying) updateEngineConfig();
	}
	
	function handleFileUpload(event: Event) {
		try {
			const input = event.target as HTMLInputElement;
			const file = input.files?.[0];
			if (!file || !engine) return;
			const ctx = new AudioContext();
			const reader = new FileReader();
			reader.onload = async () => {
				try {
					const arrayBuffer = reader.result as ArrayBuffer;
					const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
					userAudioBuffer.set(audioBuffer);
					await ctx.close();
					if ($isPlaying) {
						updateEngineConfig();
					}
				} catch (error) {
					console.error('Failed to load audio:', error);
					await ctx.close();
				}
			};
			reader.readAsArrayBuffer(file);
			input.value = '';
		} catch (error) {
			console.error('File upload error:', error);
		}
	}
	
	async function handleExport() {
		if (!isInitialized || isExporting) return;
		isExporting = true;
		updateEngineConfig();
		try {
			const blob = await engine.renderOffline($exportDuration, $exportBitDepth);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `neon-synth-bilateral-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.wav`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			isExporting = false;
		}
	}
	
	function closeSafetyModal() {
		showSafetyModal = false;
	}
	
	$effect(() => {
		if ($isPlaying) {
			updateEngineConfig();
		}
	});
</script>

<svelte:window onclick={handleInitialize} />

<div class="min-h-screen bg-[var(--ns-bg-deep)] text-[var(--ns-text-primary)]">
	{#if !isInitialized}
		<div class="fixed inset-0 flex items-center justify-center z-50" style="background: radial-gradient(ellipse at center, #0d0d18 0%, var(--ns-bg-deep) 70%);">
			<div class="text-center space-y-6">
				<div class="space-y-2">
					<h1 class="text-6xl font-bold bg-gradient-to-r from-[var(--ns-accent-primary)] via-[var(--ns-accent-secondary)] to-[var(--ns-accent-primary)] bg-clip-text text-transparent animate-pulse"
						style="text-shadow: 0 0 40px var(--ns-glow-primary);">
						NEONSYNTH
					</h1>
					<p style="color: var(--ns-text-secondary);" class="text-sm uppercase tracking-widest">Bilateral Isochronic Audio Synthesizer</p>
				</div>
				<div class="w-48 h-0.5 mx-auto rounded-full overflow-hidden" style="background: var(--ns-bg-surface);">
					<div class="h-full bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] animate-pulse" style="width: 100%"></div>
				</div>
				<p style="color: var(--ns-text-dim);" class="text-xs uppercase tracking-wider">Click anywhere to initialize</p>
			</div>
		</div>
	{/if}
	
	{#if showSafetyModal}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
			<div class="ns-panel max-w-md w-full p-8 space-y-6">
				<div class="flex items-center gap-3" style="color: #fbbf24;">
					<AlertTriangle class="w-6 h-6" />
					<h2 class="text-lg font-bold uppercase tracking-wider">Safety Notice</h2>
				</div>
				<div class="space-y-3" style="color: var(--ns-text-secondary);">
					<p class="font-medium text-sm">This tool produces bilateral auditory stimulation.</p>
					<ul class="space-y-1.5 text-xs">
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Use at comfortable volume levels</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Discontinue if you experience discomfort or dizziness</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Not recommended for individuals with epilepsy</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Consult a healthcare professional if you have medical conditions</li>
					</ul>
					<p style="color: var(--ns-text-dim);" class="text-[10px] italic">For educational/experimental purposes only. Not medical equipment.</p>
				</div>
				<button 
					class="w-full py-2.5 px-6 rounded-lg font-bold uppercase tracking-wider text-sm transition-all hover:scale-105"
					style="background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6); color: var(--ns-bg-deep); box-shadow: 0 0 20px var(--ns-glow-primary);"
					onclick={closeSafetyModal}
				>
					I Understand
				</button>
			</div>
		</div>
	{/if}

	<!-- Compact Header -->
	<header class="sticky top-0 z-40" style="background: rgba(8,8,12,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid var(--ns-border);">
		<div class="max-w-[1800px] mx-auto px-6" style="height: 48px;">
			<div class="flex items-center justify-between h-full">
				<!-- Logo -->
				<h1 class="text-lg font-extrabold uppercase tracking-widest bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] bg-clip-text text-transparent"
					style="text-shadow: 0 0 20px var(--ns-glow-primary);">
					NEONSYNTH
				</h1>
				
				<!-- Transport + Utilities -->
				<div class="flex items-center gap-3">
					<!-- Transport button (circular) -->
					<button
						class="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
						style="
							background: {$isPlaying 
								? 'linear-gradient(135deg, #ef4444, #ec4899)' 
								: 'linear-gradient(135deg, var(--ns-accent-primary), #3b82f6)'};
							color: var(--ns-bg-deep);
							box-shadow: 0 0 16px {$isPlaying ? 'rgba(239,68,68,0.4)' : 'var(--ns-glow-primary)'};
						"
						onclick={handlePlay}
						disabled={!isInitialized}
					>
						{#if $isPlaying}
							<Square class="w-3.5 h-3.5" />
						{:else}
							<Play class="w-3.5 h-3.5" style="margin-left: 1px;" />
						{/if}
						<!-- Pulsing ring when playing -->
						{#if $isPlaying}
							<div class="absolute inset-0 rounded-full animate-ping opacity-20"
								style="background: #ef4444;"></div>
						{/if}
					</button>

					<!-- Upload -->
					<button
						class="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
						style="background: var(--ns-bg-surface); border: 1px solid var(--ns-border);"
						onclick={() => document.getElementById('file-upload-input')?.click()}
					>
						<Upload class="w-3.5 h-3.5" style="color: var(--ns-text-dim);" />
					</button>
					<input id="file-upload-input" type="file" accept="audio/*" onchange={handleFileUpload} class="hidden" />
					
					<!-- Info -->
					<button
						class="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
						style="background: var(--ns-bg-surface); border: 1px solid var(--ns-border);"
						onclick={() => showInfoPanel = !showInfoPanel}
					>
						<Info class="w-3.5 h-3.5" style="color: var(--ns-text-dim);" />
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Central Visualizer Panel -->
	<section class="relative" style="height: 40vh; min-height: 280px;">
		<Visualizer 
			canvasId="bilateral-main"
			type="bilateral"
			width={1800}
			height={400}
			class="w-full h-full"
		/>
		<!-- Decorative corner dots -->
		<div class="absolute top-3 left-3 w-1.5 h-1.5 rounded-full" style="background: var(--ns-text-dim);"></div>
		<div class="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style="background: var(--ns-text-dim);"></div>
	</section>

	<!-- Control Grid -->
	<main class="max-w-[1800px] mx-auto px-6 py-6">
		<div class="grid grid-cols-5 gap-4">

			<!-- Pattern Panel -->
			<div class="ns-panel">
				<div class="ns-panel-header" style="border-bottom-color: var(--ns-accent-primary); box-shadow: 0 2px 6px var(--ns-glow-primary);">
					Pattern
					<div class="ns-panel-corner" style="top: 4px; right: 4px;"></div>
					<div class="ns-panel-corner" style="bottom: 4px; left: 4px;"></div>
				</div>
				<div class="space-y-1.5">
					{#each Object.entries(patternPresets) as [key, preset]}
						<PresetButton
							label={preset.label}
							active={$pattern === key}
							color="cyan"
							size="sm"
							onClick={() => setPattern(key as typeof key)}
							class="w-full justify-start"
						/>
					{/each}
				</div>
			</div>

			<!-- Rate Panel -->
			<div class="ns-panel">
				<div class="ns-panel-header" style="border-bottom-color: var(--ns-accent-secondary); box-shadow: 0 2px 6px var(--ns-glow-secondary);">
					Rate
					<div class="ns-panel-corner" style="top: 4px; right: 4px;"></div>
					<div class="ns-panel-corner" style="bottom: 4px; left: 4px;"></div>
				</div>
				<div class="grid grid-cols-2 gap-1.5">
					{#each Object.entries(ratePresets) as [key, preset]}
						<PresetButton
							label={preset.label}
							active={Math.abs($currentRate - preset.default) < 0.5}
							color="magenta"
							size="sm"
							onClick={() => applyRatePreset(key as typeof key)}
						/>
					{/each}
				</div>
				<div class="mt-4 pt-3" style="border-top: 1px solid var(--ns-border);">
					<div class="text-center mb-2">
						<span class="text-2xl font-extrabold bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] bg-clip-text text-transparent"
							style="font-variant-numeric: tabular-nums;">
							{$currentRate.toFixed(1)}
						</span>
						<span class="text-[10px] ml-1" style="color: var(--ns-text-dim);">Hz</span>
					</div>
					<input
						type="range"
						min="0.5"
						max="30"
						step="0.1"
						bind:value={$rateValue}
						oninput={(e: Event) => setRate(parseFloat((e.target as HTMLInputElement).value))}
						class="w-full"
					/>
				</div>
			</div>

			<!-- Carrier Panel (widest) -->
			<div class="ns-panel col-span-1">
				<div class="ns-panel-header" style="border-bottom-color: var(--ns-accent-primary); box-shadow: 0 2px 6px var(--ns-glow-primary);">
					<span class="flex items-center gap-2"><Activity class="w-3.5 h-3.5" /> Carrier Layers</span>
					<div class="ns-panel-corner" style="top: 4px; right: 4px;"></div>
					<div class="ns-panel-corner" style="bottom: 4px; left: 4px;"></div>
				</div>
				
				<div class="space-y-3">
					<div>
						<span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Waves</span>
						<div class="flex flex-wrap gap-1.5 mt-1">
							{#each ['sine', 'square', 'sawtooth', 'triangle'] as type}
								<PresetButton
									label={type === 'sine' ? 'Sine' : type === 'square' ? 'Square' : type === 'sawtooth' ? 'Saw' : 'Tri'}
									active={$activeCarriers.includes(type as CarrierType)}
									color="cyan"
									size="sm"
									onClick={() => setCarrier(type as CarrierType)}
								/>
							{/each}
						</div>
					</div>
					
					<div>
						<span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Noise</span>
						<div class="flex flex-wrap gap-1.5 mt-1">
							{#each ['white-noise', 'pink', 'brown', 'bandlimited'] as type}
								<PresetButton
									label={type === 'white-noise' ? 'White' : type === 'pink' ? 'Pink' : type === 'brown' ? 'Brown' : 'B.Lim'}
									active={$activeCarriers.includes(type as CarrierType)}
									color="magenta"
									size="sm"
									onClick={() => setCarrier(type as CarrierType)}
								/>
							{/each}
						</div>
					</div>
					
					<div>
						<span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Sample</span>
						<div class="flex flex-wrap gap-1.5 mt-1">
							<PresetButton
								label="Sound Sample"
								active={$activeCarriers.includes('sample')}
								color="green"
								size="sm"
								onClick={() => setCarrier('sample')}
							/>
						</div>
					</div>
				</div>
				
				{#if $activeCarriers.some((c: CarrierType) => ['sine', 'square', 'sawtooth', 'triangle'].includes(c))}
					<div class="mt-3 pt-3 flex items-center gap-4" style="border-top: 1px solid var(--ns-border);">
						<Knob
							label="Freq"
							value={$carrierFreq}
							min={100}
							max={2000}
							step={10}
							unit="Hz"
							size="md"
							color="cyan"
							onInput={(v: number) => setCarrierFreq(v)}
						/>
					</div>
				{/if}
				
				{#if $activeCarriers.includes('bandlimited')}
					<div class="mt-3 pt-3 flex items-center gap-4" style="border-top: 1px solid var(--ns-border);">
						<Knob
							label="Cutoff"
							value={$carrierFreq}
							min={100}
							max={5000}
							step={50}
							unit="Hz"
							size="md"
							color="cyan"
							onInput={(v: number) => setCarrierFreq(v)}
						/>
					</div>
				{/if}
				
				{#if $activeCarriers.includes('sample')}
					<div class="mt-3 pt-3" style="border-top: 1px solid var(--ns-border);">
						<span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Select Sound</span>
						<div class="grid grid-cols-2 gap-1.5 mt-1.5 max-h-32 overflow-y-auto">
							{#each soundLibrary as entry}
								<button
									class={cn(
										'text-left px-2 py-1.5 rounded-lg border transition-all text-[10px]',
									)}
									style="
										background: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-bg-surface)'};
										border-color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-border)'};
										color: {$selectedSampleId === entry.id ? 'var(--ns-bg-deep)' : 'var(--ns-text-secondary)'};
										box-shadow: {$selectedSampleId === entry.id ? '0 0 8px var(--ns-glow-tertiary)' : 'none'};
									"
									onclick={() => loadSample(entry.id)}
									disabled={isLoadingSample}
								>
									<div class="font-semibold">{entry.label}</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Envelope Panel -->
			<div class="ns-panel">
				<div class="ns-panel-header" style="border-bottom-color: var(--ns-accent-tertiary); box-shadow: 0 2px 6px var(--ns-glow-tertiary);">
					Pulse Envelope
					<div class="ns-panel-corner" style="top: 4px; right: 4px;"></div>
					<div class="ns-panel-corner" style="bottom: 4px; left: 4px;"></div>
				</div>
				<div class="flex justify-around">
					<Knob
						label="Attack"
						value={$attackTime}
						min={0.001}
						max={0.5}
						step={0.001}
						unit="s"
						size="md"
						color="green"
						onInput={(v: number) => updateEnvelope({ attack: v })}
					/>
					<Knob
						label="Decay"
						value={$decayTime}
						min={0.01}
						max={1.0}
						step={0.01}
						unit="s"
						size="md"
						color="cyan"
						onInput={(v: number) => updateEnvelope({ decay: v })}
					/>
					<Knob
						label="Duty"
						value={$dutyCycle}
						min={0.1}
						max={0.9}
						step={0.05}
						size="md"
						color="magenta"
						onInput={(v: number) => updateEnvelope({ dutyCycle: v })}
					/>
				</div>
			</div>

			<!-- Stereo Panel -->
			<div class="ns-panel">
				<div class="ns-panel-header" style="border-bottom-color: var(--ns-accent-primary); box-shadow: 0 2px 8px var(--ns-glow-primary);">
					Stereo Field
					<div class="ns-panel-corner" style="top: 4px; right: 4px;"></div>
					<div class="ns-panel-corner" style="bottom: 4px; left: 4px;"></div>
				</div>
				<div class="flex justify-center gap-6">
					<Fader
						label="Left"
						value={$leftGain}
						min={0}
						max={1}
						step={0.01}
						color="cyan"
						channel="left"
						onInput={(v: number) => setLeftGain(v)}
					/>
					<Fader
						label="Right"
						value={$rightGain}
						min={0}
						max={1}
						step={0.01}
						color="magenta"
						channel="right"
						onInput={(v: number) => setRightGain(v)}
					/>
				</div>
			</div>
		</div>

		<!-- Export Bar -->
		<section class="ns-panel mt-4 flex items-center gap-4">
			<h2 class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ns-accent-warning);">Export</h2>
			<select
				value={$exportDuration}
				onchange={(e: Event) => exportDuration.set(Number((e.target as HTMLSelectElement).value))}
			>
				<option value={30}>30s</option>
				<option value={60}>1 min</option>
				<option value={120}>2 min</option>
				<option value={300}>5 min</option>
				<option value={600}>10 min</option>
			</select>
			<select
				value={$exportBitDepth}
				onchange={(e: Event) => exportBitDepth.set(Number((e.target as HTMLSelectElement).value) as 16 | 24)}
			>
				<option value={16}>16-bit</option>
				<option value={24}>24-bit</option>
			</select>
			<button 
				class="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all hover:scale-105"
				style="
					background: {isExporting ? 'var(--ns-bg-surface)' : 'linear-gradient(135deg, var(--ns-accent-warning), #ea580c)'};
					color: {isExporting ? 'var(--ns-text-dim)' : 'var(--ns-bg-deep)'};
					box-shadow: {isExporting ? 'none' : '0 0 16px var(--ns-glow-warning)'};
					cursor: {isExporting ? 'not-allowed' : 'pointer'};
				"
				onclick={handleExport}
				disabled={isExporting || !isInitialized}
			>
				<Download class="w-3.5 h-3.5" />
				{isExporting ? 'Rendering...' : 'Export WAV'}
			</button>
		</section>

		{#if showInfoPanel}
			<section class="ns-panel mt-4">
				<h2 class="ns-panel-header">About Bilateral Isochronic Stimulation</h2>
				<div class="grid md:grid-cols-2 gap-6 text-sm" style="color: var(--ns-text-secondary);">
					<div>
						<p class="mb-3">
							<strong style="color: var(--ns-accent-primary);">Isochronic tones</strong> are evenly-spaced pulses of sound that can influence brainwave activity.
							Unlike binaural beats, isochronic tones use discrete amplitude-modulated pulses.
						</p>
						<p>
							<strong style="color: var(--ns-accent-secondary);">Bilateral stimulation</strong> alternates sound between left and right ears,
							a technique used in EMDR therapy to facilitate interhemispheric communication.
						</p>
					</div>
					<div>
						<h3 class="font-semibold mb-2" style="color: var(--ns-text-primary);">Frequency Bands:</h3>
						<ul class="space-y-1 text-xs">
							<li><span style="color: var(--ns-accent-primary);" class="font-mono">Δ Delta (0.5-3 Hz):</span> Deep sleep, healing</li>
							<li><span style="color: var(--ns-accent-secondary);" class="font-mono">Θ Theta (4-7 Hz):</span> Meditation, creativity, REM</li>
							<li><span style="color: var(--ns-accent-tertiary);" class="font-mono">Α Alpha (8-12 Hz):</span> Relaxation, calm focus</li>
							<li><span style="color: #fbbf24;" class="font-mono">Β Beta (13-30 Hz):</span> Alert concentration</li>
						</ul>
					</div>
				</div>
			</section>
		{/if}
	</main>

	<!-- Footer -->
	<footer style="border-top: 1px solid var(--ns-border);" class="mt-8">
		<div class="max-w-[1800px] mx-auto px-6 py-4">
			<div class="flex items-center justify-between text-[10px] uppercase tracking-wider" style="color: var(--ns-text-dim);">
				<p>NeonSynth — Bilateral Audio Synthesizer</p>
				<p>Svelte 5 + Web Audio API</p>
			</div>
		</div>
	</footer>
</div>
```

- [ ] **Step 2: Verify the full app renders with new layout**

Run: `npm run dev`
Expected: App loads with visualizer-top layout, compact header, control grid below, export bar. All controls functional. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.svelte
git commit -m "feat: restructure layout — visualizer-top, compact header, control grid, export bar"
```

---

### Task 7: Visual Polish & Responsive Adjustments

**Files:**
- Modify: `src/App.svelte` (responsive adjustments)
- Modify: `src/app.css` (media queries)

- [ ] **Step 1: Add responsive breakpoints to `src/app.css`**

Append to `src/app.css`:

```css
/* Responsive */
@media (max-width: 1024px) {
  .ns-panel {
    padding: 14px;
  }
}

@media (max-width: 768px) {
  /* Control grid collapses to single column */
}
```

- [ ] **Step 2: Add responsive grid classes to App.svelte control grid**

Change the control grid `grid-cols-5` to include responsive:
```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
```

- [ ] **Step 3: Verify responsive behavior**

Run: `npm run dev`
Expected: Grid collapses on smaller screens. No overflow issues.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte src/app.css
git commit -m "feat: add responsive breakpoints for control grid and panels"
```

---

### Task 8: Final Integration Test

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `npm run check`
Expected: No type errors (pre-existing module resolution errors in params.ts/AudioEngine.ts are acceptable as they existed before this work)

- [ ] **Step 2: Build for production**

Run: `npm run build`
Expected: Build succeeds with exit code 0

- [ ] **Step 3: Manual visual verification**

Run: `npm run preview`
Expected: Preview server starts. All UI elements render: bilateral visualizer with idle animation, compact knobs, faders with level meters, glow states on buttons, frosted panels, export bar.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete NeonSynth GUI redesign — premium futuristic visual overhaul"
```
