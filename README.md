# 🎛️ NeonSynth - Bilateral Isochronic Audio Synthesizer

A browser-native bilateral isochronic audio synthesizer built with Svelte 5 + TypeScript + Web Audio API.

## ✨ Features

### Bilateral Patterns
- **Pure Alternation**: Classic left-right alternating pulses (EMDR standard)
- **Mirrored Overlap**: Simultaneous pulses followed by alternation
- **Asymmetric**: Different rates and timing for each ear
- **Clustered**: Bursts of rapid pulses with pauses between
- **Randomized**: Stochastic timing within defined bounds

### Stimulation Rate Presets
- **Delta (0.5-3 Hz)**: Deep sleep, healing
- **Theta (4-7 Hz)**: Meditation, creativity, REM sleep
- **Alpha (8-12 Hz)**: Relaxation, calm focus
- **Beta (13-30 Hz)**: Alert concentration, active thinking
- **EMDR (1-3 Hz)**: Standard EMDR therapy rates

### Carrier Signals
- Sine tone (adjustable frequency)
- Pink noise (equal energy per octave)
- Brown noise (deeper, rumbling)
- Band-limited noise

### Audio Controls
- Adjustable pulse envelope (attack, decay, duty cycle)
- Independent left/right gain control
- Smooth panning vs hard L/R switching
- User audio upload (WAV/MP3) with bilateral layer mixing

### Export
- Offline rendering via `OfflineAudioContext`
- 16-bit or 24-bit PCM WAV export
- 44.1 kHz stereo output
- Configurable duration (30s to 10 minutes)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Modern browser with Web Audio API support

### Installation

```bash
cd neon-synth
npm install
npm run dev
```

The development server will start at `http://localhost:5173/`

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Core Modules

#### `src/lib/audio/AudioEngine.ts`
Central audio processing engine handling:
- Real-time preview with `AudioContext`
- Offline rendering with `OfflineAudioContext`
- Bilateral routing via `ChannelSplitterNode`/`ChannelMergerNode`
- Pulse envelope scheduling with click-free AD/ADSR envelopes
- Multiple carrier generation (sine, pink/brown/band-limited noise)
- Pattern-based pulse scheduling

#### `src/lib/stores/params.ts`
Svelte stores for reactive state management:
- Parameter store with presets
- Playback state tracking
- Action functions for UI interaction

#### `src/lib/utils/wavExport.ts`
WAV file encoding utilities:
- 16/24-bit PCM encoding
- Proper WAV header generation
- Stereo interleaving

### Key Technical Implementation

#### Click-Free Pulse Envelopes
```javascript
// For each pulse at time t with attack/decay in seconds:
gain.gain.setValueAtTime(0, t);
gain.gain.linearRampToValueAtTime(1, t + attack);
gain.gain.setValueAtTime(1, t + attack + sustain);
gain.gain.linearRampToValueAtTime(0, t + attack + sustain + decay);
```

#### Bilateral Routing Strategies
1. **Hard L/R** (Pure Alternation): Split stereo → route pulses to L or R channel independently → merge
2. **Smooth Pan**: Single carrier → `StereoPannerNode.pan` animated sinusoidally

#### User-Gesture Audio Start
Per browser security policy, `AudioContext` resumes only after user interaction (click/touch).

## ⚠️ Safety Notice

This tool produces bilateral auditory stimulation:
- Use at comfortable volume levels
- Discontinue use if you experience discomfort, dizziness, or headaches
- Not recommended for individuals with epilepsy or seizure disorders
- Consult a healthcare professional before use if you have any medical conditions
- This tool is for educational/experimental purposes and is **not medical equipment**

## 📚 Educational Content

### Isochronic Tones vs Binaural Beats
**Isochronic tones** are evenly-spaced pulses of sound that can influence brainwave activity. Unlike binaural beats (which require two different frequencies played simultaneously), isochronic tones use discrete amplitude-modulated pulses.

### Bilateral Stimulation
Alternating sound between left and right ears is a technique used in EMDR (Eye Movement Desensitization and Reprocessing) therapy. This alternating pattern may help facilitate interhemispheric communication and processing.

## 🛠️ Tech Stack

- **Framework**: Svelte 5
- **Build Tool**: Vite
- **Language**: TypeScript
- **Audio**: Web Audio API
- **Styling**: CSS with gradients and responsive design

## 📄 License

MIT

---

Built with ❤️ using the Web Audio API
