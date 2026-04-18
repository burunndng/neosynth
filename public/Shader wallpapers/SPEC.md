# NeoSynth — Bilateral Field Reskin · Component Spec

Handoff document for porting `index.html` mockup → live Svelte 5 codebase.
Aesthetic: Output Portal × Process Audio restraint. Near-black surfaces, single cyan accent, soft glow, hairline circuit traces (no patch cables).

---

## 1. Design tokens (`src/app.css`)

Replace existing `:root` with:

```css
:root {
  color-scheme: dark;

  /* Surfaces — graded near-black */
  --bg-deep:     #06070b;
  --bg-stage:    #0a0c11;
  --bg-panel:    #0e1016;
  --bg-surface:  #14171f;
  --bg-recess:   #05060a;

  /* Hairlines */
  --line:        rgba(255, 255, 255, 0.055);
  --line-bright: rgba(255, 255, 255, 0.10);
  --line-deep:   rgba(0, 0, 0, 0.55);

  /* Type */
  --fg:   #e9edf2;
  --fg-2: #a3acb9;
  --fg-3: #6b7585;
  --fg-4: #3f4856;

  /* Single accent — refined cyan */
  --acc:       oklch(78% 0.115 205);
  --acc-soft:  oklch(78% 0.115 205 / 0.18);
  --acc-faint: oklch(78% 0.115 205 / 0.08);
  --acc-glow:  oklch(78% 0.115 205 / 0.35);
  --acc-dim:   oklch(58% 0.06 205);

  /* Reserved — export warning only */
  --warn:      oklch(74% 0.13 65);
  --warn-glow: oklch(74% 0.13 65 / 0.35);

  --r-lg: 14px; --r-md: 10px; --r-sm: 6px;
  --gap:  18px;

  --grain: 0.045; /* tweakable */

  --font-ui:   'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Add Google Fonts import at top:
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Drop** the existing magenta/green/amber accent palette — single accent system. Keep `--warn` only for export "rendering" state.

---

## 2. Layout

3-column grid as in spec:

```css
.layout {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(560px, 2.4fr) minmax(240px, 1fr);
  gap: var(--gap);
  position: relative;
}
```

Left col: Pattern · Rate · Carriers (stacked).
Center col: Bilateral Field (full height).
Right col: Envelope · Stereo · Export (stacked).
Below grid (full width): Sample Library, then Footer.

Breakpoints:
- ≤1100px → 2 col, center moves to top, right stack flows below.
- ≤720px → single col; hide hairline traces.

---

## 3. `PanelFrame.svelte` (new)

Reusable shell. Props:
```ts
{ label: string; meta?: string; active?: boolean; pulse?: boolean;
  ports?: ('l'|'r'|'t'|'b')[]; class?: string }
```

Render structure:
```html
<section class="panel">
  <div class="bracket tl"><CornerSvg/></div> <!-- repeat tr/bl/br -->
  {#each ports as p}<div class="port {p}"></div>{/each}
  <header class="panel-header">
    <span class="led" class:dim={!active} class:pulse={pulse}></span>
    <h2 class="panel-title">{label}</h2>
    {#if meta}<span class="panel-meta">{meta}</span>{/if}
  </header>
  <div class="panel-body"><slot/></div>
</section>
```

CSS recipe (panel base + corner brackets + accent wash + edge ports) is in `styles.css` of the mockup, sections "Panel" through "Edge ports".

**Corner bracket SVG** (12×12, stroke `currentColor`, opacity 0.55, drop-shadow):
```svg
<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2">
  <path d="M0 4V0h4"/>
</svg>
```
Position absolute in 4 corners; flip with `transform: scaleX(-1)` etc.

---

## 4. `Knob.svelte` (refactor)

Per question: **knob style 0** (dark disc + arc gauge + needle).

```html
<div class="knob">
  <div class="knob-dial">
    <svg viewBox="0 0 100 100">
      <!-- track -->
      <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1d27" stroke-width="6"/>
      <!-- value arc — 270° sweep starting at -135° -->
      <circle cx="50" cy="50" r="42" fill="none"
              stroke="var(--acc)" stroke-width="6" stroke-linecap="round"
              stroke-dasharray="184"
              stroke-dashoffset={184 * (1 - pct)}
              transform="rotate(135 50 50)"
              style="filter: drop-shadow(0 0 4px var(--acc-glow))"/>
    </svg>
    <div class="disc"></div>
    <div class="needle" style="transform: translateX(-50%) rotate({rotation}deg)"></div>
  </div>
  <div class="knob-label">{label}</div>
  <div class="knob-value">{value}<span class="unit">{unit}</span></div>
</div>
```

- 270° arc, dasharray ≈ `2π·r·0.75 ≈ 184` (r=42).
- `rotation = -135 + pct * 270`.
- `.disc`: radial-gradient inset 14% (becomes the dark dial body).
- `.needle`: 2px × 18% bar, `transform-origin: 50% 250%`.
- Sizes: `sm 56px / md 72px / lg 92px`.
- Drop the multi-color prop — single `--acc` everywhere. Keep `size` prop.
- Drag math from existing component is fine; just replace render.
- Add **value pill** that shows always (mono font, on `--bg-recess`, hairline border) — replaces in-knob value text.

---

## 5. `Fader.svelte` (refactor)

```html
<div class="fader">
  <div class="fader-tag">{channel}</div>      <!-- L or R pill -->
  <div class="fader-track">
    <div class="fader-fill" style="height:{pct}%"></div>
    <div class="fader-handle" style="bottom:calc({pct}% - 9px)"></div>
  </div>
  <div class="fader-value">{value}</div>
</div>
```

Plus a **separate** `<LedMeter segs={28} value={lvl}/>` component beside it driven by `levelLeft` / `levelRight` stores. 28 vertical segments, top 3 turn `--warn`. Renders as `<div class="led-meter">` with N `<div class="seg">`s.

---

## 6. `PresetButton.svelte` (refactor)

Single accent. Two layouts: `list` (full-width row, glyph + label + tag) and `compact` (centered, used in 2-col grid).

```html
<button class="preset" class:is-active={active}>
  <span class="preset-glyph">{glyph}</span>
  <span>{label}</span>
  {#if tag}<span class="preset-tag">{tag}</span>{/if}
</button>
```

Active state: `--acc-faint` background, `--acc-soft` border, 2px accent left rail, inset glow. No magenta variant.

---

## 7. `BilateralField.svelte` (new — replaces sidebar visualizers)

The hero. Replaces the 3 sidebar panels (oscilloscope/spectrum/meter). Wraps the existing `Visualizer.svelte` canvas drawing logic in a unified meter bridge.

Grid:
```
┌──┬─────────────────────────┬──┐  (28px | 1fr | 28px)
│  │ L · WAVEFORM (canvas)   │  │  60px
├──┼─────────────────────────┼──┤
│ L│  XY field + crosshair   │ R│  1fr  (min 280px)
│  │  + Lissajous trail      │  │
├──┼─────────────────────────┼──┤
│  │ R · WAVEFORM (canvas)   │  │  60px
├──┴─────────────────────────┴──┤
│ SPECTRUM strip (full-width)   │  80px
└───────────────────────────────┘
```

Header row: `LED · "FIELD ·"  "BILATERAL · METER BRIDGE"  →  [10.00 Hz]` (rate from `currentRate` store, mono, accent, glowing).

XY field overlay (drawn each frame in canvas):
1. Soft `--acc-faint` radial vignette (alpha pulses with `currentRate`).
2. Dotted grid: faint accent dots, density falls off radially.
3. Crosshair (4 short dashed lines with gap at center).
4. **Lissajous trail**: 90 history samples of `(L_signal, R_signal)` mapped to (x, y).
5. **Pulse markers**: filled circle on left half (radius animated by L envelope), filled circle on right half (animated by R envelope). This is the bilateral motion made visible.
6. Axis labels DOM-positioned: `L` left, `R` right, `DEPTH` top, `RATE` bottom.

Side rails (`field-rail.l` / `.r`): vertical 22-segment LED meters bound to `levelLeft` / `levelRight`. Top 3 segs warn-color. Channel letter pill above, `dB` mark below.

Top/bottom waveform strips: render `waveformLeft` / `waveformRight` from store as polyline (1.2px, accent, drop-shadow glow).

Spectrum strip (bottom): existing `spectrumData` as flex-row of bars (1 div per bin, `flex:1`, height % from amplitude). Frequency ticks `20 / 100 / 500 / 1k / 5k / 10k / 20k` along bottom.

All canvases keep existing draw logic — just **add overlays** before/after.

---

## 8. `CableLayer.svelte` → simplified to `TraceLayer.svelte`

Per user: hairline traces only, not patch cables. Static SVG paths inside `.layout`:

```html
<svg class="traces" viewBox="0 0 1640 760" preserveAspectRatio="none">
  <!-- left col → field left ports -->
  <path d="M280 120 L320 120 L320 380 L410 380"/>
  <path d="M280 320 L340 320 L340 380 L410 380"/>
  <path class="flow" d="M280 540 L360 540 L360 380 L410 380"/>
  <!-- field right ports → right col -->
  <path d="M1130 380 L1180 380 L1180 120 L1360 120"/>
  <path d="M1130 380 L1200 380 L1200 320 L1360 320"/>
  <path class="flow" d="M1130 380 L1220 380 L1220 540 L1360 540"/>
  <path d="M770 700 L770 730"/>
</svg>
```

Strokes: `var(--acc)`, 1px, opacity 0.18 base / 0.5 with `flow` class. Active flow uses `stroke-dasharray: 4 8` + `@keyframes flow { to { stroke-dashoffset: -36 } }` 1.4s linear infinite.

You can keep these as static coordinates (orthogonal Manhattan routing), since cables are purely decorative now — no port-position registry needed. Hide `<media (max-width:720px)>`.

---

## 9. Header

Sticky, blurred. Brand mark = 36px dark square with cyan crosshair inside (just CSS, see `.brand-mark::after`). Add status pill: `● ENGINE · 44.1 kHz · STEREO · LATENCY 12 ms`.

Buttons: `Upload`, `Info`, primary `Play / Stop`. Primary uses `--acc` border + glow when idle, switches to `--warn` color when playing.

---

## 10. Sample Library (`SampleLibrary.svelte`)

Full-width strip below main grid. Two-column inner layout:
- Left 200px: "NOW LOADED" label + sample name + meta.
- Right: responsive grid `repeat(auto-fill, minmax(180px, 1fr))` of `.lib-item` cards. Each card: small SVG waveform glyph + label + uppercase mono sub.

Active card: `--acc-faint` background, `--acc-soft` border. Wave glyph turns `--acc`.

---

## 11. Export panel

3-col row: Duration select · Bit Depth select · Render button (full-width, primary).
Selects use custom dropdown chevron (inline SVG bg-image).
LED in panel header is `dim` until rendering; turns `warn` + `pulse` during render.

---

## 12. State → visual mapping

| Store | Affects |
|---|---|
| `isPlaying` | All `.led.pulse` activate; trace `.flow` paths animate; play btn switches to warn variant |
| `currentRate` | Big readout `.field-header .hz`; XY radial vignette alpha sin-pulse |
| `levelLeft / levelRight` | Side rails (`#railL` / `#railR`) + dedicated `<LedMeter>` next to faders |
| `waveformLeft / waveformRight` | Top + bottom field-wave canvases |
| `spectrumData` | Spectrum bars in `.field-spectrum .bars` |
| `activeCarriers` | `.chip.is-active` toggles; "N ACTIVE" in panel-meta |
| `pattern`, `ratePreset` | `.preset.is-active` toggles |
| `selectedSampleId` | `.lib-item.is-active` |

---

## 13. File touch list

**Modified:**
- `src/app.css` — full token reset (Section 1) + all new utility classes from `styles.css`
- `src/App.svelte` — regrid to 3-col, swap right sidebar viz for `BilateralField`, wire `TraceLayer`, restyle header
- `src/lib/components/Knob.svelte` — Section 4 render
- `src/lib/components/Fader.svelte` — Section 5 render; spin off `LedMeter`
- `src/lib/components/PresetButton.svelte` — Section 6 (single accent only)
- `src/lib/components/Visualizer.svelte` — keep canvas draw, become internal child of `BilateralField`

**New:**
- `src/lib/components/PanelFrame.svelte`
- `src/lib/components/BilateralField.svelte`
- `src/lib/components/TraceLayer.svelte`
- `src/lib/components/LedMeter.svelte`
- `src/lib/components/SampleLibrary.svelte`
- `src/lib/components/Chip.svelte` (carrier toggle pill)

**Deleted/inlined:**
- The 3 sidebar Visualizer panels become children of BilateralField — remove from App.svelte sidebar.

---

## 14. Out of scope (per user)

- Patch-cable interactivity
- Variable accent color (single accent locked)
- Multiple knob aesthetics
- Light theme

---

## 15. Verification

1. `npm run dev` — boots, click-to-init still gates AudioContext.
2. Press play — engine LED pulses, trace flow lines animate.
3. Change pattern / rate / carriers — selected state updates with single accent.
4. Drag knobs — value pill updates live.
5. Resize: 1600 → 1100 → 720 — grid collapses; traces hide on mobile.
6. Export — render button shows warn glow + spinner state.
7. `npm run check` — no new svelte-check errors.
