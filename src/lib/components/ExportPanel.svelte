<script lang="ts">
	import { exportDuration, exportBitDepth } from '$lib/stores/audioStore';
	import { engine } from '$lib/audio/AudioEngine';

	let isRendering = $state(false);

	async function handleExport() {
		if (isRendering) return;
		isRendering = true;
		try {
			const blob = await engine.renderOffline($exportDuration, $exportBitDepth);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `neon-synth-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Export failed:', e);
		} finally {
			isRendering = false;
		}
	}
</script>

<div class="export-panel">
	<div class="export-row">
		<label class="export-label">Duration</label>
		<select bind:value={$exportDuration}>
			<option value={30}>30 seconds</option>
			<option value={60}>1 minute</option>
			<option value={120}>2 minutes</option>
			<option value={300}>5 minutes</option>
			<option value={600}>10 minutes</option>
		</select>
	</div>
	<div class="export-row">
		<label class="export-label">Bit Depth</label>
		<select bind:value={$exportBitDepth}>
			<option value={16}>16-bit PCM</option>
			<option value={24}>24-bit PCM</option>
		</select>
	</div>
	<button class="export-btn" disabled={isRendering} onclick={handleExport}>
		{isRendering ? 'Rendering...' : 'Export WAV'}
	</button>
</div>

<style>
	.export-panel {
		background: #0e1016;
		border: 1px solid #1e293b;
		border-radius: 10px;
		padding: 16px;
	}
	.export-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}
	.export-row:last-child { margin-bottom: 0; }
	.export-label {
		width: 90px;
		font-size: 12px;
		color: #94a3b8;
		font-weight: 600;
	}
	select {
		flex: 1;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 8px;
		padding: 6px 10px;
		color: #e2e8f0;
		font-size: 13px;
		outline: none;
	}
	select:focus { border-color: #22d3ee; }
	button {
		width: 100%;
		padding: 10px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 14px;
		background: linear-gradient(135deg, #1e40af, #1e3a8a);
		color: white;
		border: none;
		cursor: pointer;
		transition: transform 0.05s;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	button:not(:disabled):hover {
		transform: translateY(-1px);
	}
</style>