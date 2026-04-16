<script lang="ts">
  import { audioEngine } from '$lib/audio/AudioEngine';
  import { 
    paramsStore, 
    patternPresets, 
    ratePresets, 
    carrierPresets,
    setPattern, 
    setRate, 
    applyRatePreset,
    setCarrier, 
    setCarrierFreq, 
    updateEnvelope,
    setLeftGain,
    setRightGain,
    playbackState,
    setPlaying,
    setUploadedTrack
  } from '$lib/stores/params';
  import { audioBufferToWav, downloadWav } from '$lib/utils/wavExport';
  
  let isInitialized = false;
  let uploadedTrack: { buffer: AudioBuffer; name: string; gain: number } | null = null;
  let exportDuration = 60; // seconds
  let exportBitDepth: 16 | 24 = 16;
  let isExporting = false;
  let showSafetyModal = false;
  
  async function handleInitialize() {
    if (!isInitialized) {
      await audioEngine.initialize();
      isInitialized = true;
      showSafetyModal = true;
    }
  }
  
  function handlePlay() {
    if (!isInitialized) return;
    
    const currentState = $playbackState;
    
    if (currentState.isPlaying) {
      audioEngine.stopBilateral();
      setPlaying(false);
    } else {
      // Update engine with current params
      audioEngine.updateParams($paramsStore);
      
      // Play uploaded track if available
      if (uploadedTrack) {
        audioEngine.playUploadedTrack(uploadedTrack);
      }
      
      audioEngine.startBilateral();
      setPlaying(true);
    }
  }
  
  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    try {
      const track = await audioEngine.loadUploadedTrack(file);
      uploadedTrack = track;
      setUploadedTrack(file.name);
      
      if ($playbackState.isPlaying) {
        audioEngine.playUploadedTrack(track);
      }
    } catch (error) {
      console.error('Failed to load audio file:', error);
      alert('Failed to load audio file. Please try a different format.');
    }
    
    // Reset input
    input.value = '';
  }
  
  async function handleExport() {
    if (!isInitialized || isExporting) return;
    
    isExporting = true;
    
    try {
      const renderedBuffer = await audioEngine.renderOffline(exportDuration, $paramsStore);
      const wavBlob = audioBufferToWav(renderedBuffer, { bitDepth: exportBitDepth });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadWav(wavBlob, `neon-synth-bilateral-${timestamp}.wav`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      isExporting = false;
    }
  }
  
  function closeSafetyModal() {
    showSafetyModal = false;
  }
  
  // Cleanup on unmount
  import { onMount } from 'svelte';
  onMount(() => {
    return () => {
      // Optional: cleanup if needed
    };
  });
</script>

<svelte:window onclick={handleInitialize} />

<div class="container">
  <header>
    <h1>🎛️ NeonSynth</h1>
    <p class="subtitle">Bilateral Isochronic Audio Synthesizer</p>
  </header>
  
  {#if !isInitialized}
    <div class="init-prompt">
      <p>Click anywhere to initialize audio engine</p>
      <p class="small">(Requires user gesture per browser security policy)</p>
    </div>
  {/if}
  
  <main class={isInitialized ? '' : 'disabled'}>
    <!-- Safety Disclaimer -->
    {#if showSafetyModal}
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="safety-title">
        <div class="modal">
          <h2 id="safety-title">⚠️ Safety Notice</h2>
          <div class="modal-content">
            <p><strong>Important:</strong> This tool produces bilateral auditory stimulation.</p>
            <ul>
              <li>Use at comfortable volume levels</li>
              <li>Discontinue use if you experience discomfort, dizziness, or headaches</li>
              <li>Not recommended for individuals with epilepsy or seizure disorders</li>
              <li>Consult a healthcare professional before use if you have any medical conditions</li>
              <li>This tool is for educational/experimental purposes and is not medical equipment</li>
            </ul>
            <p><em>Always prioritize your safety and well-being.</em></p>
          </div>
          <button class="btn btn-primary" onclick={closeSafetyModal}>I Understand</button>
        </div>
      </div>
    {/if}
    
    <!-- Playback Controls -->
    <section class="controls-section">
      <h2>Playback Controls</h2>
      <div class="control-row">
        <button 
          class="btn btn-play {($playbackState.isPlaying ? 'active' : '')}" 
          onclick={handlePlay}
          aria-pressed={$playbackState.isPlaying}
        >
          {$playbackState.isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
        
        <label class="file-upload">
          <input 
            type="file" 
            accept="audio/*" 
            onchange={handleFileUpload}
            aria-label="Upload audio file"
          />
          📁 Upload Track (WAV/MP3)
        </label>
        
        {#if uploadedTrack}
          <span class="track-info">Loaded: {uploadedTrack.name}</span>
        {/if}
      </div>
    </section>
    
    <!-- Pattern Selection -->
    <section class="controls-section">
      <h2>Bilateral Pattern</h2>
      <div class="preset-grid" role="radiogroup" aria-label="Pattern selection">
        {#each Object.entries(patternPresets) as [key, preset]}
          <button
            class="preset-btn {$paramsStore.pattern === key ? 'active' : ''}"
            onclick={() => setPattern(key as typeof key)}
            aria-pressed={$paramsStore.pattern === key}
          >
            <span class="preset-name">{preset.label}</span>
            <span class="preset-desc">{preset.description}</span>
          </button>
        {/each}
      </div>
    </section>
    
    <!-- Rate Presets -->
    <section class="controls-section">
      <h2>Stimulation Rate</h2>
      <div class="rate-controls">
        <div class="preset-row">
          {#each Object.entries(ratePresets) as [key, preset]}
            <button
              class="rate-btn {$paramsStore.rate === preset.default ? 'active' : ''}"
              onclick={() => applyRatePreset(key as typeof key)}
              aria-pressed={$paramsStore.rate === preset.default}
            >
              {preset.label.split(' ')[0]}
            </button>
          {/each}
        </div>
        
        <div class="slider-group">
          <label for="rate-slider">
            Rate: {$paramsStore.rate.toFixed(2)} Hz
          </label>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="30"
            step="0.1"
            bind:value={$paramsStore.rate}
            oninput={(e) => setRate(parseFloat(e.target.value))}
            aria-valuemin="0.5"
            aria-valuemax="30"
            aria-valuenow={$paramsStore.rate}
          />
        </div>
      </div>
    </section>
    
    <!-- Carrier Selection -->
    <section class="controls-section">
      <h2>Carrier Signal</h2>
      <div class="carrier-controls">
        <select bind:value={$paramsStore.carrier} onchange={(e) => setCarrier(e.target.value as any)}>
          {#each Object.entries(carrierPresets) as [key, preset]}
            <option value={key}>{preset.label}</option>
          {/each}
        </select>
        
        {#if $paramsStore.carrier === 'sine'}
          <div class="slider-group">
            <label for="freq-slider">
              Frequency: {$paramsStore.carrierFreq} Hz
            </label>
            <input
              id="freq-slider"
              type="range"
              min="100"
              max="2000"
              step="10"
              bind:value={$paramsStore.carrierFreq}
              oninput={(e) => setCarrierFreq(parseInt(e.target.value))}
            />
          </div>
        {/if}
      </div>
    </section>
    
    <!-- Envelope Controls -->
    <section class="controls-section">
      <h2>Pulse Envelope</h2>
      <div class="envelope-grid">
        <div class="slider-group">
          <label for="attack-slider">
            Attack: {$paramsStore.envelope.attack.toFixed(3)}s
          </label>
          <input
            id="attack-slider"
            type="range"
            min="0.001"
            max="0.5"
            step="0.001"
            bind:value={$paramsStore.envelope.attack}
            oninput={(e) => updateEnvelope({ attack: parseFloat(e.target.value) })}
          />
        </div>
        
        <div class="slider-group">
          <label for="decay-slider">
            Decay: {$paramsStore.envelope.decay.toFixed(3)}s
          </label>
          <input
            id="decay-slider"
            type="range"
            min="0.01"
            max="1.0"
            step="0.01"
            bind:value={$paramsStore.envelope.decay}
            oninput={(e) => updateEnvelope({ decay: parseFloat(e.target.value) })}
          />
        </div>
        
        <div class="slider-group">
          <label for="duty-slider">
            Duty Cycle: {Math.round($paramsStore.envelope.dutyCycle * 100)}%
          </label>
          <input
            id="duty-slider"
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            bind:value={$paramsStore.envelope.dutyCycle}
            oninput={(e) => updateEnvelope({ dutyCycle: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    </section>
    
    <!-- Stereo Balance -->
    <section class="controls-section">
      <h2>Stereo Balance</h2>
      <div class="balance-controls">
        <div class="slider-group">
          <label for="left-gain">
            Left: {Math.round($paramsStore.leftGain * 100)}%
          </label>
          <input
            id="left-gain"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={$paramsStore.leftGain}
            oninput={(e) => setLeftGain(parseFloat(e.target.value))}
          />
        </div>
        
        <div class="slider-group">
          <label for="right-gain">
            Right: {Math.round($paramsStore.rightGain * 100)}%
          </label>
          <input
            id="right-gain"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={$paramsStore.rightGain}
            oninput={(e) => setRightGain(parseFloat(e.target.value))}
          />
        </div>
        
        <div class="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              bind:checked={$paramsStore.panSmooth}
              onchange={(e) => setPanSmooth(e.target.checked)}
            />
            Smooth Panning (vs hard L/R switching)
          </label>
        </div>
      </div>
    </section>
    
    <!-- Export Section -->
    <section class="controls-section">
      <h2>Export Audio</h2>
      <div class="export-controls">
        <div class="export-options">
          <label>
            Duration:
            <select bind:value={exportDuration}>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
          </label>
          
          <label>
            Bit Depth:
            <select bind:value={exportBitDepth}>
              <option value={16}>16-bit PCM</option>
              <option value={24}>24-bit PCM</option>
            </select>
          </label>
        </div>
        
        <button 
          class="btn btn-export" 
          onclick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? '⏳ Rendering...' : '💾 Export WAV'}
        </button>
        
        <p class="small">
          Exports stereo WAV at 44.1 kHz with current bilateral pattern settings
        </p>
      </div>
    </section>
    
    <!-- Educational Content -->
    <section class="info-section">
      <h2>About Bilateral Isochronic Stimulation</h2>
      <div class="info-content">
        <p>
          <strong>Isochronic tones</strong> are evenly-spaced pulses of sound that can influence brainwave activity.
          Unlike binaural beats (which require two different frequencies), isochronic tones use discrete amplitude-modulated pulses.
        </p>
        <p>
          <strong>Bilateral stimulation</strong> alternates sound between left and right ears, a technique used in EMDR (Eye Movement Desensitization and Reprocessing) therapy.
          This alternating pattern may help facilitate interhemispheric communication and processing.
        </p>
        <h3>Frequency Bands:</h3>
        <ul>
          <li><strong>Delta (0.5-3 Hz):</strong> Deep sleep, healing</li>
          <li><strong>Theta (4-7 Hz):</strong> Meditation, creativity, REM sleep</li>
          <li><strong>Alpha (8-12 Hz):</strong> Relaxation, calm focus</li>
          <li><strong>Beta (13-30 Hz):</strong> Alert concentration, active thinking</li>
        </ul>
        <p class="small disclaimer">
          <strong>Note:</strong> This tool is for educational and experimental purposes only. It is not medical equipment and should not be used as a substitute for professional medical advice or treatment.
        </p>
      </div>
    </section>
  </main>
  
  <footer>
    <p>NeonSynth - Browser-Native Bilateral Audio Synthesizer</p>
    <p class="small">Built with Svelte 5 + Web Audio API</p>
  </footer>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    color: #e0e0e0;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    font-size: 2.5rem;
    background: linear-gradient(90deg, #00f5ff, #ff00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #a0a0a0;
    font-size: 1.1rem;
  }
  
  .init-prompt {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin: 2rem 0;
  }
  
  .init-prompt p {
    margin-bottom: 0.5rem;
  }
  
  main.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  
  .controls-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: #00f5ff;
  }
  
  .control-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
  }
  
  .btn-play {
    background: linear-gradient(135deg, #00f5ff, #00c3ff);
    color: #0f0c29;
  }
  
  .btn-play.active {
    background: linear-gradient(135deg, #ff416c, #ff4b2b);
  }
  
  .btn-export {
    background: linear-gradient(135deg, #11998e, #38ef7d);
    color: #0f0c29;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .file-upload {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .file-upload:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .file-upload input {
    display: none;
  }
  
  .track-info {
    color: #00f5ff;
    font-size: 0.9rem;
  }
  
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .preset-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .preset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .preset-btn.active {
    border-color: #00f5ff;
    background: rgba(0, 245, 255, 0.1);
  }
  
  .preset-name {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #fff;
  }
  
  .preset-desc {
    display: block;
    font-size: 0.85rem;
    color: #a0a0a0;
  }
  
  .rate-controls, .carrier-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .preset-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .rate-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .rate-btn.active {
    border-color: #00f5ff;
    background: rgba(0, 245, 255, 0.15);
  }
  
  .slider-group {
    margin-bottom: 1rem;
  }
  
  .slider-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    -webkit-appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00f5ff;
    cursor: pointer;
  }
  
  select {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .envelope-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .balance-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
  }
  
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .export-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .export-options {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .export-options label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .info-section {
    background: rgba(255, 255, 255, 0.03);
    border-left: 4px solid #00f5ff;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
  }
  
  .info-content {
    line-height: 1.7;
  }
  
  .info-content h3 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #ff00ff;
  }
  
  .info-content ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .info-content li {
    margin-bottom: 0.25rem;
  }
  
  .disclaimer {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(255, 65, 108, 0.1);
    border-radius: 6px;
    border-left: 3px solid #ff416c;
  }
  
  footer {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #808080;
  }
  
  .small {
    font-size: 0.85rem;
    color: #808080;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    border: 2px solid #ff416c;
  }
  
  .modal h2 {
    color: #ff416c;
    margin-bottom: 1rem;
  }
  
  .modal-content {
    margin-bottom: 1.5rem;
  }
  
  .modal-content ul {
    margin: 1rem 0;
    margin-left: 1.5rem;
  }
  
  .modal-content li {
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    h1 {
      font-size: 1.8rem;
    }
    
    .preset-grid, .envelope-grid, .balance-controls {
      grid-template-columns: 1fr;
    }
  }
</style>
