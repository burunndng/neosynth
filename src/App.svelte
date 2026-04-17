<script lang="ts">
	import { engine } from '$lib/audio/AudioEngine';
	import { 
		isPlaying,
		pattern,
		ratePreset,
		rateValue,
		currentRate,
		activeCarriers,
		carrierFreq,
		attackTime,
		decayTime,
		dutyCycle,
		leftGain,
		rightGain,
		userAudioBuffer,
		userAudioGain,
		masterGain,
		exportDuration,
		exportBitDepth,
		waveformLeft,
		waveformRight,
		levelLeft,
		levelRight,
		spectrumData,
		soundLibrary,
		selectedSampleId,
		sampleAudioBuffer,
		toggleCarrier,
		type CarrierType
	} from '$lib/stores/audioStore';
	import Visualizer from '$lib/components/Visualizer.svelte';
	import Knob from '$lib/components/Knob.svelte';
	import Fader from '$lib/components/Fader.svelte';
	import PresetButton from '$lib/components/PresetButton.svelte';
	import PanelFrame from '$lib/components/PanelFrame.svelte';
	import CableLayer from '$lib/components/CableLayer.svelte';
	import { createCablePortRegistry } from '$lib/utils/cablePorts';
	import { Play, Square, Upload, Download, Info, AlertTriangle, Activity } from 'lucide-svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { measurePort } from '$lib/utils/cablePorts';

	const cableRegistry = createCablePortRegistry();
	let cableLayerContainer: HTMLDivElement | null = $state(null);
	$effect(() => {
	  cableRegistry.container.set(cableLayerContainer);
	});

	const connections = [
	  { from: 'pattern',        to: 'field-left' },
	  { from: 'rate',           to: 'field-left' },
	  { from: 'carriers',       to: 'field-left' },
	  { from: 'envelope',       to: 'field-right' },
	  { from: 'stereo',         to: 'field-right' },
	  { from: 'export',         to: 'field-right' },
	  { from: 'sample-library', to: 'field-bottom' }
	];
	
	function cn(...classes: Array<string | undefined | null | false>): string {
		return classes.filter(Boolean).join(' ');
	}
	
	let isInitialized = $state(false);
	let showSafetyModal = $state(false);
	let showInfoPanel = $state(false);
	let isExporting = $state(false);
	let visualizerAnimationId: number | null = null;
	
	const patternPresets = {
		pure: { label: 'Pure', icon: '⇄' },
		mirrored: { label: 'Mirror', icon: '⟷' },
		asymmetric: { label: 'Asym', icon: '≠' },
		clustered: { label: 'Cluster', icon: '⋯' },
		randomized: { label: 'Random', icon: '⚡' }
	};
	
	const ratePresets = {
		delta: { label: 'Delta', range: '0.5-3 Hz', default: 2 },
		theta: { label: 'Theta', range: '4-7 Hz', default: 6 },
		alpha: { label: 'Alpha', range: '8-12 Hz', default: 10 },
		beta: { label: 'Beta', range: '13-30 Hz', default: 20 },
		emdr: { label: 'EMDR', range: '1-3 Hz', default: 2 }
	};

	let isLoadingSample = $state(false);

	let fieldLeftPortEl: HTMLDivElement | null = $state(null);
	let fieldRightPortEl: HTMLDivElement | null = $state(null);
	let fieldBottomPortEl: HTMLDivElement | null = $state(null);

	$effect(() => {
	  void $isPlaying;
	  void $activeCarriers;
	  tick().then(registerFieldPorts);
	});

	function registerFieldPorts() {
	  if (!cableLayerContainer) return;
	  const pairs: Array<[HTMLDivElement | null, string, 'left'|'right'|'bottom', 'cyan'|'green']> = [
	    [fieldLeftPortEl,   'field-left',   'left',   'cyan'],
	    [fieldRightPortEl,  'field-right',  'right',  'cyan'],
	    [fieldBottomPortEl, 'field-bottom', 'bottom', 'green']
	  ];
	  for (const [el, id, edge, accent] of pairs) {
	    if (!el) continue;
	    const { x, y } = measurePort(el, cableLayerContainer);
	    cableRegistry.set({ id, x, y, edge, accent, active: $isPlaying });
	  }
	}

	$effect(() => {
	  // re-run on any reactive trigger
	  void $isPlaying;
	  void $activeCarriers;
	  tick().then(registerFieldPorts);
	});

	onMount(() => {
	  const ro = new ResizeObserver(() => registerFieldPorts());
	  if (cableLayerContainer) ro.observe(cableLayerContainer);
	  window.addEventListener('resize', registerFieldPorts);
	  window.addEventListener('scroll', registerFieldPorts, true);
	  return () => {
	    ro.disconnect();
	    window.removeEventListener('resize', registerFieldPorts);
	    window.removeEventListener('scroll', registerFieldPorts, true);
	  };
	});

	async function loadSample(id: string) {
		selectedSampleId.set(id);
		isLoadingSample = true;
		const entry = soundLibrary.find((s: { id: string; label: string; filename: string; description: string }) => s.id === id);
		if (!entry) { isLoadingSample = false; return; }
		try {
			const response = await fetch(`/sounds/${entry.filename}`);
			const arrayBuffer = await response.arrayBuffer();
			const ctx = new AudioContext();
			const buffer = await ctx.decodeAudioData(arrayBuffer);
			sampleAudioBuffer.set(buffer);
			await ctx.close();
			if ($isPlaying) updateEngineConfig();
		} catch (e) {
			console.error('Failed to load sample:', e);
		}
		isLoadingSample = false;
	}
	
	async function handleInitialize() {
		console.log('INIT CLICK', isInitialized);
		if (!isInitialized) {
			try {
				await engine.init();
				isInitialized = true;
				showSafetyModal = true;
				startVisualizerLoop();
				console.log('INIT DONE');
			} catch(e) {
				console.error('INIT FAILED', e);
			}
		}
	}
	
	function startVisualizerLoop() {
		function update() {
			if (!$isPlaying) {
				waveformLeft.set(new Float32Array(2048));
				waveformRight.set(new Float32Array(2048));
				levelLeft.set(0);
				levelRight.set(0);
				spectrumData.set(new Float32Array(128));
			} else {
				const data = engine.getAnalyserData();
				waveformLeft.set(data.waveformLeft);
				waveformRight.set(data.waveformRight);
				levelLeft.set(data.levelLeft);
				levelRight.set(data.levelRight);
				spectrumData.set(data.spectrum);
			}
			visualizerAnimationId = requestAnimationFrame(update);
		}
		update();
	}

	onDestroy(() => {
		if (visualizerAnimationId !== null) {
			cancelAnimationFrame(visualizerAnimationId);
		}
	});
	
	function handlePlay() {
		if (!isInitialized) return;
		if ($isPlaying) {
			engine.stop();
			isPlaying.set(false);
		} else {
			updateEngineConfig();
			engine.play();
			isPlaying.set(true);
		}
	}
	
	function updateEngineConfig() {
		engine.updateConfig({
			pattern: $pattern,
			rate: $currentRate,
			carrierTypes: $activeCarriers,
			carrierFreq: $carrierFreq,
			attack: $attackTime,
			decay: $decayTime,
			dutyCycle: $dutyCycle,
			leftGain: $leftGain,
			rightGain: $rightGain,
			masterGain: $masterGain,
			userAudioBuffer: $userAudioBuffer,
			userAudioGain: $userAudioGain,
			sampleBuffer: $sampleAudioBuffer
		});
	}
	
	function setPattern(p: keyof typeof patternPresets) {
		pattern.set(p);
		if ($isPlaying) updateEngineConfig();
	}
	
	function setRatePreset(p: keyof typeof ratePresets) {
		ratePreset.set(p);
		rateValue.set(ratePresets[p].default);
		if ($isPlaying) updateEngineConfig();
	}

	function applyRatePreset(p: keyof typeof ratePresets) {
		setRatePreset(p);
	}

	function setRate(value: number) {
		rateValue.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function setCarrier(type: CarrierType) {
		toggleCarrier(type);
		if (type === 'sample' && !$sampleAudioBuffer) {
			loadSample($selectedSampleId);
		}
		if ($isPlaying) updateEngineConfig();
	}

	function setCarrierFreq(value: number) {
		carrierFreq.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function updateEnvelope(values: { attack?: number; decay?: number; dutyCycle?: number }) {
		if (values.attack !== undefined) attackTime.set(values.attack);
		if (values.decay !== undefined) decayTime.set(values.decay);
		if (values.dutyCycle !== undefined) dutyCycle.set(values.dutyCycle);
		if ($isPlaying) updateEngineConfig();
	}

	function setLeftGain(value: number) {
		leftGain.set(value);
		if ($isPlaying) updateEngineConfig();
	}

	function setRightGain(value: number) {
		rightGain.set(value);
		if ($isPlaying) updateEngineConfig();
	}
	
	function handleFileUpload(event: Event) {
		try {
			const input = event.target as HTMLInputElement;
			const file = input.files?.[0];
			if (!file || !engine) return;
			const ctx = new AudioContext();
			const reader = new FileReader();
			reader.onload = async () => {
				try {
					const arrayBuffer = reader.result as ArrayBuffer;
					const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
					userAudioBuffer.set(audioBuffer);
					await ctx.close();
					if ($isPlaying) updateEngineConfig();
				} catch (error) {
					console.error('Failed to load audio:', error);
					await ctx.close();
				}
			};
			reader.readAsArrayBuffer(file);
			input.value = '';
		} catch (error) {
			console.error('File upload error:', error);
		}
	}
	
	async function handleExport() {
		if (!isInitialized || isExporting) return;
		isExporting = true;
		updateEngineConfig();
		try {
			const blob = await engine.renderOffline($exportDuration, $exportBitDepth);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `neon-synth-bilateral-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.wav`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			isExporting = false;
		}
	}
	
	function closeSafetyModal() {
		showSafetyModal = false;
	}
	
	$effect(() => {
		if ($isPlaying) {
			updateEngineConfig();
		}
	});
</script>

<div class="min-h-screen bg-[var(--ns-bg-deep)] text-[var(--ns-text-primary)]">
	{#if !isInitialized}
		<button class="fixed inset-0 w-full h-full border-none cursor-pointer flex items-center justify-center z-50" style="background: radial-gradient(ellipse at center, #0d0d18 0%, var(--ns-bg-deep) 70%);" onclick={handleInitialize}>
			<div class="text-center space-y-6">
				<div class="space-y-2">
					<h1 class="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
						NEONSYNTH
					</h1>
					<p style="color: #9ca3af;" class="text-sm uppercase tracking-widest">Bilateral Isochronic Audio Synthesizer</p>
				</div>
				<div class="w-48 h-0.5 mx-auto rounded-full overflow-hidden" style="background: #14151f;">
					<div class="h-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse" style="width: 100%"></div>
				</div>
				<p style="color: #4b5563;" class="text-xs uppercase tracking-wider">Click anywhere to initialize</p>
			</div>
		</button>
	{/if}
	
	{#if showSafetyModal}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
			<div class="ns-panel max-w-md w-full p-8 space-y-6">
				<div class="flex items-center gap-3" style="color: #fbbf24;">
					<AlertTriangle class="w-6 h-6" />
					<h2 class="text-lg font-bold uppercase tracking-wider">Safety Notice</h2>
				</div>
				<div class="space-y-3" style="color: var(--ns-text-secondary);">
					<p class="font-medium text-sm">This tool produces bilateral auditory stimulation.</p>
					<ul class="space-y-1.5 text-xs">
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Use at comfortable volume levels</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Discontinue if you experience discomfort or dizziness</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Not recommended for individuals with epilepsy</li>
						<li class="flex items-start gap-2"><span style="color: var(--ns-accent-primary);">•</span> Consult a healthcare professional if you have medical conditions</li>
					</ul>
					<p style="color: var(--ns-text-dim);" class="text-[10px] italic">For educational/experimental purposes only. Not medical equipment.</p>
				</div>
				<button 
					class="w-full py-2.5 px-6 rounded-lg font-bold uppercase tracking-wider text-sm transition-all hover:scale-105"
					style="background: linear-gradient(135deg, var(--ns-accent-primary), #3b82f6); color: var(--ns-bg-deep); box-shadow: 0 0 20px var(--ns-glow-primary);"
					onclick={closeSafetyModal}
				>
					I Understand
				</button>
			</div>
		</div>
	{/if}

	<header class="sticky top-0 z-40" style="background: rgba(8,8,12,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid var(--ns-border);">
		<div class="max-w-[1800px] mx-auto px-6" style="height: 48px;">
			<div class="flex items-center justify-between h-full">
				<div class="flex items-center gap-3" style="color: var(--ns-accent-primary);">
  <span class="ns-led {isInitialized ? ($isPlaying ? 'pulse' : '') : 'dim'}"></span>
				</div>
  <h1 class="text-lg font-extrabold uppercase tracking-widest bg-gradient-to-r from-[var(--ns-accent-primary)] to-[var(--ns-accent-secondary)] bg-clip-text text-transparent">
    NEONSYNTH
  </h1>
			</div>
		</div>
	</header>
	
	<div style="padding: 20px; background: cyan; color: black;">
		isInitialized: {isInitialized} | showSafetyModal: {showSafetyModal}
	</div>
</div>