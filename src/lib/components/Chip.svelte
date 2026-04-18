<script lang="ts">
	let { active = false, label, color = 'cyan' }: { active?: boolean; label: string; color?: 'cyan' | 'magenta' | 'green' } = $props();

	const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
		cyan: { border: '#22d3ee', bg: 'rgba(34, 211, 238, 0.1)', text: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)' },
		magenta: { border: '#e879f9', bg: 'rgba(232, 121, 249, 0.1)', text: '#e879f9', glow: 'rgba(232, 121, 249, 0.3)' },
		green: { border: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', text: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' }
	};
	const c = $derived(colorMap[color] ?? colorMap.cyan);
</script>

<div class="chip" class:active data-color={color}>
	<span class="chip-text">{label}</span>
	{#if active}
		<span class="chip-dot" style="background: {c.text};"></span>
	{/if}
	<style>
		.chip {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 12px;
			border-radius: 20px;
			border: 1.5px solid {c.border};
			background: {c.bg};
			color: {c.text};
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.4px;
			cursor: default;
			transition: all 0.2s;
		}
		.chip:hover { box-shadow: 0 0 10px {c.glow}; }
		.chip.active { border-color: {c.border}; background: {c.bg}; }
		.chip-text { position: relative; z-index: 1; }
		.chip-dot {
			display: inline-block;
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: {c.text};
			box-shadow: 0 0 6px {c.glow};
		}
	</style>
</div>