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
	import Knob from '$lib/components/Knob.svelte';
	import Fader from '$lib/components/Fader.svelte';
	import PresetButton from '$lib/components/PresetButton.svelte';
	import Visualizer from '$lib/components/Visualizer.svelte';
	import { Play, Square, Upload, Download, Info, AlertTriangle, Activity, Settings, Music } from 'lucide-svelte';
	
	function cn(...classes: Array<string | undefined | null | false>): string {
		return classes.filter(Boolean).join(' ');
	}
	
	let isInitialized = $state(false);
	let uploadedTrack: { buffer: AudioBuffer; name: string; gain: number } | null = null;
	let exportDuration = 60;
	let exportBitDepth: 16 | 24 = 16;
	let isExporting = $state(false);
	let showSafetyModal = $state(false);
	let showInfoPanel = $state(false);
	
	async function handleInitialize() {
		if (!isInitialized) {
			await audioEngine.initialize();
			isInitialized = true;
			showSafetyModal = true;
		}
	}
	
	function handlePlay() {
		if (!isInitialized) return;
		
		if ($playbackState.isPlaying) {
			audioEngine.stopBilateral();
			setPlaying(false);
		} else {
			audioEngine.updateParams($paramsStore);
			
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
		}
		
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
		} finally {
			isExporting = false;
		}
	}
	
	function closeSafetyModal() {
		showSafetyModal = false;
	}
</script>

<svelte:window onclick={handleInitialize} />

<div class="min-h-screen bg-[#0d0d0f] text-white">
	{#if !isInitialized}
		<div class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d0d0f] via-[#1a1a2e] to-[#0d0d0f] z-50">
			<div class="text-center space-y-6">
				<div class="space-y-2">
					<h1 class="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
						NeonSynth
					</h1>
					<p class="text-gray-400 text-lg">Bilateral Isochronic Audio Synthesizer</p>
				</div>
				<div class="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
					<div class="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 animate-pulse" style="width: 100%"></div>
				</div>
				<p class="text-gray-500 text-sm">Click anywhere to initialize audio engine</p>
			</div>
		</div>
	{/if}
	
	{#if showSafetyModal}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
			<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full p-8 space-y-6">
				<div class="flex items-center gap-3 text-amber-400">
					<AlertTriangle class="w-8 h-8" />
					<h2 class="text-2xl font-bold">Safety Notice</h2>
				</div>
				<div class="space-y-4 text-gray-300">
					<p class="font-medium">This tool produces bilateral auditory stimulation.</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-cyan-400 mt-1">•</span>
							Use at comfortable volume levels
						</li>
						<li class="flex items-start gap-2">
							<span class="text-cyan-400 mt-1">•</span>
							Discontinue if you experience discomfort or dizziness
						</li>
						<li class="flex items-start gap-2">
							<span class="text-cyan-400 mt-1">•</span>
							Not recommended for individuals with epilepsy
						</li>
						<li class="flex items-start gap-2">
							<span class="text-cyan-400 mt-1">•</span>
							Consult a healthcare professional if you have medical conditions
						</li>
					</ul>
					<p class="text-xs text-gray-500 italic">For educational/experimental purposes only. Not medical equipment.</p>
				</div>
				<button 
					class="w-full py-3 px-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0d0d0f] font-bold rounded-lg hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
					onclick={closeSafetyModal}
				>
					I Understand
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Header -->
	<header class="sticky top-0 z-40 bg-[#0d0d0f]/95 backdrop-blur-md border-b border-gray-800">
		<div class="max-w-[1600px] mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
							<Music class="w-6 h-6 text-white" />
						</div>
						<div>
							<h1 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
								NeonSynth
							</h1>
							<p class="text-xs text-gray-500">Bilateral Synth</p>
						</div>
					</div>
				</div>
				
				<div class="flex items-center gap-4">
					<button 
						class={cn(
							'flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all',
							$playbackState.isPlaying 
								? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30' 
								: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0d0d0f] shadow-lg shadow-cyan-500/30 hover:scale-105'
						)}
						onclick={handlePlay}
						disabled={!isInitialized}
					>
						{#if $playbackState.isPlaying}
							<Square class="w-5 h-5" />
							Stop
						{:else}
							<Play class="w-5 h-5" />
							Play
						{/if}
					</button>
					
					<label class="flex items-center gap-2 px-4 py-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors border border-gray-700">
						<Upload class="w-5 h-5 text-gray-400" />
						<span class="text-sm font-medium">Upload</span>
						<input 
							type="file" 
							accept="audio/*" 
							onchange={handleFileUpload}
							class="hidden"
						/>
					</label>
					
					<button 
						class="flex items-center gap-2 px-4 py-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700"
						onclick={() => showInfoPanel = !showInfoPanel}
					>
						<Info class="w-5 h-5 text-gray-400" />
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Main Content -->
	<main class="max-w-[1600px] mx-auto px-6 py-8">
		<div class="grid grid-cols-12 gap-6">
			<!-- Left Sidebar - Pattern Selection -->
			<aside class="col-span-2 space-y-4">
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-4">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Pattern</h2>
					<div class="space-y-2">
						{#each Object.entries(patternPresets) as [key, preset]}
							<PresetButton
								label={preset.label}
								active={$paramsStore.pattern === key}
								color="cyan"
								size="sm"
								onClick={() => setPattern(key as typeof key)}
								class="w-full justify-start"
							/>
						{/each}
					</div>
				</div>
				
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-4">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Rate</h2>
					<div class="grid grid-cols-2 gap-2">
						{#each Object.entries(ratePresets) as [key, preset]}
							<PresetButton
								label={preset.label.split(' ')[0]}
								active={$paramsStore.rate === preset.default}
								color="magenta"
								size="sm"
								onClick={() => applyRatePreset(key as typeof key)}
							/>
						{/each}
					</div>
					<div class="mt-4 pt-4 border-t border-gray-800">
						<div class="text-center mb-2">
							<span class="text-2xl font-bold text-cyan-400">{$paramsStore.rate.toFixed(1)}</span>
							<span class="text-xs text-gray-500 ml-1">Hz</span>
						</div>
						<input
							type="range"
							min="0.5"
							max="30"
							step="0.1"
							bind:value={$paramsStore.rate}
							oninput={(e) => setRate(parseFloat(e.target.value))}
							class="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
						/>
					</div>
				</div>
			</aside>
			
			<!-- Center - Main Synth Engine -->
			<section class="col-span-7 space-y-4">
				<!-- Carrier Module -->
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
							<Activity class="w-4 h-4" />
							Carrier Signal
						</h2>
					</div>
					<div class="flex items-center gap-8">
						<div class="flex-1">
							<label class="block text-xs text-gray-500 mb-2">Waveform</label>
							<select 
								bind:value={$paramsStore.carrier} 
								onchange={(e) => setCarrier(e.target.value as any)}
								class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
							>
								{#each Object.entries(carrierPresets) as [key, preset]}
									<option value={key}>{preset.label}</option>
								{/each}
							</select>
						</div>
						{#if $paramsStore.carrier === 'sine'}
							<Knob
								label="Frequency"
								value={$paramsStore.carrierFreq}
								min={100}
								max={2000}
								step={10}
								unit="Hz"
								size="lg"
								color="cyan"
								onInput={(v) => setCarrierFreq(v)}
							/>
						{/if}
					</div>
				</div>
				
				<!-- Envelope Module -->
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
							<Settings class="w-4 h-4" />
							Pulse Envelope
						</h2>
					</div>
					<div class="flex justify-around">
						<Knob
							label="Attack"
							value={$paramsStore.envelope.attack}
							min={0.001}
							max={0.5}
							step={0.001}
							unit="s"
							color="green"
							onInput={(v) => updateEnvelope({ attack: v })}
						/>
						<Knob
							label="Decay"
							value={$paramsStore.envelope.decay}
							min={0.01}
							max={1.0}
							step={0.01}
							unit="s"
							color="cyan"
							onInput={(v) => updateEnvelope({ decay: v })}
						/>
						<Knob
							label="Duty Cycle"
							value={$paramsStore.envelope.dutyCycle}
							min={0.1}
							max={0.9}
							step={0.05}
							onInput={(v) => updateEnvelope({ dutyCycle: v })}
							color="magenta"
						/>
					</div>
				</div>
				
				<!-- Stereo Module -->
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Stereo Field</h2>
						<label class="flex items-center gap-2 text-xs text-gray-400">
							<input 
								type="checkbox" 
								bind:checked={$paramsStore.panSmooth}
								class="rounded border-gray-700 bg-gray-800 text-cyan-400 focus:ring-cyan-400"
							/>
							Smooth Pan
						</label>
					</div>
					<div class="flex justify-center gap-8">
						<Fader
							label="Left"
							value={$paramsStore.leftGain}
							min={0}
							max={1}
							step={0.01}
							color="cyan"
							onInput={(v) => setLeftGain(v)}
						/>
						<Fader
							label="Right"
							value={$paramsStore.rightGain}
							min={0}
							max={1}
							step={0.01}
							color="magenta"
							onInput={(v) => setRightGain(v)}
						/>
					</div>
				</div>
			</section>
			
			<!-- Right Sidebar - Visualizer -->
			<aside class="col-span-3 space-y-4">
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-4">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Oscilloscope</h2>
					<Visualizer 
						canvasId="oscilloscope"
						type="oscilloscope"
						color="cyan"
						width={280}
						height={120}
						class="w-full"
					/>
				</div>
				
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-4">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Spectrum</h2>
					<Visualizer 
						canvasId="spectrum"
						type="spectrum"
						color="magenta"
						width={280}
						height={120}
						class="w-full"
					/>
				</div>
				
				<div class="bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-4">
					<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Output Level</h2>
					<Visualizer 
						canvasId="meter"
						type="meter"
						color="green"
						width={280}
						height={80}
						class="w-full"
					/>
				</div>
			</aside>
		</div>
		
		<!-- Export Section -->
		<section class="mt-8 bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-bold text-white flex items-center gap-2">
					<Download class="w-5 h-5 text-cyan-400" />
					Export Audio
				</h2>
			</div>
			<div class="flex items-center gap-6">
				<div class="flex items-center gap-4">
					<div>
						<label class="block text-xs text-gray-500 mb-1">Duration</label>
						<select 
							bind:value={exportDuration}
							class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
						>
							<option value={30}>30 seconds</option>
							<option value={60}>1 minute</option>
							<option value={120}>2 minutes</option>
							<option value={300}>5 minutes</option>
							<option value={600}>10 minutes</option>
						</select>
					</div>
					<div>
						<label class="block text-xs text-gray-500 mb-1">Bit Depth</label>
						<select 
							bind:value={exportBitDepth}
							class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
						>
							<option value={16}>16-bit PCM</option>
							<option value={24}>24-bit PCM</option>
						</select>
					</div>
				</div>
				<button 
					class={cn(
						'flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ml-auto',
						isExporting 
							? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
							: 'bg-gradient-to-r from-emerald-400 to-green-500 text-[#0d0d0f] shadow-lg shadow-emerald-500/30 hover:scale-105'
					)}
					onclick={handleExport}
					disabled={isExporting || !isInitialized}
				>
					<Download class="w-5 h-5" />
					{isExporting ? 'Rendering...' : 'Export WAV'}
				</button>
			</div>
		</section>
		
		{#if showInfoPanel}
			<section class="mt-8 bg-gradient-to-br from-[#16161a] to-[#1f1f25] rounded-xl border border-gray-800 p-6">
				<h2 class="text-lg font-bold text-white mb-4">About Bilateral Isochronic Stimulation</h2>
				<div class="grid md:grid-cols-2 gap-6 text-gray-300">
					<div>
						<p class="mb-4">
							<strong class="text-cyan-400">Isochronic tones</strong> are evenly-spaced pulses of sound that can influence brainwave activity.
							Unlike binaural beats, isochronic tones use discrete amplitude-modulated pulses.
						</p>
						<p>
							<strong class="text-fuchsia-400">Bilateral stimulation</strong> alternates sound between left and right ears,
							a technique used in EMDR therapy to facilitate interhemispheric communication.
						</p>
					</div>
					<div>
						<h3 class="font-semibold text-white mb-2">Frequency Bands:</h3>
						<ul class="space-y-1 text-sm">
							<li><span class="text-cyan-400 font-mono">Δ Delta (0.5-3 Hz):</span> Deep sleep, healing</li>
							<li><span class="text-fuchsia-400 font-mono">Θ Theta (4-7 Hz):</span> Meditation, creativity, REM</li>
							<li><span class="text-emerald-400 font-mono">Α Alpha (8-12 Hz):</span> Relaxation, calm focus</li>
							<li><span class="text-amber-400 font-mono">Β Beta (13-30 Hz):</span> Alert concentration</li>
						</ul>
					</div>
				</div>
			</section>
		{/if}
	</main>
	
	<!-- Footer -->
	<footer class="border-t border-gray-800 mt-12">
		<div class="max-w-[1600px] mx-auto px-6 py-6">
			<div class="flex items-center justify-between text-sm text-gray-500">
				<p>NeonSynth - Browser-Native Bilateral Audio Synthesizer</p>
				<p>Built with Svelte 5 + Web Audio API</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(input[type="range"]) {
		-webkit-appearance: none;
		appearance: none;
	}
	
	:global(input[type="range"]::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: linear-gradient(135deg, #22d3ee, #3b82f6);
		cursor: pointer;
		box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
	}
	
	:global(input[type="range"]::-moz-range-thumb) {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: linear-gradient(135deg, #22d3ee, #3b82f6);
		cursor: pointer;
		border: none;
		box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
	}
</style>
