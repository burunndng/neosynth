import { writable, derived } from 'svelte/store';
import type { PatternType, CarrierType, RatePreset } from './audioStore';

// Default parameters
export const defaultParams: BilateralParams = {
  pattern: 'pure-alternation',
  rate: 1.0,
  carrier: 'sine',
  carrierFreq: 440,
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0,
    dutyCycle: 0.5
  },
  leftGain: 0.7,
  rightGain: 0.7,
  panSmooth: false
};

// Preset definitions
export const ratePresets: Record<RatePreset, { label: string; range: [number, number]; default: number }> = {
  delta: { label: 'Delta (0.5-3 Hz)', range: [0.5, 3], default: 1.0 },
  theta: { label: 'Theta (4-7 Hz)', range: [4, 7], default: 6.0 },
  alpha: { label: 'Alpha (8-12 Hz)', range: [8, 12], default: 10.0 },
  beta: { label: 'Beta (13-30 Hz)', range: [13, 30], default: 20.0 },
  emdr: { label: 'EMDR (1-3 Hz)', range: [1, 3], default: 1.5 }
};

export const patternPresets: Record<PatternType, { label: string; description: string }> = {
  'pure-alternation': { 
    label: 'Pure Alternation', 
    description: 'Classic left-right alternating pulses (EMDR standard)' 
  },
  'mirrored-overlap': { 
    label: 'Mirrored Overlap', 
    description: 'Simultaneous pulses followed by alternation' 
  },
  'asymmetric': { 
    label: 'Asymmetric', 
    description: 'Different rates and timing for each ear' 
  },
  'clustered': { 
    label: 'Clustered', 
    description: 'Bursts of rapid pulses with pauses between' 
  },
  'randomized': { 
    label: 'Randomized', 
    description: 'Stochastic timing within defined bounds' 
  }
};

export const carrierPresets: Record<CarrierType, { label: string; description: string }> = {
  sine: { label: 'Sine Tone', description: 'Pure sinusoidal carrier' },
  square: { label: 'Square Wave', description: 'Rich hollow/buzzy tone' },
  sawtooth: { label: 'Sawtooth Wave', description: 'Bright, buzzy harmonic-rich tone' },
  triangle: { label: 'Triangle Wave', description: 'Softer than sine, mellow tone' },
  'white-noise': { label: 'White Noise', description: 'Full-spectrum hiss, equal energy per frequency' },
  pink: { label: 'Pink Noise', description: 'Equal energy per octave' },
  brown: { label: 'Brown Noise', description: 'Deeper, rumbling noise' },
  bandlimited: { label: 'Band-Limited Noise', description: 'Filtered to specific frequency range' },
  sample: { label: 'Sound Sample', description: 'Use a sound file as carrier' }
};

// Main store
export const paramsStore = writable<BilateralParams>({ ...defaultParams });

// Derived stores for individual params
export const pattern = derived(paramsStore, $params => $params.pattern);
export const rate = derived(paramsStore, $params => $params.rate);
export const carrier = derived(paramsStore, $params => $params.carrier);
export const carrierFreq = derived(paramsStore, $params => $params.carrierFreq);
export const envelope = derived(paramsStore, $params => $params.envelope);
export const leftGain = derived(paramsStore, $params => $params.leftGain);
export const rightGain = derived(paramsStore, $params => $params.rightGain);
export const panSmooth = derived(paramsStore, $params => $params.panSmooth);

// Actions
export function setPattern(pattern: PatternType) {
  paramsStore.update(params => ({ ...params, pattern }));
}

export function setRate(rate: number) {
  paramsStore.update(params => ({ ...params, rate }));
}

export function applyRatePreset(preset: RatePreset) {
  paramsStore.update(params => ({ 
    ...params, 
    rate: ratePresets[preset].default 
  }));
}

export function setCarrier(carrier: CarrierType) {
  paramsStore.update(params => ({ ...params, carrier }));
}

export function setCarrierFreq(freq: number) {
  paramsStore.update(params => ({ ...params, carrierFreq: freq }));
}

export function updateEnvelope(updates: Partial<EnvelopeParams>) {
  paramsStore.update(params => ({ 
    ...params, 
    envelope: { ...params.envelope, ...updates } 
  }));
}

export function setLeftGain(gain: number) {
  paramsStore.update(params => ({ ...params, leftGain: gain }));
}

export function setRightGain(gain: number) {
  paramsStore.update(params => ({ ...params, rightGain: gain }));
}

export function setPanSmooth(enabled: boolean) {
  paramsStore.update(params => ({ ...params, panSmooth: enabled }));
}

export function resetParams() {
  paramsStore.set({ ...defaultParams });
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  hasUploadedTrack: boolean;
  uploadedTrackName: string | null;
}

export const playbackState = writable<PlaybackState>({
  isPlaying: false,
  hasUploadedTrack: false,
  uploadedTrackName: null
});

export function setPlaying(playing: boolean) {
  playbackState.update(state => ({ ...state, isPlaying: playing }));
}

export function setUploadedTrack(name: string | null) {
  playbackState.update(state => ({ 
    ...state, 
    hasUploadedTrack: name !== null,
    uploadedTrackName: name 
  }));
}
