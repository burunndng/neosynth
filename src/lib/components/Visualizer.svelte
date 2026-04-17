<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import {
		waveformLeft,
		waveformRight,
		spectrumData,
		levelLeft,
		levelRight,
		isPlaying
	} from '$lib/stores/audioStore';
	import { onDestroy } from 'svelte';

	interface Props {
		canvasId: string;
		type?: 'oscilloscope' | 'spectrum' | 'meter';
		color?: 'cyan' | 'magenta' | 'green';
		width?: number;
		height?: number;
		class?: string;
	}

	let {
		canvasId,
		type = 'oscilloscope',
		color = 'cyan',
		width = 300,
		height = 150,
		class: className = ''
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let animFrameId: number;

	const colorMap = {
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;
		const colors = colorMap[color];

		ctx.fillStyle = 'rgba(13, 13, 15, 0.3)';
		ctx.fillRect(0, 0, w, h);

		if (type === 'oscilloscope') {
			const data = color === 'magenta' ? $waveformRight : $waveformLeft;
			if (!data || data.length === 0) { animFrameId = requestAnimationFrame(draw); return; }

			ctx.lineWidth = 2;
			ctx.strokeStyle = colors.primary;
			ctx.shadowColor = colors.glow;
			ctx.shadowBlur = 10;
			ctx.beginPath();

			const sliceWidth = w / data.length;
			let x = 0;

			for (let i = 0; i < data.length; i++) {
				const v = (data[i] + 1) / 2;
				const y = v * h;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
				x += sliceWidth;
			}

			ctx.stroke();
			ctx.shadowBlur = 0;
		} else if (type === 'spectrum') {
			const data = $spectrumData;
			if (!data || data.length === 0) { animFrameId = requestAnimationFrame(draw); return; }

			const barWidth = (w / data.length) * 2.5;
			let x = 0;

			for (let i = 0; i < data.length; i++) {
				const normalized = Math.max(0, (data[i] + 140) / 140);
				const barHeight = normalized * h;

				const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
				gradient.addColorStop(0, colors.primary);
				gradient.addColorStop(1, colors.secondary);

				ctx.fillStyle = gradient;
				ctx.shadowColor = colors.glow;
				ctx.shadowBlur = 5;
				ctx.fillRect(x, h - barHeight, barWidth, barHeight);
				ctx.shadowBlur = 0;

				x += barWidth + 1;
			}
		} else if (type === 'meter') {
			const level = Math.max($levelLeft, $levelRight);
			const pct = Math.min(1, level * 3);

			ctx.fillStyle = '#1f2937';
			ctx.fillRect(0, 0, w, h);

			const gradient = ctx.createLinearGradient(0, h, 0, 0);
			gradient.addColorStop(0, colors.secondary);
			gradient.addColorStop(0.7, colors.primary);
			gradient.addColorStop(1, '#ffffff');

			ctx.fillStyle = gradient;
			ctx.shadowColor = colors.glow;
			ctx.shadowBlur = 10;
			ctx.fillRect(0, h * (1 - pct), w, h * pct);
			ctx.shadowBlur = 0;

			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, h * (1 - pct) - 2, w, 2);
		}

		animFrameId = requestAnimationFrame(draw);
	}

	$effect(() => {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;
			animFrameId = requestAnimationFrame(draw);
		}
		return () => {
			if (animFrameId) cancelAnimationFrame(animFrameId);
		};
	});
</script>

<canvas
	bind:this={canvas}
	id={canvasId}
	class={cn(
		'rounded-lg bg-gray-900/50 backdrop-blur-sm',
		'ring-1 ring-gray-800',
		className
	)}
	{width}
	{height}
></canvas>