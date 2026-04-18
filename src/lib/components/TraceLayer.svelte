<script lang="ts">
	import { waveformLeft, waveformRight, isPlaying } from '$lib/stores/audioStore';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		canvasId: string;
		type: 'oscilloscope' | 'spectrum' | 'meter';
		color: 'cyan' | 'magenta' | 'green';
		width: number;
		height: number;
		class?: string;
	}

	let { canvasId, type, color, width, height, class: className = '' }: Props = $props();
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animId: number;

	const colorMap = {
		cyan: { stroke: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { stroke: '#e879f9', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.5)' }
	};
	const colors = $derived(colorMap[color]);

	function drawWave(data: Float32Array, c: CanvasRenderingContext2D, w: number, h: number, color: string) {
		c.beginPath();
		c.lineWidth = 1.5;
		c.strokeStyle = color;
		c.shadowColor = color;
		c.shadowBlur = 6;
		const bufferLen = 2048;
		const slice = bufferLen / data.length;
		for (let i = 0; i < data.length; i++) {
			const x = i * slice;
			const y = h / 2 - data[i] * (h / 2) * 0.9;
			if (i === 0) c.moveTo(x, y);
			else c.lineTo(x, y);
		}
		c.stroke();
		c.shadowBlur = 0;

		c.beginPath();
		c.lineTo(w, h / 2);
		for (let i = data.length - 1; i >= 0; i--) {
			const x = i * slice;
			const y = h / 2 - data[i] * (h / 2) * 0.9;
			c.lineTo(x, y);
		}
		c.closePath();
		const grad = c.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, 'rgba(34, 211, 238, 0.06)');
		grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
		c.fillStyle = grad;
		c.fill();
	}

	function drawOscilloscope() {
		if (!ctx) return;
		const w = width;
		const h = height;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = '#08080c';
		ctx.fillRect(0, 0, w, h);

		drawWave($waveformLeft, ctx, w, h, colors.stroke);

		ctx.save();
		ctx.translate(w, 0);
		ctx.scale(-1, 1);
		drawWave($waveformRight, ctx, w, h, '#e879f9');
		ctx.restore();

		ctx.strokeStyle = 'rgba(255,255,255,0.04)';
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		for (let i = 1; i < 8; i++) {
			const y = (h / 8) * i;
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
		}
		ctx.stroke();
	}

	function drawSpectrum() {
		if (!ctx) return;
		const w = width;
		const h = height;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = '#08080c';
		ctx.fillRect(0, 0, w, h);
		ctx.beginPath();
	}

	function drawMeter() {
		if (!ctx) return;
		const w = width;
		const h = height;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = '#08080c';
		ctx.fillRect(0, 0, w, h);

		const lvl = Math.min(1, Math.max($waveformLeft, $waveformRight) * 3);
		const barH = (h / 3) * lvl;
		const gradient = ctx.createLinearGradient(0, h, 0, h - barH);
		gradient.addColorStop(0, colors.stroke);
		gradient.addColorStop(1, '#3b82f6');
		ctx.fillStyle = gradient;
		ctx.shadowColor = colors.glow;
		ctx.shadowBlur = 10;
		ctx.fillRect(0, h * (1 - lvl), w, h * lvl);
		ctx.shadowBlur = 0;
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		ctx.scale(dpr, dpr);

		function render() {
			switch (type) {
				case 'oscilloscope': drawOscilloscope(); break;
				case 'spectrum': drawSpectrum(); break;
				case 'meter': drawMeter(); break;
			}
			animId = requestAnimationFrame(render);
		}
		render();
	});

	onDestroy(() => {
		if (animId) cancelAnimationFrame(animId);
	});
</script>

<canvas
	id={canvasId}
	bind:this={canvas}
	class={className}
	{width}
	{height}
	style="background: #08080c;"
></canvas>

<style>
	canvas { display: block; }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>