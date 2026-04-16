/**
 * AudioEngine - Core audio processing for NeonSynth bilateral isochronic synthesizer
 * Handles real-time preview and offline rendering with Web Audio API
 */

export type CarrierType = 'sine' | 'pink-noise' | 'brown-noise' | 'band-limited';
export type PatternType = 'pure-alternation' | 'mirrored-overlap' | 'asymmetric' | 'clustered' | 'randomized';
export type RatePreset = 'delta' | 'theta' | 'alpha' | 'beta' | 'emdr';

export interface EnvelopeParams {
  attack: number;    // seconds
  decay: number;     // seconds
  sustain: number;   // seconds (0 for AD envelope)
  dutyCycle: number; // 0-1, pulse width
}

export interface BilateralParams {
  pattern: PatternType;
  rate: number;      // Hz (pulses per second per ear)
  carrier: CarrierType;
  carrierFreq: number; // Hz for tone carriers
  envelope: EnvelopeParams;
  leftGain: number;  // 0-1
  rightGain: number; // 0-1
  panSmooth: boolean; // use smooth panning vs hard L/R
}

export interface UploadedTrack {
  buffer: AudioBuffer;
  name: string;
  gain: number;
}

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private uploadedTrackSource: AudioBufferSourceNode | null = null;
  private uploadedTrackGain: GainNode | null = null;
  private bilateralNodes: {
    carrier?: OscillatorNode | AudioNode;
    splitter?: ChannelSplitterNode;
    merger?: ChannelMergerNode;
    panner?: StereoPannerNode;
    leftGain?: GainNode;
    rightGain?: GainNode;
  } = {};
  
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private scheduledPulses: Array<{ time: number; ear: 'left' | 'right'; gain: GainNode }> = [];
  private params: BilateralParams = {
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

  async initialize(): Promise<void> {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      
      this.setupBilateralRouting();
    }
    
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  private setupBilateralRouting(): void {
    if (!this.audioCtx || !this.masterGain) return;

    // Create routing nodes
    this.bilateralNodes.splitter = this.audioCtx.createChannelSplitter(2);
    this.bilateralNodes.merger = this.audioCtx.createChannelMerger(2);
    this.bilateralNodes.leftGain = this.audioCtx.createGain();
    this.bilateralNodes.rightGain = this.audioCtx.createGain();
    this.bilateralNodes.panner = this.audioCtx.createStereoPanner();

    // Route: carrier -> panner/splitter -> L/R gains -> merger -> master
    this.bilateralNodes.panner.connect(this.bilateralNodes.splitter);
    this.bilateralNodes.splitter.connect(this.bilateralNodes.leftGain, 0);
    this.bilateralNodes.splitter.connect(this.bilateralNodes.rightGain, 1);
    this.bilateralNodes.leftGain.connect(this.bilateralNodes.merger, 0, 0);
    this.bilateralNodes.rightGain.connect(this.bilateralNodes.merger, 0, 1);
    this.bilateralNodes.merger.connect(this.masterGain);

    // Setup uploaded track routing
    this.uploadedTrackGain = this.audioCtx.createGain();
    this.uploadedTrackGain.connect(this.masterGain);
  }

  updateParams(params: Partial<BilateralParams>): void {
    this.params = { ...this.params, ...params };
    
    if (params.envelope) {
      this.params.envelope = { ...this.params.envelope, ...params.envelope };
    }

    // Update gain nodes in real-time
    if (this.bilateralNodes.leftGain) {
      this.bilateralNodes.leftGain.gain.setTargetAtTime(this.params.leftGain, this.audioCtx!.currentTime, 0.01);
    }
    if (this.bilateralNodes.rightGain) {
      this.bilateralNodes.rightGain.gain.setTargetAtTime(this.params.rightGain, this.audioCtx!.currentTime, 0.01);
    }
    if (this.bilateralNodes.panner && this.params.panSmooth) {
      // Smooth sinusoidal panning at bilateral rate
      const now = this.audioCtx!.currentTime;
      this.bilateralNodes.panner.pan.cancelScheduledValues(now);
      this.bilateralNodes.panner.pan.setValueAtTime(0, now);
    }
  }

  async loadUploadedTrack(file: File): Promise<UploadedTrack> {
    if (!this.audioCtx) await this.initialize();
    
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioCtx!.decodeAudioData(arrayBuffer);
    
    return {
      buffer: audioBuffer,
      name: file.name,
      gain: 0.8
    };
  }

  playUploadedTrack(track: UploadedTrack): void {
    if (!this.audioCtx) return;
    
    // Stop existing
    if (this.uploadedTrackSource) {
      this.uploadedTrackSource.stop();
      this.uploadedTrackSource.disconnect();
    }

    this.uploadedTrackSource = this.audioCtx.createBufferSource();
    this.uploadedTrackSource.buffer = track.buffer;
    this.uploadedTrackSource.loop = true;
    
    if (this.uploadedTrackGain) {
      this.uploadedTrackGain.gain.value = track.gain;
    }
    
    this.uploadedTrackSource.connect(this.uploadedTrackGain!);
    this.uploadedTrackSource.start();
  }

  startBilateral(): void {
    if (!this.audioCtx || this.isPlaying) return;

    this.startTime = this.audioCtx.currentTime + 0.1; // Small lookahead
    this.isPlaying = true;

    // Create carrier
    if (this.params.carrier === 'sine') {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = this.params.carrierFreq;
      osc.connect(this.bilateralNodes.panner!);
      osc.start(this.startTime);
      this.bilateralNodes.carrier = osc;
    } else {
      // Noise carrier
      const noiseBuffer = this.createNoiseBuffer(this.params.carrier);
      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSource.connect(this.bilateralNodes.panner!);
      noiseSource.start(this.startTime);
      this.bilateralNodes.carrier = noiseSource;
    }

    // Schedule pulses
    this.schedulePulses(this.startTime);
  }

  private createNoiseBuffer(type: CarrierType): AudioBuffer {
    const sampleRate = this.audioCtx!.sampleRate;
    const duration = 2.0; // 2 seconds looped
    const length = sampleRate * duration;
    const buffer = this.audioCtx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
      case 'pink-noise':
        this.generatePinkNoise(data);
        break;
      case 'brown-noise':
        this.generateBrownNoise(data);
        break;
      case 'band-limited':
        this.generateBandLimitedNoise(data, 200, 2000);
        break;
      default:
        this.generateWhiteNoise(data);
    }

    return buffer;
  }

  private generateWhiteNoise(data: Float32Array): void {
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private generatePinkNoise(data: Float32Array): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }

  private generateBrownNoise(data: Float32Array): void {
    let lastOut = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  }

  private generateBandLimitedNoise(data: Float32Array, lowFreq: number, highFreq: number): void {
    // Simple band-limiting via averaging (not perfect but functional)
    this.generateWhiteNoise(data);
    const windowSize = Math.floor(this.audioCtx!.sampleRate / highFreq);
    for (let i = windowSize; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i - j];
      }
      data[i] = sum / windowSize;
    }
  }

  private schedulePulses(start: number): void {
    if (!this.audioCtx) return;

    const period = 1 / this.params.rate; // Time between pulses (per ear)
    const duration = 60; // Schedule 60 seconds ahead
    const endTime = start + duration;

    // Clear old schedules
    this.scheduledPulses = [];

    switch (this.params.pattern) {
      case 'pure-alternation':
        this.schedulePureAlternation(start, endTime, period);
        break;
      case 'mirrored-overlap':
        this.scheduleMirroredOverlap(start, endTime, period);
        break;
      case 'asymmetric':
        this.scheduleAsymmetric(start, endTime, period);
        break;
      case 'clustered':
        this.scheduleClustered(start, endTime, period);
        break;
      case 'randomized':
        this.scheduleRandomized(start, endTime, period);
        break;
    }
  }

  private schedulePureAlternation(start: number, end: number, period: number): void {
    let time = start;
    let ear: 'left' | 'right' = 'left';
    
    while (time < end) {
      this.triggerPulse(time, ear);
      time += period / 2; // Alternate ears at half period
      ear = ear === 'left' ? 'right' : 'left';
    }
  }

  private scheduleMirroredOverlap(start: number, end: number, period: number): void {
    // Both ears pulse simultaneously, then alternate
    let time = start;
    
    while (time < end) {
      // Simultaneous pulse
      this.triggerPulse(time, 'left');
      this.triggerPulse(time, 'right');
      
      // Alternating pulses
      time += period / 4;
      this.triggerPulse(time, 'left');
      time += period / 4;
      this.triggerPulse(time, 'right');
      time += period / 2;
    }
  }

  private scheduleAsymmetric(start: number, end: number, period: number): void {
    // Left ear pulses at normal rate, right ear at 2/3 rate with offset
    let timeL = start;
    let timeR = start + period * 0.25; // Offset
    
    while (timeL < end || timeR < end) {
      if (timeL < end) {
        this.triggerPulse(timeL, 'left');
        timeL += period;
      }
      if (timeR < end) {
        this.triggerPulse(timeR, 'right');
        timeR += period * 1.5;
      }
    }
  }

  private scheduleClustered(start: number, end: number, period: number): void {
    // Bursts of 3 rapid pulses, then pause
    let time = start;
    const clusterInterval = period * 3;
    const intraClusterGap = period / 4;
    
    while (time < end) {
      // Cluster of 3
      for (let i = 0; i < 3; i++) {
        const ear: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
        this.triggerPulse(time + i * intraClusterGap, ear);
      }
      time += clusterInterval;
    }
  }

  private scheduleRandomized(start: number, end: number, period: number): void {
    // Random timing within bounds
    let time = start;
    
    while (time < end) {
      const ear: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
      const jitter = (Math.random() - 0.5) * period * 0.3;
      this.triggerPulse(time + jitter, ear);
      time += period * (0.7 + Math.random() * 0.6);
    }
  }

  private triggerPulse(time: number, ear: 'left' | 'right'): void {
    if (!this.audioCtx || !this.bilateralNodes.leftGain || !this.bilateralNodes.rightGain) return;

    const { attack, decay, sustain, dutyCycle } = this.params.envelope;
    const pulseDuration = attack + sustain + decay;
    const gainNode = ear === 'left' ? this.bilateralNodes.leftGain : this.bilateralNodes.rightGain;

    // Schedule envelope
    gainNode.gain.cancelScheduledValues(time);
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(1, time + attack);
    
    if (sustain > 0) {
      gainNode.gain.setValueAtTime(1, time + attack + sustain);
    }
    
    gainNode.gain.linearRampToValueAtTime(0, time + attack + sustain + decay);

    this.scheduledPulses.push({ time, ear, gain: gainNode });
  }

  stopBilateral(): void {
    if (!this.audioCtx) return;

    this.isPlaying = false;
    
    // Stop carrier
    if (this.bilateralNodes.carrier) {
      if ('stop' in this.bilateralNodes.carrier) {
        this.bilateralNodes.carrier.stop();
      }
      this.bilateralNodes.carrier.disconnect();
      this.bilateralNodes.carrier = undefined;
    }

    // Reset gains
    const now = this.audioCtx.currentTime;
    if (this.bilateralNodes.leftGain) {
      this.bilateralNodes.leftGain.gain.cancelScheduledValues(now);
      this.bilateralNodes.leftGain.gain.setTargetAtTime(0, now, 0.01);
    }
    if (this.bilateralNodes.rightGain) {
      this.bilateralNodes.rightGain.gain.cancelScheduledValues(now);
      this.bilateralNodes.rightGain.gain.setTargetAtTime(0, now, 0.01);
    }

    this.scheduledPulses = [];
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  async renderOffline(duration: number, params: BilateralParams): Promise<AudioBuffer> {
    if (!this.audioCtx) await this.initialize();

    const offlineCtx = new OfflineAudioContext(2, duration * this.audioCtx.sampleRate, this.audioCtx.sampleRate);
    
    // Setup graph in offline context
    const masterGain = offlineCtx.createGain();
    const analyser = offlineCtx.createAnalyser();
    const panner = offlineCtx.createStereoPanner();
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    const leftGain = offlineCtx.createGain();
    const rightGain = offlineCtx.createGain();

    // Routing
    panner.connect(splitter);
    splitter.connect(leftGain, 0);
    splitter.connect(rightGain, 1);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(offlineCtx.destination);

    // Set gains
    leftGain.gain.value = params.leftGain;
    rightGain.gain.value = params.rightGain;

    // Create carrier
    let carrier: AudioNode;
    if (params.carrier === 'sine') {
      const osc = offlineCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = params.carrierFreq;
      osc.connect(panner);
      osc.start(0);
      carrier = osc;
    } else {
      // For noise, we'd need to create a buffer source - simplified here
      const osc = offlineCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = params.carrierFreq * 0.5;
      osc.connect(panner);
      osc.start(0);
      carrier = osc;
    }

    // Schedule pulses
    const period = 1 / params.rate;
    let time = 0;
    let ear: 'left' | 'right' = 'left';

    while (time < duration) {
      const { attack, decay, sustain } = params.envelope;
      const gainNode = ear === 'left' ? leftGain : rightGain;

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(1, time + attack);
      if (sustain > 0) {
        gainNode.gain.setValueAtTime(1, time + attack + sustain);
      }
      gainNode.gain.linearRampToValueAtTime(0, time + attack + sustain + decay);

      time += period / 2;
      ear = ear === 'left' ? 'right' : 'left';
    }

    // Render
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
  }

  destroy(): void {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
