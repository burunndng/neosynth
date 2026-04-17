# NeonSynth UI Reskin — "Bilateral Field" (Option C)

**Date:** 2026-04-17
**Status:** Draft — awaiting LO review
**Scope:** Pure visual reskin. No audio engine changes, no control-flow changes, no store changes.

## Goal

Transform the current flat 5-column grid into a centerpiece-driven control surface inspired by Zynaptiq Morph Pro: a framed signal-field module in the middle, satellite modules flanking it, and SVG "cable" traces wiring everything together. The aesthetic target is deep-indigo circuit board with cyan/magenta neon, inset glass panels with corner brackets, per-module power LEDs, and chrome-ringed controls.

## Non-Goals

- No changes to `AudioEngine.ts` or any store in `audioStore.ts`.
- No changes to signal paths, preset values, or keyboard shortcuts (none exist).
- No new audio features, new carriers, or new patterns.
- No accessibility regressions (maintain existing aria attributes on slider/dialog roles).

## Target Layout

Desktop (≥1100px):

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (unchanged: wordmark + play / upload / info)            │
├─────────────┬──────────────────────────────┬────────────────────┤
│  PATTERN    │                              │  ENVELOPE          │
├─────────────┤                              ├────────────────────┤
│  RATE       │      BILATERAL  FIELD        │  STEREO            │
│             │      (centerpiece)           │                    │
├─────────────┤                              ├────────────────────┤
│  CARRIERS   │                              │  EXPORT            │
└─────────────┴──────────────────────────────┴────────────────────┘
│               SAMPLE LIBRARY STRIP (full-width)                 │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER (unchanged)                                             │
└─────────────────────────────────────────────────────────────────┘
```

Grid: `grid-template-columns: minmax(220px, 1fr) minmax(480px, 2.2fr) minmax(220px, 1fr)`. Left and right columns stack three panels vertically. Center column is a single tall panel (the Field).

Tablet (768–1099px): collapses to two columns (left stack | center, right stack below center). Sample library stays full-width.

Mobile (<768px): single column in order: Field → Pattern → Rate → Carriers → Envelope → Stereo → Export → Sample Library. Cables hidden (display: none) on mobile.

## Centerpiece — "BILATERAL FIELD"

A large framed module that replaces the current top-strip visualizer. Internals:

1. **Frame:** 4 thin L-shaped corner brackets in cyan, 1px accent underline on the header.
2. **Header row:** power LED (top-left, steady glow when initialized, pulsing cyan when playing) · etched "BILATERAL FIELD" label · rate readout (big tabular-nums, gradient-filled, right-aligned).
3. **Glass surface:** existing `Visualizer` canvas sized to fill, rendered with added overlays:
   - **Crosshair** at center, faint cyan, with small gap at center point.
   - **Axis labels** rendered on the canvas (not DOM): `L` / `R` on horizontal ends, `DEPTH` / `RATE` on vertical ends, all 10px uppercase, low-opacity accent-colored.
   - **Radial vignette** behind the signal: `radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)` drawn as the first layer each frame. Its alpha pulses on the current rate (sin-driven, hooked to `currentRate` store).
4. **Port dots:** 4 ports on the frame edge (left-middle, right-middle, top-middle, bottom-middle) — small filled circles with concentric rings, aria-hidden. These are the cable-connection anchors.

Existing canvas drawing code in `Visualizer.svelte` stays; the crosshair + axis labels + radial vignette are new drawing passes added before/after the existing passes.

## Satellite Panel Chrome

New reusable component `PanelFrame.svelte` wraps every satellite and the centerpiece. Props:

- `label: string` — uppercase header text
- `accent: 'cyan' | 'magenta' | 'green' | 'amber'`
- `active?: boolean` — controls LED glow intensity
- `portSide?: 'left' | 'right' | 'top' | 'bottom' | 'none'` — which edge exposes the cable port
- `portId?: string` — unique id registered with the cable layer

Renders:

- **Corner brackets:** 4 absolutely-positioned SVG L-shapes, 10px each, `stroke: currentColor` driven by accent, faint drop-shadow glow.
- **Header row:** power LED (6px dot with layered box-shadow glow, dim when `!active`, bright pulse when `active`) · uppercase label (12px, tracking-widest, `color: var(--ns-text-secondary)`) · 1px hairline underline using the accent color at 40% alpha with a 4px blur glow.
- **Body:** `<slot />` for the control contents. Padding `20px`.
- **Background:** layered —
  - Base: `linear-gradient(180deg, #0e0f1a 0%, #0a0b14 100%)`
  - Inner top highlight: `inset 0 1px 0 rgba(255,255,255,0.05)`
  - Inner bottom shadow: `inset 0 -1px 0 rgba(0,0,0,0.6)`
  - Grain: a CSS-only `::before` with SVG-encoded fractal noise at 3% opacity
  - Radial accent wash (very subtle): `radial-gradient(circle at 50% 0%, <accent-20%> 0%, transparent 60%)` on the `::after`.
- **Port dot:** registers position with `CableLayer` via an exported context store on mount; renders a visual port (outer ring + inner filled dot) on the specified edge, vertically/horizontally centered.

## Cable Layer

New component `CableLayer.svelte`, absolutely positioned over the main grid area, `z-index: 0`, `pointer-events: none`, spans full main content width and height. Implementation:

1. A Svelte context (`cablePortContext`) is created at `App.svelte` and provides a Svelte store containing a map of `portId -> { x, y, edge, accent, active }`. Each `PanelFrame` on mount measures its port's bounding rect relative to the cable-layer container and writes to the store; it updates on `ResizeObserver` ticks for the layer container and on window resize.
2. `CableLayer` subscribes to the store and to a registry of connections. Connections are declared statically in `App.svelte` (e.g. `{ from: 'pattern', to: 'field-left' }`). The centerpiece exposes four virtual port ids (`field-left`, `field-right`, `field-top`, `field-bottom`).
3. For each connection, the layer renders a cubic-bezier `<path>` with control points extending perpendicular from each endpoint's edge (length = 40% of the straight-line distance), producing smooth routing reminiscent of hardware patch cables.
4. Cable styling:
   - Inactive: `stroke: rgba(90, 100, 140, 0.35)`, `stroke-width: 1.5`, no glow.
   - Active: `stroke: <accent>`, `stroke-width: 2`, `filter: drop-shadow(0 0 4px <accent-glow>)`, plus an animated dash overlay `stroke-dasharray: 6 14; stroke-dashoffset` animated via CSS `@keyframes` when `$isPlaying`.
5. Active/inactive per-connection is derived from what that module represents (e.g., Pattern is always active once initialized; a Carriers cable is active when `$activeCarriers.length > 0`; the Sample cable is active when `$activeCarriers.includes('sample')`).

Connection map (v1):

- `pattern` → `field-left`
- `rate` → `field-left`
- `carriers` → `field-left`
- `envelope` → `field-right`
- `stereo` → `field-right`
- `export` → `field-right`
- `sample-library` → `field-bottom`

The two stacks share left/right anchor points so cables fan into the field like a patchbay rather than each having a dedicated port.

## Control Upgrades

### Knob.svelte

Current render has tick dashes + an arc gauge + an inner disc with indicator line. Additions:

- **Chrome outer ring** behind the tick arc: an extra `<circle>` with `stroke: url(#knob-chrome)` where `#knob-chrome` is a conic-gradient-style bevel approximated as a `<linearGradient>` from `#3a3a4a` → `#1a1a2e` → `#3a3a4a`, creating a two-tone bevel.
- **Larger, sharper ticks** at every 30° (12 ticks) in addition to the existing 10-step dashed arc — 2px filled rects rather than dashed strokes, colored dim when below current value, accent when at/below.
- **Value pill:** a floating rounded-rect label `8px` below the knob, appearing only while `dragging`, showing `{value}{unit}`. 11px tabular-nums, pill background `rgba(13,13,18,0.95)` with accent border.

Existing indicator line, centered value, and drag logic unchanged.

### Fader.svelte

Additions:

- **Channel tag:** small uppercase `L` or `R` pill above the track (replaces/augments the `label` for stereo). Accent-tinted, 9px.
- **Metal cap on handle:** extend the existing handle to 7px tall, add a second narrow rect on top simulating a grip cap (3 horizontal grip lines, 1px each, 60% opacity white).
- **LED-segment meter:** replace the current smooth gradient fill in the level meter bar with 24 stacked 1px segments separated by 1px gaps; segments below `levelPct` light; top 3 segments render amber→red. Existing `levelPct` math unchanged.

### PresetButton.svelte

No structural changes. Only tune active-state glow (slightly stronger box-shadow) and add a 1px inner highlight for bevel feel. Inactive state gets a subtle cable-port dot on the left edge to echo the patch-cable theme.

## Palette Tweak

Edit `src/app.css` variables:

- `--ns-bg-deep: #070912` (was `#08080c`) — slight indigo tint
- `--ns-bg-panel: #0c0d18` (was `#0d0d12`)
- `--ns-bg-surface: #14151f` (was `#16161e`)
- `--ns-accent-secondary: #d668e8` (was `#e879f9`) — desaturated toward "wire blue" pink
- Add `--ns-bg-field-glow: rgba(34, 211, 238, 0.08)` for the centerpiece radial wash.
- Add `--ns-grain-url` with inline SVG fractal noise, used by `.ns-panel::before`.

Amber warning color unchanged.

## Header & Intro Screen

- **Header:** unchanged structure; restyled play button with subtle bevel and a thin cyan ring on hover. Add a small "INITIALIZED" LED to the left of the wordmark (echo of per-panel LEDs) that lights when `isInitialized`.
- **Intro "click to initialize" overlay:** add a faint animated cable-board background (3–5 static SVG bezier curves drifting slowly) behind the wordmark.

## File Touch List

**Modified:**
- `src/App.svelte` — regrid, wire in `PanelFrame` and `CableLayer`, move visualizer into field module, declare connection map
- `src/app.css` — palette vars, grain data URL, `.ns-panel` becomes alias for `PanelFrame` output (keep class for legacy), new `.ns-bracket`, `.ns-port` utilities
- `src/lib/components/Visualizer.svelte` — add crosshair, axis labels, radial vignette passes
- `src/lib/components/Knob.svelte` — chrome ring, 12 hard ticks, value pill
- `src/lib/components/Fader.svelte` — channel tag, capped handle, segmented meter
- `src/lib/components/PresetButton.svelte` — bevel + port-dot tweaks

**New:**
- `src/lib/components/PanelFrame.svelte` — reusable panel shell (brackets, header, LED, port)
- `src/lib/components/CableLayer.svelte` — SVG cable renderer + port registry
- `src/lib/utils/cablePorts.ts` — Svelte context + store for port registration

## Testing / Verification

Manual QA on the dev server:

1. `npm run dev`, open in browser. Click-to-initialize still works; LED lights.
2. Play toggle: all "active" cables light up with flowing dashes; idle cables stay dim.
3. Toggle each carrier: the Carriers cable intensity and color respond.
4. Select a sample: the Sample cable lights.
5. Resize window between 1400px / 1000px / 800px / 500px — cables re-route correctly, no overlap with panels, no layout thrash.
6. Drag every knob/fader — value pill appears, pointer capture still works, double-click-reset still works.
7. Export a WAV — button state and amber glow transition correctly.
8. Check Lighthouse/perf: cable `requestAnimationFrame` avoided — use CSS animation only for the dash flow; JS only updates port positions on resize.
9. Run `npm run check` (svelte-check) — no new type errors.
10. Confirm no regressions in existing canvas visualizer drawing (trails, spectrum strip, meters).

## Risks & Mitigations

- **Port-position drift:** resize/layout changes could leave cables pointing to stale coordinates. Mitigation: `ResizeObserver` on the cable-layer container re-measures all ports on any size change; each `PanelFrame` also re-measures on its own resize.
- **Grain texture perf:** SVG fractal noise at full size is expensive. Mitigation: encode a single 128×128 tile at build time, tile with `background-repeat` at 3% opacity.
- **Cable visual clutter at mobile widths:** Mitigation: `CableLayer` hidden below 768px via CSS.
- **Palette shift breaking existing accent tints:** the magenta desaturation is minor; visually verify against existing gradients (play button, rate readout) and adjust if contrast drops.

## Out of Scope (tracked for later)

- Draggable/user-configurable cable routing
- Preset save/load UI themed to match
- A/B theme toggle (light variant, alt accent)
- Animated "signal packet" dots traveling along cables (easy future add — same CSS dash trick)
