# NeonSynth UI Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin NeonSynth into a Zynaptiq-Morph-Pro-inspired control surface: centerpiece "BILATERAL FIELD" module, satellite panels with corner brackets and power LEDs, SVG cable traces connecting them, chromed knobs/faders.

**Architecture:** Pure visual work. All audio logic, stores, and engine untouched. New reusable `PanelFrame` component wraps every module; new `CableLayer` component renders SVG patch cables whose endpoints come from a Svelte-context port registry; existing `Visualizer` gains overlay draw passes; `Knob`/`Fader` get chrome treatments; `App.svelte` is regridded into a 3-column layout with the Field in the center. No test framework exists in the repo — verification is `npm run check` + manual browser QA per task.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vite, Tailwind (via utility classes + inline style), Web Audio API (existing, untouched), Lucide icons (existing).

**Spec:** `docs/superpowers/specs/2026-04-17-neonsynth-ui-reskin-design.md`

---

## File Structure

**Modified:**
- `src/app.css` — palette vars, grain data URL, new chrome utility classes
- `src/App.svelte` — new 3-column grid, wires `PanelFrame`/`CableLayer`, declares connection map
- `src/lib/components/Visualizer.svelte` — add crosshair + axis labels + radial vignette draw passes
- `src/lib/components/Knob.svelte` — chrome outer ring, 12 hard ticks, dragging value pill
- `src/lib/components/Fader.svelte` — channel tag, grip-capped handle, 24-segment LED meter
- `src/lib/components/PresetButton.svelte` — inner bevel + left-edge port dot

**New:**
- `src/lib/utils/cablePorts.ts` — Svelte-context port registry (store + helpers)
- `src/lib/components/PanelFrame.svelte` — reusable panel shell
- `src/lib/components/CableLayer.svelte` — SVG cable renderer

---

## Task 1: Palette tweak + grain utility + chrome CSS

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Update palette variables and add grain + chrome utilities**

Replace the `:root` block and append new utility classes. Full new content for `src/app.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  color-scheme: dark;

  --ns-bg-deep: #070912;
  --ns-bg-panel: #0c0d18;
  --ns-bg-surface: #14151f;
  --ns-border: rgba(255, 255, 255, 0.06);
  --ns-border-bright: rgba(255, 255, 255, 0.1);
  --ns-accent-primary: #22d3ee;
  --ns-accent-secondary: #d668e8;
  --ns-accent-tertiary: #34d399;
  --ns-accent-warning: #f97316;
  --ns-text-primary: #f0f0f5;
  --ns-text-secondary: #9ca3af;
  --ns-text-dim: #4b5563;

  --ns-glow-primary: rgba(34, 211, 238, 0.5);
  --ns-glow-secondary: rgba(214, 104, 232, 0.5);
  --ns-glow-tertiary: rgba(52, 211, 153, 0.5);
  --ns-glow-warning: rgba(249, 115, 22, 0.5);

  --ns-bg-field-glow: rgba(34, 211, 238, 0.08);

  --ns-grain-url: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>");
}

body {
  margin: 0;
  background: var(--ns-bg-deep) radial-gradient(ellipse at 50% 35%, rgba(34,45,80,0.35) 0%, transparent 55%) no-repeat fixed;
  color: var(--ns-text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app { min-height: 100svh; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--ns-bg-deep); }
::-webkit-scrollbar-thumb { background: var(--ns-bg-surface); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--ns-text-dim); }

.ns-panel {
  background: linear-gradient(180deg, #0e0f1a 0%, #0a0b14 100%);
  border: 1px solid var(--ns-border);
  border-top-color: var(--ns-border-bright);
  border-left-color: var(--ns-border-bright);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  isolation: isolate;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4);
}
.ns-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--ns-grain-url) repeat;
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
  z-index: 0;
}
.ns-panel > * { position: relative; z-index: 1; }

.ns-panel-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ns-text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid currentColor;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ns-bracket {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
  stroke: currentColor;
  stroke-width: 1.25;
  fill: none;
  filter: drop-shadow(0 0 3px currentColor);
  opacity: 0.55;
}
.ns-bracket.tl { top: 6px; left: 6px; }
.ns-bracket.tr { top: 6px; right: 6px; transform: scaleX(-1); }
.ns-bracket.bl { bottom: 6px; left: 6px; transform: scaleY(-1); }
.ns-bracket.br { bottom: 6px; right: 6px; transform: scale(-1,-1); }

.ns-led {
  width: 7px; height: 7px; border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 4px currentColor, 0 0 8px currentColor, inset 0 0 2px rgba(255,255,255,0.6);
  flex-shrink: 0;
}
.ns-led.dim { opacity: 0.28; box-shadow: 0 0 2px currentColor; }
.ns-led.pulse { animation: ns-pulse 1.6s ease-in-out infinite; }
@keyframes ns-pulse {
  0%,100% { opacity: 1; box-shadow: 0 0 4px currentColor, 0 0 8px currentColor; }
  50% { opacity: 0.55; box-shadow: 0 0 2px currentColor; }
}

.ns-port {
  position: absolute;
  width: 10px; height: 10px; border-radius: 50%;
  background: radial-gradient(circle, #0a0b14 0%, #0a0b14 40%, currentColor 42%, currentColor 60%, transparent 62%);
  pointer-events: none;
  z-index: 2;
}
.ns-port.left { left: -5px; top: 50%; transform: translateY(-50%); }
.ns-port.right { right: -5px; top: 50%; transform: translateY(-50%); }
.ns-port.top { top: -5px; left: 50%; transform: translateX(-50%); }
.ns-port.bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }

.ns-panel-corner {
  position: absolute;
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--ns-text-dim);
}

:global(input[type="range"]) { -webkit-appearance: none; appearance: none; background: transparent; }
:global(input[type="range"]::-webkit-slider-thumb) {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6);
  cursor: pointer; box-shadow: 0 0 8px var(--ns-glow-primary);
}
:global(input[type="range"]::-moz-range-thumb) {
  width: 14px; height: 14px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6);
  cursor: pointer; border: none; box-shadow: 0 0 8px var(--ns-glow-primary);
}
:global(input[type="range"]::-webkit-slider-runnable-track) { height: 4px; background: var(--ns-bg-surface); border-radius: 2px; }
:global(input[type="range"]::-moz-range-track) { height: 4px; background: var(--ns-bg-surface); border-radius: 2px; }

:global(select) {
  background: var(--ns-bg-surface);
  border: 1px solid var(--ns-border);
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--ns-text-primary);
  font-size: 12px; font-family: inherit;
  cursor: pointer; outline: none;
}
:global(select:focus) { border-color: var(--ns-accent-primary); box-shadow: 0 0 8px var(--ns-glow-primary); }

@keyframes ns-cable-flow {
  to { stroke-dashoffset: -40; }
}

@media (max-width: 1024px) { .ns-panel { padding: 14px; } }
```

- [ ] **Step 2: Verify build still compiles**

Run: `npm run check`
Expected: no errors (0 errors, 0 warnings).

- [ ] **Step 3: Start dev server, load page**

Run: `npm run dev` (in background) and open the printed localhost URL.
Expected: page loads, panels appear with slightly deeper indigo background, subtle grain visible. No visual breakage.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "style: palette tweak, grain texture, chrome utilities (brackets/LEDs/ports)"
```

---

## Task 2: Cable-port registry utility

**Files:**
- Create: `src/lib/utils/cablePorts.ts`

- [ ] **Step 1: Create the registry module**

```ts
import { writable, type Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';

export type PortEdge = 'left' | 'right' | 'top' | 'bottom';
export type PortAccent = 'cyan' | 'magenta' | 'green' | 'amber';

export interface PortInfo {
  id: string;
  x: number;
  y: number;
  edge: PortEdge;
  accent: PortAccent;
  active: boolean;
}

export interface CablePortRegistry {
  ports: Writable<Record<string, PortInfo>>;
  container: Writable<HTMLElement | null>;
  set: (info: PortInfo) => void;
  remove: (id: string) => void;
}

const KEY = Symbol('cablePortRegistry');

export function createCablePortRegistry(): CablePortRegistry {
  const ports = writable<Record<string, PortInfo>>({});
  const container = writable<HTMLElement | null>(null);
  const registry: CablePortRegistry = {
    ports,
    container,
    set(info) {
      ports.update((m) => ({ ...m, [info.id]: info }));
    },
    remove(id) {
      ports.update((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };
  setContext(KEY, registry);
  return registry;
}

export function useCablePortRegistry(): CablePortRegistry | undefined {
  return getContext<CablePortRegistry>(KEY);
}

export function measurePort(
  portEl: HTMLElement,
  containerEl: HTMLElement
): { x: number; y: number } {
  const p = portEl.getBoundingClientRect();
  const c = containerEl.getBoundingClientRect();
  return {
    x: p.left - c.left + p.width / 2,
    y: p.top - c.top + p.height / 2
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/cablePorts.ts
git commit -m "feat: cable port registry (Svelte context for cable endpoint tracking)"
```

---

## Task 3: PanelFrame component

**Files:**
- Create: `src/lib/components/PanelFrame.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { cn } from '$lib/utils/cn';
  import { useCablePortRegistry, measurePort, type PortEdge, type PortAccent } from '$lib/utils/cablePorts';

  interface Props {
    label: string;
    accent?: PortAccent;
    active?: boolean;
    portSide?: PortEdge | 'none';
    portId?: string;
    class?: string;
    headerRight?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let {
    label,
    accent = 'cyan',
    active = false,
    portSide = 'none',
    portId,
    class: className = '',
    headerRight,
    children
  }: Props = $props();

  const accentColor = $derived({
    cyan: 'var(--ns-accent-primary)',
    magenta: 'var(--ns-accent-secondary)',
    green: 'var(--ns-accent-tertiary)',
    amber: 'var(--ns-accent-warning)'
  }[accent]);

  const registry = useCablePortRegistry();
  let panelEl: HTMLDivElement | null = $state(null);
  let portEl: HTMLDivElement | null = $state(null);
  let resizeObs: ResizeObserver | null = null;

  function remeasure() {
    if (!registry || !portEl || !portId || portSide === 'none') return;
    const container = $state.snapshot(registry.container) as unknown;
    // fall back: read container via subscribe-once
    let containerEl: HTMLElement | null = null;
    registry.container.subscribe((el) => (containerEl = el))();
    if (!containerEl) return;
    const { x, y } = measurePort(portEl, containerEl);
    registry.set({ id: portId, x, y, edge: portSide, accent, active });
  }

  $effect(() => {
    // Re-register on active/accent change so cable layer sees updates
    if (registry && portId && portSide !== 'none') remeasure();
  });

  onMount(() => {
    if (!registry || !portId || portSide === 'none') return;
    remeasure();
    resizeObs = new ResizeObserver(() => remeasure());
    if (panelEl) resizeObs.observe(panelEl);
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
  });

  onDestroy(() => {
    resizeObs?.disconnect();
    window.removeEventListener('resize', remeasure);
    window.removeEventListener('scroll', remeasure, true);
    if (registry && portId) registry.remove(portId);
  });
</script>

<div
  bind:this={panelEl}
  class={cn('ns-panel', className)}
  style="color: {accentColor};"
>
  <svg class="ns-bracket tl" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket tr" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket bl" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket br" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>

  {#if portSide !== 'none' && portId}
    <div bind:this={portEl} class="ns-port {portSide}" aria-hidden="true"></div>
  {/if}

  <div class="ns-panel-header" style="color: {accentColor};">
    <span class="ns-led {active ? 'pulse' : 'dim'}"></span>
    <span style="color: var(--ns-text-secondary);">{label}</span>
    {#if headerRight}
      <span class="ml-auto">{@render headerRight()}</span>
    {/if}
  </div>

  {@render children?.()}
</div>
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors. (Note: `$state.snapshot` on a store is inert — the subscribe-once pattern below it is what actually reads the container. If svelte-check flags an unused variable, delete the `const container = ...` line; keep only the subscribe-once fallback.)

- [ ] **Step 3: Simplify the remeasure fallback (clean up any warning)**

Replace the `remeasure` function body with:

```ts
function remeasure() {
  if (!registry || !portEl || !portId || portSide === 'none') return;
  let containerEl: HTMLElement | null = null;
  registry.container.subscribe((el) => (containerEl = el))();
  if (!containerEl) return;
  const { x, y } = measurePort(portEl, containerEl);
  registry.set({ id: portId, x, y, edge: portSide, accent, active });
}
```

Run: `npm run check` again. Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/PanelFrame.svelte
git commit -m "feat: PanelFrame component (brackets, LED header, edge port)"
```

---

## Task 4: CableLayer component

**Files:**
- Create: `src/lib/components/CableLayer.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
  import { useCablePortRegistry, type PortInfo, type PortEdge } from '$lib/utils/cablePorts';

  interface Connection {
    from: string;
    to: string;
  }

  interface Props {
    connections: Connection[];
  }

  let { connections }: Props = $props();

  const registry = useCablePortRegistry();
  const ports = registry?.ports;

  function edgeOffset(edge: PortEdge, dist: number): [number, number] {
    switch (edge) {
      case 'left':   return [-dist, 0];
      case 'right':  return [ dist, 0];
      case 'top':    return [0, -dist];
      case 'bottom': return [0,  dist];
    }
  }

  function accentToCss(a: PortInfo['accent']): string {
    return {
      cyan: 'var(--ns-accent-primary)',
      magenta: 'var(--ns-accent-secondary)',
      green: 'var(--ns-accent-tertiary)',
      amber: 'var(--ns-accent-warning)'
    }[a];
  }

  function buildPath(from: PortInfo, to: PortInfo): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.max(60, Math.hypot(dx, dy) * 0.4);
    const [fox, foy] = edgeOffset(from.edge, dist);
    const [tox, toy] = edgeOffset(to.edge, dist);
    const c1x = from.x + fox;
    const c1y = from.y + foy;
    const c2x = to.x + tox;
    const c2y = to.y + toy;
    return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
  }
</script>

{#if ports}
  <svg
    class="absolute inset-0 w-full h-full pointer-events-none cable-layer"
    style="z-index: 0;"
    aria-hidden="true"
  >
    {#each connections as conn (conn.from + '->' + conn.to)}
      {@const f = $ports[conn.from]}
      {@const t = $ports[conn.to]}
      {#if f && t}
        {@const active = f.active || t.active}
        {@const stroke = active ? accentToCss(f.accent) : 'rgba(90, 100, 140, 0.35)'}
        {@const path = buildPath(f, t)}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          stroke-width={active ? 2 : 1.5}
          stroke-linecap="round"
          style="filter: {active ? `drop-shadow(0 0 4px ${stroke})` : 'none'}; transition: stroke 0.3s, stroke-width 0.3s;"
        />
        {#if active}
          <path
            d={path}
            fill="none"
            stroke={stroke}
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="6 14"
            style="animation: ns-cable-flow 1.4s linear infinite; opacity: 0.85;"
          />
        {/if}
      {/if}
    {/each}
  </svg>

  <style>
    @media (max-width: 767px) { .cable-layer { display: none; } }
  </style>
{/if}
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/CableLayer.svelte
git commit -m "feat: CableLayer component (SVG patch cables with active-state flow)"
```

---

## Task 5: Visualizer overlays (crosshair + axis labels + radial vignette)

**Files:**
- Modify: `src/lib/components/Visualizer.svelte`

- [ ] **Step 1: Add radial vignette pass at the start of `drawBilateralWaveform`**

In `src/lib/components/Visualizer.svelte`, in the `drawBilateralWaveform` function, immediately after the opening `{`, BEFORE the existing `ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';` grid code, insert:

```ts
const rateNow = $currentRate;
const pulse = 0.6 + Math.sin(idlePhase * 2) * 0.4;
const glowAlpha = 0.10 * pulse;
const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.55);
vg.addColorStop(0, `rgba(34, 211, 238, ${glowAlpha.toFixed(3)})`);
vg.addColorStop(0.6, 'rgba(34, 211, 238, 0)');
vg.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = vg;
ctx.fillRect(0, 0, w, h);
idlePhase += 0.008 + rateNow * 0.002;
```

Then REMOVE the existing `idlePhase += 0.02;` line inside the `else` branch (the idle animation) since phase advance now happens above every frame. Keep the rest of the idle-branch math.

- [ ] **Step 2: Add crosshair + axis labels inside `drawBilateralWaveform`**

Locate the `// existing L/R corner brackets` area (the block drawing the little L-shaped corners at top-left/top-right starting with `ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';`). DIRECTLY ABOVE that block, insert:

```ts
ctx.save();
ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
ctx.lineWidth = 1;
ctx.setLineDash([4, 6]);
ctx.beginPath();
ctx.moveTo(0, h / 2); ctx.lineTo(w / 2 - 18, h / 2);
ctx.moveTo(w / 2 + 18, h / 2); ctx.lineTo(w, h / 2);
ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h / 2 - 18);
ctx.moveTo(w / 2, h / 2 + 18); ctx.lineTo(w / 2, h);
ctx.stroke();
ctx.restore();

ctx.font = '9px Inter, system-ui, sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
ctx.fillText('DEPTH', w / 2, 12);
ctx.fillText('RATE',  w / 2, h - 6);
ctx.textAlign = 'left';
ctx.fillStyle = 'rgba(232, 121, 249, 0.35)';
ctx.fillText('A / L', 6, h / 2 + 3);
ctx.textAlign = 'right';
ctx.fillText('B / R', w - 6, h / 2 + 3);
```

- [ ] **Step 3: Verify build + visual**

Run: `npm run check`
Expected: no errors.

Reload dev server in browser. Expected: the main visualizer now has a dashed crosshair with `DEPTH`/`RATE` labels on vertical ends and `A / L` / `B / R` on horizontal ends. A soft cyan radial glow pulses behind the waveform, visible both idle and playing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Visualizer.svelte
git commit -m "feat(visualizer): crosshair overlay, axis labels, pulsing radial vignette"
```

---

## Task 6: Knob chrome ring + hard ticks + value pill

**Files:**
- Modify: `src/lib/components/Knob.svelte`

- [ ] **Step 1: Add 12 hard tick marks + outer chrome ring**

In `src/lib/components/Knob.svelte`, replace the `<svg>` block (lines 128–180 in the current file) with this:

```svelte
<svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style="overflow: visible;">
  <!-- Outer chrome ring -->
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#knob-chrome-{color})" stroke-width="1.25" opacity="0.7" />

  <!-- 12 hard ticks at 30deg increments, -150..+180 -->
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

  <!-- Inner track (original dashed arc removed in favor of smooth arc) -->
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
```

Remove the now-unused `tickAngles` constant (line ~95).

- [ ] **Step 2: Add dragging value pill**

After the closing `</div>` of the knob body div (the one ending just before `{#if unit}`), insert:

```svelte
{#if dragging}
  <div
    class="absolute pointer-events-none rounded-md px-2 py-0.5 text-[10px] font-bold"
    style="
      bottom: -22px; left: 50%; transform: translateX(-50%);
      background: rgba(13,13,18,0.95);
      border: 1px solid {colors.primary};
      color: {colors.primary};
      box-shadow: 0 0 8px {colors.glow};
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      z-index: 10;
    "
  >
    {localValue.toFixed(step < 1 ? (step < 0.01 ? 3 : 2) : 0)}{unit}
  </div>
{/if}
```

- [ ] **Step 3: Verify**

Run: `npm run check`
Expected: no errors.

In the browser, drag any knob. Expected: a floating pill appears below the knob showing the value + unit, disappears on release. Twelve evenly-spaced tick rectangles light up from left to current value.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Knob.svelte
git commit -m "feat(knob): chrome outer ring, 12 hard ticks, drag value pill"
```

---

## Task 7: Fader channel tag + grip handle + segmented meter

**Files:**
- Modify: `src/lib/components/Fader.svelte`

- [ ] **Step 1: Add channel tag above the track**

In `src/lib/components/Fader.svelte`, directly after the opening `{#if label}` block (currently rendering the uppercase label), insert — after the existing `<span>...</span>` closing tag and before `<div class="flex items-end gap-1">` — this block:

```svelte
{#if channel}
  <span
    class="px-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
    style="background: {colors.dark}; color: {colors.primary}; box-shadow: 0 0 4px {colors.glow};"
  >
    {channel === 'left' ? 'L' : 'R'}
  </span>
{/if}
```

- [ ] **Step 2: Replace the smooth meter fill with 24 segments**

Locate the level-meter bar (the `<div class="w-1.5 h-40 ...">` containing the `<div class="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75" style="height: {levelPct}%; ...">` fill). Replace that inner fill div with:

```svelte
{#each Array.from({ length: 24 }, (_, i) => i) as idx}
  {@const segBottom = (idx / 24) * 100}
  {@const segTop = ((idx + 1) / 24) * 100}
  {@const lit = levelPct >= segTop - 2}
  {@const warn = idx >= 21}
  {@const segColor = !lit ? 'rgba(255,255,255,0.04)' : warn ? (idx === 23 ? '#ef4444' : '#fbbf24') : colors.primary}
  <div
    class="absolute left-0 right-0"
    style="
      bottom: {segBottom}%;
      height: calc({100 / 24}% - 1px);
      background: {segColor};
      box-shadow: {lit ? `0 0 3px ${segColor}` : 'none'};
      opacity: {lit ? 1 : 1};
    "
  ></div>
{/each}
```

- [ ] **Step 3: Add grip cap to handle**

Locate the handle div (`<div class="absolute left-0.5 right-0.5 h-5 rounded transition-transform duration-75" ...>`). Inside it, DIRECTLY BEFORE the existing `<!-- Handle illuminated center line -->` comment/div, insert:

```svelte
<div class="absolute left-1 right-1 top-0.5 flex flex-col gap-0.5" aria-hidden="true">
  <div class="h-px" style="background: rgba(255,255,255,0.25);"></div>
  <div class="h-px" style="background: rgba(255,255,255,0.18);"></div>
  <div class="h-px" style="background: rgba(255,255,255,0.12);"></div>
</div>
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: no errors.

Browser: the stereo faders now show an `L` or `R` accent pill above each, the meter bar renders as stacked LED segments (dim base, top-3 amber/red), and the handle shows three horizontal grip lines.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Fader.svelte
git commit -m "feat(fader): channel pill, 24-segment LED meter, grip-capped handle"
```

---

## Task 8: PresetButton bevel + left-edge port dot

**Files:**
- Modify: `src/lib/components/PresetButton.svelte`

- [ ] **Step 1: Add inner bevel + left-edge port dot**

In `src/lib/components/PresetButton.svelte`, update the `<button>` inline `style=""` to add an inset highlight. Replace the current `style="..."` content on the button with:

```svelte
style="
  background: {active ? cv.bg15 : 'var(--ns-bg-surface)'};
  border-color: {active ? cv.primary : 'var(--ns-border)'};
  color: {active ? cv.primary : 'var(--ns-text-secondary)'};
  box-shadow: {active
    ? `0 0 12px ${cv.glow}, inset 0 0 12px ${cv.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
    : 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.3)'};
"
```

Then, DIRECTLY AFTER the button opening tag and BEFORE `{#if active}...dot indicator`, insert:

```svelte
<span
  aria-hidden="true"
  class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
  style="background: {active ? cv.primary : 'rgba(120,130,160,0.35)'}; box-shadow: {active ? `0 0 4px ${cv.glow}` : 'none'};"
></span>
```

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: no errors.

Browser: every preset button has a small port-dot on its left edge; dot and button glow share accent color; inactive buttons show a subtle bevel.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/PresetButton.svelte
git commit -m "feat(preset): bevel shadow + left-edge port dot"
```

---

## Task 9: App.svelte regrid into 3-column layout with PanelFrame + CableLayer

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Add imports and initialize registry at top of script block**

In `src/App.svelte`, under the existing imports, add:

```ts
import PanelFrame from '$lib/components/PanelFrame.svelte';
import CableLayer from '$lib/components/CableLayer.svelte';
import { createCablePortRegistry } from '$lib/utils/cablePorts';

const cableRegistry = createCablePortRegistry();
let cableLayerContainer: HTMLDivElement | null = $state(null);
$effect(() => {
  cableRegistry.container.set(cableLayerContainer);
});

const connections = [
  { from: 'pattern',        to: 'field-left' },
  { from: 'rate',           to: 'field-left' },
  { from: 'carriers',       to: 'field-left' },
  { from: 'envelope',       to: 'field-right' },
  { from: 'stereo',         to: 'field-right' },
  { from: 'export',         to: 'field-right' },
  { from: 'sample-library', to: 'field-bottom' }
];
```

- [ ] **Step 2: Replace the `<section>` visualizer strip + `<main>` grid**

Replace the existing block (from the `<section class="relative" style="height: 40vh; ...">` line through the closing `</section>` of the stereo panel — roughly lines 356–606 in the current file) with:

```svelte
<main class="max-w-[1800px] mx-auto px-6 py-6">
  <div bind:this={cableLayerContainer} class="relative">
    <CableLayer {connections} />

    <div class="grid gap-4 relative"
         style="grid-template-columns: minmax(220px, 1fr) minmax(480px, 2.2fr) minmax(220px, 1fr);">

      <!-- LEFT STACK -->
      <div class="flex flex-col gap-4">
        <PanelFrame label="Pattern" accent="cyan" active={isInitialized}
                    portSide="right" portId="pattern">
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
        </PanelFrame>

        <PanelFrame label="Rate" accent="magenta" active={isInitialized}
                    portSide="right" portId="rate">
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
            <input type="range" min="0.5" max="30" step="0.1"
                   bind:value={$rateValue}
                   oninput={(e: Event) => setRate(parseFloat((e.target as HTMLInputElement).value))}
                   class="w-full" />
          </div>
        </PanelFrame>

        <PanelFrame label="Carriers" accent="cyan"
                    active={isInitialized && $activeCarriers.length > 0}
                    portSide="right" portId="carriers">
          <div class="space-y-3">
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Waves</span>
              <div class="flex flex-wrap gap-1.5 mt-1">
                {#each ['sine','square','sawtooth','triangle'] as type}
                  <PresetButton
                    label={type === 'sine' ? 'Sine' : type === 'square' ? 'Square' : type === 'sawtooth' ? 'Saw' : 'Tri'}
                    active={$activeCarriers.includes(type as CarrierType)}
                    color="cyan" size="sm"
                    onClick={() => setCarrier(type as CarrierType)} />
                {/each}
              </div>
            </div>
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Noise</span>
              <div class="flex flex-wrap gap-1.5 mt-1">
                {#each ['white-noise','pink','brown','bandlimited'] as type}
                  <PresetButton
                    label={type === 'white-noise' ? 'White' : type === 'pink' ? 'Pink' : type === 'brown' ? 'Brown' : 'B.Lim'}
                    active={$activeCarriers.includes(type as CarrierType)}
                    color="magenta" size="sm"
                    onClick={() => setCarrier(type as CarrierType)} />
                {/each}
              </div>
            </div>
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Sample</span>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <PresetButton
                  label="Sound Sample"
                  active={$activeCarriers.includes('sample')}
                  color="green" size="sm"
                  onClick={() => setCarrier('sample')} />
              </div>
            </div>
          </div>

          {#if $activeCarriers.some((c: CarrierType) => ['sine','square','sawtooth','triangle'].includes(c))}
            <div class="mt-3 pt-3 flex items-center gap-4" style="border-top: 1px solid var(--ns-border);">
              <Knob label="Freq" value={$carrierFreq} min={100} max={2000} step={10}
                    unit="Hz" size="md" color="cyan" onInput={(v: number) => setCarrierFreq(v)} />
            </div>
          {/if}
          {#if $activeCarriers.includes('bandlimited')}
            <div class="mt-3 pt-3 flex items-center gap-4" style="border-top: 1px solid var(--ns-border);">
              <Knob label="Cutoff" value={$carrierFreq} min={100} max={5000} step={50}
                    unit="Hz" size="md" color="cyan" onInput={(v: number) => setCarrierFreq(v)} />
            </div>
          {/if}
        </PanelFrame>
      </div>

      <!-- CENTERPIECE -->
      <PanelFrame label="Bilateral Field" accent="cyan" active={$isPlaying}
                  portSide="none" class="flex flex-col">
        <!-- Virtual ports for cable anchors on the field frame -->
        <div class="relative flex-1 min-h-[520px]">
          <div class="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
               style="background: radial-gradient(circle, var(--ns-bg-deep) 40%, var(--ns-accent-primary) 42%, var(--ns-accent-primary) 60%, transparent 62%);"
               bind:this={fieldLeftPortEl}></div>
          <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
               style="background: radial-gradient(circle, var(--ns-bg-deep) 40%, var(--ns-accent-primary) 42%, var(--ns-accent-primary) 60%, transparent 62%);"
               bind:this={fieldRightPortEl}></div>
          <div class="absolute left-1/2 -translate-x-1/2 bottom-0 w-3 h-3 rounded-full pointer-events-none"
               style="background: radial-gradient(circle, var(--ns-bg-deep) 40%, var(--ns-accent-tertiary) 42%, var(--ns-accent-tertiary) 60%, transparent 62%);"
               bind:this={fieldBottomPortEl}></div>

          <Visualizer canvasId="bilateral-main" type="bilateral"
                      width={1200} height={520} class="w-full h-full" />
        </div>

        {#if $activeCarriers.includes('sample')}
          <div class="mt-3 pt-3" style="border-top: 1px solid var(--ns-border);">
            <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--ns-text-dim);">Select Sound</span>
            <div class="grid grid-cols-3 gap-1.5 mt-1.5 max-h-40 overflow-y-auto" id="sample-library-inline">
              {#each soundLibrary as entry}
                <button
                  class="text-left px-2 py-1.5 rounded-lg border transition-all text-[10px]"
                  style="
                    background: {$selectedSampleId === entry.id ? 'rgba(52, 211, 153, 0.15)' : 'var(--ns-bg-surface)'};
                    border-color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-border)'};
                    color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-text-secondary)'};
                    box-shadow: {$selectedSampleId === entry.id ? '0 0 8px rgba(52, 211, 153, 0.3)' : 'none'};
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
      </PanelFrame>

      <!-- RIGHT STACK -->
      <div class="flex flex-col gap-4">
        <PanelFrame label="Envelope" accent="green" active={isInitialized}
                    portSide="left" portId="envelope">
          <div class="flex justify-around">
            <Knob label="Attack" value={$attackTime} min={0.001} max={0.5} step={0.001}
                  unit="s" size="md" color="green"
                  onInput={(v: number) => updateEnvelope({ attack: v })} />
            <Knob label="Decay" value={$decayTime} min={0.01} max={1.0} step={0.01}
                  unit="s" size="md" color="cyan"
                  onInput={(v: number) => updateEnvelope({ decay: v })} />
            <Knob label="Duty" value={$dutyCycle} min={0.1} max={0.9} step={0.05}
                  size="md" color="magenta"
                  onInput={(v: number) => updateEnvelope({ dutyCycle: v })} />
          </div>
        </PanelFrame>

        <PanelFrame label="Stereo" accent="cyan" active={$isPlaying}
                    portSide="left" portId="stereo">
          <div class="flex justify-center gap-6">
            <Fader label="Left"  value={$leftGain}  min={0} max={1} step={0.01}
                   color="cyan"    channel="left"  onInput={(v: number) => setLeftGain(v)} />
            <Fader label="Right" value={$rightGain} min={0} max={1} step={0.01}
                   color="magenta" channel="right" onInput={(v: number) => setRightGain(v)} />
          </div>
        </PanelFrame>

        <PanelFrame label="Export" accent="amber" active={isExporting}
                    portSide="left" portId="export">
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <select value={$exportDuration}
                      onchange={(e: Event) => exportDuration.set(Number((e.target as HTMLSelectElement).value))}>
                <option value={30}>30s</option>
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
                <option value={300}>5 min</option>
                <option value={600}>10 min</option>
              </select>
              <select value={$exportBitDepth}
                      onchange={(e: Event) => exportBitDepth.set(Number((e.target as HTMLSelectElement).value) as 16 | 24)}>
                <option value={16}>16-bit</option>
                <option value={24}>24-bit</option>
              </select>
            </div>
            <button
              class="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all hover:scale-105"
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
          </div>
        </PanelFrame>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Register the three virtual field ports**

Add these variable declarations in the `<script>` block alongside `cableLayerContainer`:

```ts
let fieldLeftPortEl: HTMLDivElement | null = $state(null);
let fieldRightPortEl: HTMLDivElement | null = $state(null);
let fieldBottomPortEl: HTMLDivElement | null = $state(null);
```

And add an effect that registers/updates them against the registry whenever `$isPlaying` or layout changes:

```ts
import { onMount, onDestroy, tick } from 'svelte';
import { measurePort } from '$lib/utils/cablePorts';

function registerFieldPorts() {
  if (!cableLayerContainer) return;
  const pairs: Array<[HTMLDivElement | null, string, 'left'|'right'|'bottom', 'cyan'|'green']> = [
    [fieldLeftPortEl,   'field-left',   'left',   'cyan'],
    [fieldRightPortEl,  'field-right',  'right',  'cyan'],
    [fieldBottomPortEl, 'field-bottom', 'bottom', 'green']
  ];
  for (const [el, id, edge, accent] of pairs) {
    if (!el) continue;
    const { x, y } = measurePort(el, cableLayerContainer);
    cableRegistry.set({ id, x, y, edge, accent, active: $isPlaying });
  }
}

$effect(() => {
  // re-run on any reactive trigger
  void $isPlaying;
  void $activeCarriers;
  tick().then(registerFieldPorts);
});

onMount(() => {
  const ro = new ResizeObserver(() => registerFieldPorts());
  if (cableLayerContainer) ro.observe(cableLayerContainer);
  window.addEventListener('resize', registerFieldPorts);
  window.addEventListener('scroll', registerFieldPorts, true);
  return () => {
    ro.disconnect();
    window.removeEventListener('resize', registerFieldPorts);
    window.removeEventListener('scroll', registerFieldPorts, true);
  };
});
```

(Delete the existing empty `onDestroy(() => { if (visualizerAnimationId !== null) cancelAnimationFrame(visualizerAnimationId); });` and replace with the consolidated logic above — keep the cancelAnimationFrame inside the returned cleanup.)

- [ ] **Step 4: Add sample library strip below the grid**

Directly after the closing `</div>` of the grid container (and still inside `<main>`, before the existing `<section class="ns-panel mt-4 flex items-center gap-4">` Export section — which you should DELETE since Export moved inside the right stack), insert:

```svelte
<div class="mt-4">
  <PanelFrame label="Sample Library" accent="green"
              active={$activeCarriers.includes('sample')}
              portSide="top" portId="sample-library">
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
      {#each soundLibrary as entry}
        <button
          class="text-left px-2 py-1.5 rounded-lg border transition-all text-[10px]"
          style="
            background: {$selectedSampleId === entry.id ? 'rgba(52, 211, 153, 0.15)' : 'var(--ns-bg-surface)'};
            border-color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-border)'};
            color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-text-secondary)'};
            box-shadow: {$selectedSampleId === entry.id ? '0 0 8px rgba(52, 211, 153, 0.3)' : 'none'};
          "
          onclick={() => loadSample(entry.id)}
          disabled={isLoadingSample}
        >
          <div class="font-semibold">{entry.label}</div>
        </button>
      {/each}
    </div>
  </PanelFrame>
</div>
```

Also delete the duplicate inline sample list inside the Bilateral Field PanelFrame (the `{#if $activeCarriers.includes('sample')}` block inside it) — the bottom strip replaces it.

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Manual QA in browser**

Run: `npm run dev` and open the page.

Verify:
1. Three-column layout renders at desktop width: Pattern/Rate/Carriers left, Bilateral Field center (large), Envelope/Stereo/Export right.
2. Each panel shows 4 corner brackets in its accent color, an LED in the header, a port dot on its centerpiece-facing edge.
3. Cables render: dim indigo when idle, lighting up accent-colored with flowing dashes when playing. Cables route from each left/right panel into the field's side ports, and the Sample Library strip cable runs up into the field's bottom port.
4. Resizing the window (drag from 1400 → 900 → 600 → 400 px) reroutes cables without leaving orphans. Below 768px the cable layer hides and content stacks in a single column.
5. Every existing control still works (carrier toggles, knob drag, fader drag, rate slider, export dropdowns, sample select, WAV export).

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte
git commit -m "feat(layout): 3-column Bilateral Field grid with cable-wired PanelFrames"
```

---

## Task 10: Final visual polish + verification pass

**Files:**
- Modify: `src/App.svelte` (header LED), `src/app.css` if tweaks needed

- [ ] **Step 1: Add initialization LED to header**

In `src/App.svelte`, in the header wordmark block, wrap the NEONSYNTH heading with an LED:

Replace:
```svelte
<h1 class="text-lg font-extrabold uppercase tracking-widest bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] bg-clip-text text-transparent">
  NEONSYNTH
</h1>
```

With:
```svelte
<div class="flex items-center gap-3" style="color: var(--ns-accent-primary);">
  <span class="ns-led {isInitialized ? ($isPlaying ? 'pulse' : '') : 'dim'}"></span>
  <h1 class="text-lg font-extrabold uppercase tracking-widest bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] bg-clip-text text-transparent">
    NEONSYNTH
  </h1>
</div>
```

- [ ] **Step 2: Full verification pass**

Run: `npm run check`
Expected: 0 errors.

Run: `npm run build`
Expected: build succeeds.

Browser QA checklist (open in Chrome/Firefox at 1440×900):
- [ ] Page loads, init overlay shows, click dismisses and header LED lights.
- [ ] Press play — header LED pulses, field-edge cables all light, dash-flow animates.
- [ ] Toggle every carrier — Carriers cable stays lit whenever ≥1 carrier active.
- [ ] Select sample — Sample Library cable lights green with flow.
- [ ] Drag every knob — value pill appears, reverts on release.
- [ ] Drag both faders — segmented meter animates with audio level, L/R pills visible.
- [ ] Export a 30s WAV — Export panel LED pulses amber, file downloads.
- [ ] Resize to 800px width — layout holds, cables reroute.
- [ ] Resize to 480px width — single-column stack, cables hidden, everything reachable.
- [ ] Stop playback — cables dim back to indigo, animations stop.

- [ ] **Step 3: Commit final polish**

```bash
git add src/App.svelte
git commit -m "polish: initialization LED in header, playing pulse"
```
