import type { PatternType, CarrierType } from '$lib/stores/audioStore';

export interface AudioEngineConfig {
  pattern: PatternType;
  rate: number;
  carrierTypes: CarrierType[];
  carrierFreq: number;
  attack: number;
  decay: number;
  dutyCycle: number;
  leftGain: number;
  rightGain: number;
  panMode: 'hard' | 'smooth';
  masterGain: number;
  userAudioBuffer: AudioBuffer | null;
  userAudioGain: number;
  sampleBuffer: AudioBuffer | null;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterNode: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  
  private carrierNodes: AudioNode[] = [];
  private pulseGains: GainNode[] = [];
  private userSource: AudioBufferSourceNode | null = null;
  private userGainNode: GainNode | null = null;
  
  private isPlaying = false;
  private nextPulseTime = 0;
  private pulseIndex = 0;
  private schedulerTimer: number | null = null;
  
  private config: AudioEngineConfig = {
    pattern: 'pure',
    rate: 2,
    carrierTypes: ['sine'],
    carrierFreq: 440,
    attack: 0.01,
    decay: 0.1,
    dutyCycle: 0.5,
    leftGain: 1,
    rightGain: 1,
    panMode: 'hard',
    masterGain: 0.8,
    userAudioBuffer: null,
    userAudioGain: 0.5,
    sampleBuffer: null
  };

  async init(): Promise<void> {
    if (this.ctx) return;
    
    this.ctx = new AudioContext({ sampleRate: 44100 });
    await this.ctx.resume();
    
    // Create master chain
    this.masterNode = this.ctx.createGain();
    this.masterNode.gain.value = this.config.masterGain;
    
    this.analyserLeft = this.ctx.createAnalyser();
    this.analyserLeft.fftSize = 4096;
    
    this.analyserRight = this.ctx.createAnalyser();
    this.analyserRight.fftSize = 4096;
    
    this.splitter = this.ctx.createChannelSplitter(2);
    this.merger = this.ctx.createChannelMerger(2);
    
    // Routing: merger -> master -> analyserL/R (parallel) -> destination
    this.merger.connect(this.masterNode);
    this.masterNode.connect(this.analyserLeft);
    this.masterNode.connect(this.analyserRight);
    this.masterNode.connect(this.ctx.destination);
    
    // Split for visualization
    this.masterNode.connect(this.splitter);
  }

  async play(): Promise<void> {
    if (!this.ctx) await this.init();
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.nextPulseTime = this.ctx!.currentTime + 0.1;
    this.pulseIndex = 0;
    
    // Start user audio if loaded
    if (this.config.userAudioBuffer) {
      this.startUserAudio();
    }
    
    // Start pulse scheduler
    this.schedulePulses();
    this.schedulerTimer = window.setInterval(() => this.schedulePulses(), 25);
  }

  stop(): void {
    this.isPlaying = false;
    
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    
    // Stop all carrier nodes
    this.carrierNodes.forEach(node => {
      try { node.disconnect(); } catch {}
    });
    this.carrierNodes = [];
    
    // Stop user audio
    if (this.userSource) {
      try { this.userSource.stop(); } catch {}
      this.userSource = null;
    }
  }

  private startUserAudio(): void {
    if (!this.ctx || !this.config.userAudioBuffer) return;
    
    this.userSource = this.ctx.createBufferSource();
    this.userSource.buffer = this.config.userAudioBuffer;
    this.userSource.loop = true;
    
    this.userGainNode = this.ctx.createGain();
    this.userGainNode.gain.value = this.config.userAudioGain;
    
    this.userSource.connect(this.userGainNode);
    this.userGainNode.connect(this.merger!);
    this.userSource.start();
  }

  private schedulePulses(): void {
    if (!this.ctx || !this.isPlaying) return;
    
    const lookahead = 0.1; // 100ms
    const currentTime = this.ctx.currentTime;
    
    while (this.nextPulseTime < currentTime + lookahead) {
      this.createPulse(this.nextPulseTime);
      this.advancePulse();
    }
  }

  private createPulse(time: number): void {
    if (!this.ctx) return;
    
    const { pattern, rate, carrierTypes, carrierFreq, attack, decay, dutyCycle, leftGain, rightGain } = this.config;
    
    if (carrierTypes.length === 0) return;
    
    const pulseDuration = 1 / rate;
    const sustainTime = pulseDuration * dutyCycle - attack - decay;
    
    let leftActive = false;
    let rightActive = false;
    
    switch (pattern) {
      case 'pure':
        leftActive = this.pulseIndex % 2 === 0;
        rightActive = this.pulseIndex % 2 === 1;
        break;
      case 'mirrored':
        leftActive = true;
        rightActive = true;
        break;
      case 'asymmetric':
        leftActive = this.pulseIndex % 3 !== 2;
        rightActive = this.pulseIndex % 3 !== 0;
        break;
      case 'clustered':
        const cluster = Math.floor(this.pulseIndex / 3);
        leftActive = cluster % 2 === 0;
        rightActive = cluster % 2 === 1;
        break;
      case 'randomized':
        leftActive = Math.random() > 0.5;
        rightActive = Math.random() > 0.5;
        break;
    }
    
    const perCarrierGain = 1 / carrierTypes.length;
    
    const leftGainNode = this.ctx.createGain();
    const rightGainNode = this.ctx.createGain();
    leftGainNode.gain.value = 0;
    rightGainNode.gain.value = 0;
    
    const createdNodes: AudioNode[] = [];
    
    for (const carrierType of carrierTypes) {
      const carrier = this.createCarrier(carrierType, carrierFreq, time);
      if (!carrier) continue;
      
      this.carrierNodes.push(carrier);
      createdNodes.push(carrier);
      
      const carrierGain = this.ctx.createGain();
      carrierGain.gain.value = perCarrierGain;
      carrier.connect(carrierGain);
      carrierGain.connect(leftGainNode);
      carrierGain.connect(rightGainNode);
    }
    
    if (createdNodes.length === 0) return;
    
    if (leftActive) {
      leftGainNode.gain.setValueAtTime(0, time);
      leftGainNode.gain.linearRampToValueAtTime(leftGain, time + attack);
      leftGainNode.gain.setValueAtTime(leftGain, time + attack + Math.max(0, sustainTime));
      leftGainNode.gain.linearRampToValueAtTime(0, time + attack + Math.max(0, sustainTime) + decay);
    }
    
    if (rightActive) {
      rightGainNode.gain.setValueAtTime(0, time);
      rightGainNode.gain.linearRampToValueAtTime(rightGain, time + attack);
      rightGainNode.gain.setValueAtTime(rightGain, time + attack + Math.max(0, sustainTime));
      rightGainNode.gain.linearRampToValueAtTime(0, time + attack + Math.max(0, sustainTime) + decay);
    }
    
    leftGainNode.connect(this.merger!, 0, 0);
    rightGainNode.connect(this.merger!, 0, 1);
    
    const cleanupTime = time + pulseDuration + 0.1;
    setTimeout(() => {
      createdNodes.forEach(n => n.disconnect());
      leftGainNode.disconnect();
      rightGainNode.disconnect();
      createdNodes.forEach(n => {
        this.carrierNodes = this.carrierNodes.filter(c => c !== n);
      });
    }, (cleanupTime - this.ctx!.currentTime) * 1000);
  }

  private createCarrier(type: CarrierType, freq: number, time: number): AudioNode | null {
    if (!this.ctx) return null;
    
    switch (type) {
      case 'sine':
      case 'square':
      case 'sawtooth':
      case 'triangle': {
        const osc = this.ctx.createOscillator();
        osc.type = type as OscillatorType;
        osc.frequency.value = freq;
        osc.start(time);
        osc.stop(time + 2);
        return osc;
      }
      case 'white-noise':
      case 'pink':
      case 'brown':
      case 'bandlimited': {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'white-noise') {
            data[i] = white;
          } else if (type === 'pink') {
            data[i] = (white + (data[i-1] || 0) * 0.9) / 1.9;
          } else if (type === 'brown') {
            const last = data[i-1] || 0;
            data[i] = (last + (0.02 * white)) / 1.02;
            data[i] *= 3;
          } else {
            data[i] = white;
          }
        }
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.start(time);
        source.stop(time + 2);
        
        if (type === 'bandlimited') {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = Math.min(freq * 2, 20000);
          source.connect(filter);
          return filter;
        }
        
        return source;
      }
      case 'sample': {
        if (!this.config.sampleBuffer) return null;
        const sampleSource = this.ctx.createBufferSource();
        sampleSource.buffer = this.config.sampleBuffer;
        sampleSource.start(time);
        sampleSource.stop(time + 2);
        return sampleSource;
      }
      default:
        return null;
    }
  }

  private advancePulse(): void {
    this.pulseIndex++;
    const pulseDuration = 1 / this.config.rate;
    this.nextPulseTime += pulseDuration;
  }

  updateConfig(config: Partial<AudioEngineConfig>): void {
    Object.assign(this.config, config);
    
    // Update live params
    if (config.masterGain !== undefined && this.masterNode) {
      this.masterNode.gain.setTargetAtTime(config.masterGain, this.ctx!.currentTime, 0.01);
    }
    
    if (config.userAudioGain !== undefined && this.userGainNode) {
      this.userGainNode.gain.setTargetAtTime(config.userAudioGain, this.ctx!.currentTime, 0.01);
    }
    
    // Restart user audio if buffer changed
    if (config.userAudioBuffer && this.isPlaying && !this.userSource) {
      this.startUserAudio();
    }
  }

  getAnalyserData(): { 
    waveformLeft: Float32Array; 
    waveformRight: Float32Array; 
    spectrum: Float32Array;
    levelLeft: number;
    levelRight: number;
  } {
    if (!this.analyserLeft || !this.analyserRight) {
      return {
        waveformLeft: new Float32Array(2048),
        waveformRight: new Float32Array(2048),
        spectrum: new Float32Array(128),
        levelLeft: 0,
        levelRight: 0
      };
    }
    
    const waveL = new Float32Array(2048);
    const waveR = new Float32Array(2048);
    const freqData = new Float32Array(128);
    
    this.analyserLeft.getFloatTimeDomainData(waveL);
    this.analyserRight.getFloatTimeDomainData(waveR);
    this.analyserLeft.getFloatFrequencyData(freqData);
    
    let sumL = 0, sumR = 0;
    for (let i = 0; i < 2048; i++) {
      sumL += waveL[i] * waveL[i];
      sumR += waveR[i] * waveR[i];
    }
    const rmsL = Math.sqrt(sumL / 2048);
    const rmsR = Math.sqrt(sumR / 2048);
    
    return {
      waveformLeft: waveL,
      waveformRight: waveR,
      spectrum: freqData,
      levelLeft: rmsL,
      levelRight: rmsR
    };
  }

  async renderOffline(duration: number, bitDepth: 16 | 24): Promise<Blob> {
    if (!this.ctx) await this.init();
    
    const offlineCtx = new OfflineAudioContext(2, duration * 44100, 44100);
    
    const masterNode = offlineCtx.createGain();
    masterNode.gain.value = this.config.masterGain;
    
    const merger = offlineCtx.createChannelMerger(2);
    merger.connect(masterNode);
    masterNode.connect(offlineCtx.destination);
    
    const { rate, pattern, carrierTypes, carrierFreq, attack, decay, dutyCycle, leftGain, rightGain } = this.config;
    if (carrierTypes.length === 0) {
      const renderedBuffer = await offlineCtx.startRendering();
      return this.bufferToWav(renderedBuffer, bitDepth);
    }
    const totalPulses = Math.floor(duration * rate);
    let pulseIdx = 0;
    let time = 0.1;
    const perCarrierGain = 1 / carrierTypes.length;
    
    for (let i = 0; i < totalPulses; i++) {
      const pulseDuration = 1 / rate;
      const sustainTime = pulseDuration * dutyCycle - attack - decay;
      
      let leftActive = false;
      let rightActive = false;
      
      switch (pattern) {
        case 'pure':
          leftActive = pulseIdx % 2 === 0;
          rightActive = pulseIdx % 2 === 1;
          break;
        case 'mirrored':
          leftActive = true;
          rightActive = true;
          break;
        case 'asymmetric':
          leftActive = pulseIdx % 3 !== 2;
          rightActive = pulseIdx % 3 !== 0;
          break;
        case 'clustered':
          const cluster = Math.floor(pulseIdx / 3);
          leftActive = cluster % 2 === 0;
          rightActive = cluster % 2 === 1;
          break;
        case 'randomized':
          leftActive = Math.random() > 0.5;
          rightActive = Math.random() > 0.5;
          break;
      }
      
      const leftGainNode = offlineCtx.createGain();
      const rightGainNode = offlineCtx.createGain();
      leftGainNode.gain.value = 0;
      rightGainNode.gain.value = 0;
      
      for (const ct of carrierTypes) {
        const carrier = this.createOfflineCarrier(offlineCtx, ct, carrierFreq, time, pulseDuration);
        if (!carrier) continue;
        const carrierGain = offlineCtx.createGain();
        carrierGain.gain.value = perCarrierGain;
        carrier.connect(carrierGain);
        carrierGain.connect(leftGainNode);
        carrierGain.connect(rightGainNode);
      }
      
      if (leftActive) {
        leftGainNode.gain.setValueAtTime(0, time);
        leftGainNode.gain.linearRampToValueAtTime(leftGain, time + attack);
        leftGainNode.gain.setValueAtTime(leftGain, time + attack + Math.max(0, sustainTime));
        leftGainNode.gain.linearRampToValueAtTime(0, time + attack + Math.max(0, sustainTime) + decay);
      }
      
      if (rightActive) {
        rightGainNode.gain.setValueAtTime(0, time);
        rightGainNode.gain.linearRampToValueAtTime(rightGain, time + attack);
        rightGainNode.gain.setValueAtTime(rightGain, time + attack + Math.max(0, sustainTime));
        rightGainNode.gain.linearRampToValueAtTime(0, time + attack + Math.max(0, sustainTime) + decay);
      }
      
      leftGainNode.connect(merger, 0, 0);
      rightGainNode.connect(merger, 0, 1);
      
      time += pulseDuration;
      pulseIdx++;
    }
    
    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWav(renderedBuffer, bitDepth);
  }

  private createOfflineCarrier(ctx: OfflineAudioContext, type: CarrierType, freq: number, time: number, duration: number): AudioNode | null {
    switch (type) {
      case 'sine':
      case 'square':
      case 'sawtooth':
      case 'triangle': {
        const osc = ctx.createOscillator();
        osc.type = type as OscillatorType;
        osc.frequency.value = freq;
        osc.start(time);
        osc.stop(time + duration);
        return osc;
      }
      case 'white-noise':
      case 'pink':
      case 'brown':
      case 'bandlimited': {
        const bufferSize = Math.ceil(duration * 44100);
        const buffer = ctx.createBuffer(1, bufferSize, 44100);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'white-noise') {
            data[i] = white;
          } else if (type === 'pink') {
            data[i] = (white + (data[i-1] || 0) * 0.9) / 1.9;
          } else if (type === 'brown') {
            const last = data[i-1] || 0;
            data[i] = (last + (0.02 * white)) / 1.02;
            data[i] *= 3;
          } else {
            data[i] = white;
          }
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.start(time);
        source.stop(time + duration);
        
        if (type === 'bandlimited') {
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = Math.min(freq * 2, 20000);
          source.connect(filter);
          return filter;
        }
        
        return source;
      }
      case 'sample': {
        if (!this.config.sampleBuffer) return null;
        const sampleSource = ctx.createBufferSource();
        sampleSource.buffer = this.config.sampleBuffer;
        sampleSource.start(time);
        sampleSource.stop(time + duration);
        return sampleSource;
      }
      default:
        return null;
    }
  }

  private bufferToWav(buffer: AudioBuffer, bitDepth: 16 | 24): Blob {
    const numChannels = 2;
    const sampleRate = buffer.sampleRate;
    const format = bitDepth;
    const bytesPerSample = format / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = buffer.getChannelData(0);
    const data2 = buffer.getChannelData(1);
    const numSamples = data.length;
    
    const buffer_size = 44 + numSamples * blockAlign;
    const arrayBuffer = new ArrayBuffer(buffer_size);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, buffer_size - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, format, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * blockAlign, true);
    
    // Write interleaved audio data
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const sample1 = Math.max(-1, Math.min(1, data[i]));
      const sample2 = Math.max(-1, Math.min(1, data2[i]));
      
      if (format === 16) {
        const int16 = (sample: number) => Math.floor(sample * 32767);
        view.setInt16(offset, int16(sample1), true);
        view.setInt16(offset + 2, int16(sample2), true);
        offset += 4;
      } else {
        const int24 = (sample: number) => Math.floor(sample * 8388607);
        view.setUint8(offset, int24(sample1) & 0xff);
        view.setUint8(offset + 1, (int24(sample1) >> 8) & 0xff);
        view.setUint8(offset + 2, (int24(sample1) >> 16) & 0xff);
        view.setUint8(offset + 3, int24(sample2) & 0xff);
        view.setUint8(offset + 4, (int24(sample2) >> 8) & 0xff);
        view.setUint8(offset + 5, (int24(sample2) >> 16) & 0xff);
        offset += 6;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Singleton instance
export const engine = new AudioEngine();
