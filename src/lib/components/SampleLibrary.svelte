<script lang="ts">
	import { soundLibrary, selectedSampleId, isPlaying, activeCarriers, toggleCarrier, type CarrierType } from '$lib/stores/audioStore';

	let isLoadingSample = $state(false);

	async function loadSample(id: string) {
		selectedSampleId.set(id);
		isLoadingSample = true;
		const entry = soundLibrary.find((s: { id: string }) => s.id === id);
		if (!entry) { isLoadingSample = false; return; }
		try {
			const response = await fetch(`/sounds/${entry.filename}`);
			const arrayBuffer = await response.arrayBuffer();
			const ctx = new AudioContext();
			const buffer = await ctx.decodeAudioData(arrayBuffer);
			const { sampleAudioBuffer } = await import('$lib/stores/audioStore');
			sampleAudioBuffer.set(buffer);
			await ctx.close();
		} catch (e) {
			console.error('Failed to load sample:', e);
		}
		isLoadingSample = false;
	}
</script>

<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
	{#each soundLibrary as entry}
		<button
			class="text-left px-2 py-1.5 rounded-lg border transition-all text-[10px]"
			style="
				background: {$selectedSampleId === entry.id ? 'rgba(52, 211, 153, 0.15)' : 'var(--ns-bg-surface)'};
				border-color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-border)'};
				color: {$selectedSampleId === entry.id ? 'var(--ns-accent-tertiary)' : 'var(--ns-text-secondary)'};
				box-shadow: {$selectedSampleId === entry.id ? '0 0 8px rgba(52, 211, 153, 0.3)' : 'none'};
			"
			onclick={() => loadSample(entry.id)}
			disabled={isLoadingSample}
		>
			<div class="font-semibold">{entry.label}</div>
		</button>
	{/each}
</div>