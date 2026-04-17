import { writable, derived } from 'svelte/store';

export interface SoundLibraryEntry {
  id: string;
  label: string;
  filename: string;
  description: string;
}

export const soundLibrary: SoundLibraryEntry[] = [
  { id: 'kick-subwoofer', label: 'Subwoofer Kick', filename: '117493__zesoundresearchinc__kick-28-subwoofer-test.wav', description: 'Deep sub-bass kick' },
  { id: 'laser-gun', label: 'Laser Gun', filename: '232817__lezaarth__lasergun.wav', description: 'Sci-fi laser shot' },
  { id: 'prog-house-kick', label: 'Prog House Kick', filename: '385874__waveplaysfx__kick-prog-house-kick.wav', description: 'Punchy house kick drum' },
  { id: 'hard-drum-kick', label: 'Hard Drum Kick', filename: '536545__angelkunev__hard-drum-kick-destroyer.wav', description: 'Aggressive hard kick' },
  { id: 'intercom-phone', label: 'Intercom Phone', filename: '555140__fmaudio__lifting-up-intercom-phone.wav', description: 'Electronic intercom tone' },
  { id: 'paper-reload', label: 'Paper Reload', filename: '613291__birdofthenorth__paper-reload.wav', description: 'Crisp paper texture' },
  { id: 'ouch', label: 'Ouch', filename: '649543__ajanhallinta__ouch.wav', description: 'Short impact sound' },
  { id: 'player-hurt', label: 'Player Hurt', filename: '678594__redswan_studios__player-hurt-3.m4a', description: 'Game damage sound' },
  { id: 'music-box', label: 'Music Box', filename: '731365__moodyfingers__hand-crank-music-box-cranking.flac', description: 'Hand-cranked music box' },
  { id: 'bass-98', label: 'Bass 98', filename: '798639__cvltiv8r__cvlt-bass-98.wav', description: 'Deep bass tone' },
];

// Core audio state
export const isPlaying = writable(false);
export const audioContext = writable<AudioContext | null>(null);
export const masterGain = writable<number>(0.8);

// Pattern selection
export type PatternType = 'pure' | 'mirrored' | 'asymmetric' | 'clustered' | 'randomized';
export const pattern = writable<PatternType>('pure');

// Rate settings
export type RatePreset = 'delta' | 'theta' | 'alpha' | 'beta' | 'emdr';
export const ratePreset = writable<RatePreset>('emdr');
export const rateValue = writable<number>(2); // Hz

// Carrier settings
export type CarrierType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'white-noise' | 'pink' | 'brown' | 'bandlimited' | 'sample';
export const carrierType = writable<CarrierType>('sine');
export const carrierFreq = writable<number>(440);
export const selectedSampleId = writable<string>('kick-subwoofer');
export const sampleAudioBuffer = writable<AudioBuffer | null>(null);

// Envelope settings (AD)
export const attackTime = writable<number>(0.01); // seconds
export const decayTime = writable<number>(0.1); // seconds
export const dutyCycle = writable<number>(0.5); // 0-1

// Stereo settings
export const leftGain = writable<number>(1);
export const rightGain = writable<number>(1);
export const panMode = writable<'hard' | 'smooth'>('hard');

// User upload
export const userAudioBuffer = writable<AudioBuffer | null>(null);
export const userAudioGain = writable<number>(0.5);

// Export settings
export const exportDuration = writable<number>(60); // seconds
export const exportBitDepth = writable<16 | 24>(16);

// Derived values
export const currentRate = derived([ratePreset, rateValue], ([$preset, $value]) => {
  const ranges: Record<RatePreset, [number, number]> = {
    delta: [0.5, 3],
    theta: [4, 7],
    alpha: [8, 12],
    beta: [13, 30],
    emdr: [1, 3]
  };
  
  const [min, max] = ranges[$preset];
  return Math.max(min, Math.min(max, $value));
});

// Visualizer data stores
export const waveformLeft = writable<Float32Array>(new Float32Array(2048));
export const waveformRight = writable<Float32Array>(new Float32Array(2048));
export const spectrumData = writable<Float32Array>(new Float32Array(128));
export const levelLeft = writable<number>(0);
export const levelRight = writable<number>(0);

// Reset all params to defaults
export function resetParams() {
	pattern.set('pure');
	ratePreset.set('emdr');
	rateValue.set(2);
	carrierType.set('sine');
	carrierFreq.set(440);
	selectedSampleId.set('kick-subwoofer');
	sampleAudioBuffer.set(null);
	attackTime.set(0.01);
	decayTime.set(0.1);
	dutyCycle.set(0.5);
	leftGain.set(1);
	rightGain.set(1);
	panMode.set('hard');
	masterGain.set(0.8);
	userAudioGain.set(0.5);
}
