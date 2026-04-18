# NeonSynth GUI Redesign — Premium Futuristic Visual Overhaul

**Date**: 2026-04-17
**Approach**: Deep Glow Overhaul (Approach A)
**Scope**: Visual redesign only — no new audio features. All existing functionality preserved.

---

## 1. Layout & Structure

**Visualizer-top, controls-below layout. Full-width, no sidebar.**

1. **Compact Header Bar** (48px height)
   - Holographic NeonSynth logo: gradient text (cyan → magenta) with subtle text-shadow glow
   - Large circular Play/Stop transport button with pulsing glow ring (cyan idle, red playing)
   - Small utility icon buttons: Upload, Info — dim until hovered
   - No wasted vertical space

2. **Central Visualizer Panel** (~40% viewport height)
   - Full-width bilateral waveform display (the undeniable star of the UI)
   - Rate readout overlaid: large "2.0 Hz" pulsing with the beat
   - Glowing border frame with subtle corner accents
   - **Mini Spectrum Strip** integrated at bottom edge of this panel: 64-bar spectrum + L/R level meters, bridging visualizer and controls

3. **Control Grid** (~60% viewport, below visualizer)
   - Modular panels in responsive grid:
     - Pattern (left)
     - Rate (center-left)
     - Carrier Layers (center, widest)
     - Pulse Envelope (center-right)
     - Stereo Field (right)
   - Export bar at bottom, full-width, compact

---

## 2. Central Visualizer — Bilateral Waveform Display

**The star of the UI. Full-width, commanding attention.**

- **Background**: `#08080c` with subtle dot-grid overlay (`rgba(255,255,255,0.03)` dots)
- **Left channel waveform**: electric cyan `#22d3ee`, 2px line + 8px shadow-blur glow
- **Right channel waveform**: hot magenta `#e879f9`, same treatment
- **Afterimage trail**: previous 3-4 frames rendered at decreasing opacity (10%, 5%, 2%) for motion trail
- **Grid lines**: `rgba(255,255,255,0.03)` horizontal and vertical
- **Center line**: slightly brighter `rgba(255,255,255,0.08)`
- **Corner brackets**: L/R channel labels with small glow indicators
- **Idle state**: slow sine wave breathing animation with dim glow when not playing
- **Pulse sync**: subtle brightness bump on each bilateral pulse

**Mini Spectrum Strip (integrated at bottom of visualizer panel):**
- 64-bar spectrum analyzer, gradient cyan → magenta → orange, soft glow
- L/R level meters as thin vertical bars on left/right edges
- ~48px tall, acts as visual bridge between visualizer and control grid

---

## 3. Knob Redesign — Compact & Premium

**IMPORTANT: Knobs must be compact and tasteful — NOT oversized. Max diameter 48px.**

- **Size**: sm=32px, md=40px, lg=48px (down from current 48/64/80px)
- **Outer ring**: dark metallic track (`#1a1a2e`) with 3D bevel (inner shadow + highlight edge)
- **Value arc**: gradient fill matching color theme, outer glow (`box-shadow: 0 0 12px`)
- **Tick marks**: 11 small illuminated dots around arc, lit/unlit based on value
- **Inner knob body**: radial gradient simulating 3D depth — lighter top-left, darker bottom-right
- **Indicator**: bright white line from center toward edge with glow
- **Value readout**: centered in knob, 10px bold, color-matched; unit below in 8px dim text
- **Label**: above knob, 10px uppercase tracking-wider, dim white
- **Hover**: glow intensifies, knob brightens
- **Dragging**: scale 1.05, maximum glow, cursor-grabbing
- **Double-click**: reset to default with brief flash

---

## 4. Fader Redesign

**Vertical fader with integrated level metering.**

- **Track**: recessed channel with inner shadow (3D slot), dark metallic
- **Fill**: gradient from accent color → darker shade, glow edge on fill boundary
- **Level meter**: thin bar alongside track showing real-time level for that channel, gradient green → yellow → red with peak hold
- **Handle**: chunky horizontal bar, metallic gradient, illuminated center line in accent color, 3D bevel
- **Tick marks**: illuminated dashes at 0/25/50/75/100%
- **Value readout**: below fader, bold mono, color-matched
- **Hover/drag**: handle glows, fill pulses

---

## 5. Panel Design

**Modular frosted panels with illuminated accents.**

- **Background**: `rgba(13, 13, 18, 0.85)` with `backdrop-blur(12px)`
- **Border**: 1px — top/left brighter `rgba(255,255,255,0.06)`, bottom/right darker — beveled depth
- **Accent border**: subtle color-matched glow on top edge (cyan for pattern, magenta for rate, etc.)
- **Section header**: 12px, font-weight 700, uppercase, letter-spacing 0.1em, with 2px underline in accent color + soft glow
- **Corner accents**: small decorative dots at panel corners
- **Inner spacing**: 24px padding, 16px gap between panels
- **Border radius**: 12px (rounded-xl)

---

## 6. Preset Buttons & Carrier Toggles

**Preset Buttons (Pattern, Rate):**
- Pill-shaped (`rounded-lg`)
- **Inactive**: dark metallic fill `#16161a`, subtle border, dim text
- **Hover**: border brightens, text starts glowing
- **Active**: accent color at 15% opacity fill, glowing border, bright accent text, outer shadow glow
- **Press**: scale 0.95 snap-back

**Carrier Toggle Buttons:**
- Same treatment, grouped with labels (Waves / Noise / Sample)
- Active carrier: stronger glow + small dot indicator
- Group labels: 10px uppercase dim gray above each group

---

## 7. Color System

**All colors defined as CSS custom properties in `app.css` for consistency.**

| CSS Variable | Role | Hex |
|-------------|------|-----|
| `--ns-bg-deep` | Background (deep) | `#08080c` |
| `--ns-bg-panel` | Background (panel) | `#0d0d12` |
| `--ns-bg-surface` | Surface (raised) | `#16161e` |
| `--ns-border` | Border | `rgba(255,255,255,0.06)` |
| `--ns-accent-primary` | Primary (L channel, rate) | `#22d3ee` |
| `--ns-accent-secondary` | Secondary (R channel, pattern) | `#e879f9` |
| `--ns-accent-tertiary` | Tertiary (envelope) | `#34d399` |
| `--ns-accent-warning` | Warning/export | `#f97316` |
| `--ns-text-primary` | Text primary | `#f0f0f5` |
| `--ns-text-secondary` | Text secondary | `#9ca3af` |
| `--ns-text-dim` | Text dim | `#4b5563` |

---

## 8. Typography

- **Font**: `Inter, system-ui, -apple-system, sans-serif`
- **Section headers**: 12px, weight 700, uppercase, letter-spacing 0.1em
- **Knob values**: 10px, weight 700, tabular-nums
- **Labels**: 10px, weight 500, uppercase, letter-spacing 0.08em
- **Large readouts (Hz display)**: 32px, weight 800, gradient text
- **Button text**: 12px, weight 600, uppercase, letter-spacing 0.06em

---

## 9. Header & Export Bar

**Header (48px):**
- Logo: "NEONSYNTH" gradient text (cyan → magenta) with text-shadow glow
- Transport: circular Play/Stop with pulsing glow ring (cyan idle / red playing)
- Utility buttons: small icons, dim until hovered

**Export Bar (bottom, full-width, slim):**
- Duration selector, bit depth selector, Export button — all inline
- Export button: warm orange gradient with glow, scale on hover
- Progress indicator when rendering

---

## 10. Files to Modify

| File | Change |
|------|--------|
| `src/App.svelte` | Complete layout restructure: visualizer-top grid, no sidebar, compact header |
| `src/app.css` | New global styles: Inter font import, CSS custom properties for color system, glow utilities, scrollbar styling |
| `src/lib/components/Knob.svelte` | Full redesign: compact sizes, 3D bevel, glow ring, tick marks, improved interaction |
| `src/lib/components/Fader.svelte` | Full redesign: recessed track, level meter, 3D handle, glow effects |
| `src/lib/components/Visualizer.svelte` | Major overhaul: bilateral waveform mode, afterimage trails, grid overlay, mini spectrum strip |
| `src/lib/components/PresetButton.svelte` | Redesign: pill shape, glow states, press animation |

No new files needed. No new dependencies needed (all effects achievable with CSS + Canvas).
