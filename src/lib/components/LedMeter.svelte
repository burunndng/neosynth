<script lang="ts">
	import { levelLeft, levelRight } from '$lib/stores/audioStore';

	let { color = 'green' }: { color?: 'cyan' | 'magenta' | 'green' } = $props();

	const colorMap = {
		cyan: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.6)' },
		magenta: { primary: '#e879f9', glow: 'rgba(232, 121, 249, 0.6)' },
		green: { primary: '#34d399', glow: 'rgba(52, 211, 153, 0.6)' }
	};

	const lvl = $derived(Math.min(1, Math.max($levelLeft, $levelRight) * 3));
	const c = $derived(colorMap[color]);
	const barH = $derived(lvl * 100);
</script>

<div class="led-meter">
	<div class="meter-track">
		<div class="meter-fill" style="height: {barH}%; background: {c.glow}; box-shadow: 0 0 10px {c.glow};">
			<div class="meter-peak" style="background: {c.primary};"></div>
		</div>
	</div>
	<span class="led-label"><slot /></span>
</div>

<style>
	.led-meter {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	.meter-track {
		width: 22px;
		height: 80px;
		border-radius: 3px;
		background: #0f1724;
		border: 1px solid #1e293b;
		position: relative;
		overflow: hidden;
	}
	.meter-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		border-radius: 3px;
		transition: height 0.08s linear;
	}
	.meter-peak {
		position: absolute;
		top: -4px;
		left: -1px;
		right: -1px;
		height: 2px;
		border-radius: 1px;
		z-index: 2;
	}
	.led-label {
		font-size: 10px;
		color: #94a3b8;
		letter-spacing: 0.6px;
		font-variant-numeric: tabular-nums;
	}
</style>