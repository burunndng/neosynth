<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import {
		waveformLeft,
		waveformRight,
		spectrumData,
		levelLeft,
		levelRight,
		isPlaying,
		currentRate
	} from '$lib/stores/audioStore';
	import { onDestroy } from 'svelte';

	interface Props {
		canvasId: string;
		type?: 'bilateral' | 'spectrum' | 'meter';
		color?: 'cyan' | 'magenta' | 'green';
		width?: number;
		height?: number;
		class?: string;
	}

	let {
		canvasId,
		type = 'bilateral',
		color = 'cyan',
		width = 800,
		height = 300,
		class: className = ''
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let animFrameId: number;

	const TRAIL_COUNT = 4;
	const trailFrames: Float32Array[] = [];
	for (let i = 0; i < TRAIL_COUNT; i++) {
		trailFrames.push(new Float32Array(2048));
	}
	let trailFramesR: Float32Array[] = [];
	for (let i = 0; i < TRAIL_COUNT; i++) {
		trailFramesR.push(new Float32Array(2048));
	}

	const colorMap = {
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	let idlePhase = 0;

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;
		const mainH = type === 'bilateral' ? h - 48 : h;

		ctx.fillStyle = '#08080c';
		ctx.fillRect(0, 0, w, h);

		if (type === 'bilateral') {
			drawBilateralWaveform(ctx, w, mainH);
			drawMiniSpectrum(ctx, w, h, mainH);
		} else if (type === 'spectrum') {
			drawSpectrum(ctx, w, h);
		} else if (type === 'meter') {
			drawMeter(ctx, w, h);
		}

		animFrameId = requestAnimationFrame(draw);
	}

	function drawBilateralWaveform(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const rateNow = $currentRate;
		const pulse = 0.6 + Math.sin(idlePhase * 2) * 0.4;
		const glowAlpha = 0.10 * pulse;
		const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.55);
		vg.addColorStop(0, `rgba(34, 211, 238, ${glowAlpha.toFixed(3)})`);
		vg.addColorStop(0.6, 'rgba(34, 211, 238, 0)');
		vg.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = vg;
		ctx.fillRect(0, 0, w, h);
		idlePhase += 0.008 + rateNow * 0.002;

		ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
		const gridSize = 20;
		for (let x = gridSize; x < w; x += gridSize) {
			for (let y = gridSize; y < h; y += gridSize) {
				ctx.beginPath();
				ctx.arc(x, y, 0.5, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
		ctx.lineWidth = 0.5;
		for (let i = 1; i < 8; i++) {
			const y = (h / 8) * i;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}
		for (let i = 1; i < 16; i++) {
			const x = (w / 16) * i;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();

		const dataL = $waveformLeft;
		const dataR = $waveformRight;
		const playing = $isPlaying;

		if (playing && dataL && dataL.length > 0) {
			for (let i = TRAIL_COUNT - 1; i > 0; i--) {
				trailFrames[i].set(trailFrames[i - 1]);
				trailFramesR[i].set(trailFramesR[i - 1]);
			}
			trailFrames[0].set(dataL);
			trailFramesR[0].set(dataR);

			const trailOpacities = [0.08, 0.05, 0.03];
			for (let t = TRAIL_COUNT - 1; t >= 1; t--) {
				drawWaveformLine(ctx, trailFrames[t], w, h, '#22d3ee', trailOpacities[t - 1] || 0.02, 1);
				drawWaveformLine(ctx, trailFramesR[t], w, h, '#e879f9', trailOpacities[t - 1] || 0.02, 1);
			}

			drawWaveformLine(ctx, dataL, w, h, '#22d3ee', 1, 2);
			drawWaveformLine(ctx, dataR, w, h, '#e879f9', 1, 2);
		} else {
			const breathAmp = 0.15 + Math.sin(idlePhase * 0.5) * 0.05;
			const idleData = new Float32Array(256);
			for (let i = 0; i < 256; i++) {
				idleData[i] = Math.sin((i / 256) * Math.PI * 4 + idlePhase) * breathAmp;
			}
			drawWaveformLine(ctx, idleData, w, h, '#22d3ee', 0.25, 1.5);
			const idleDataR = new Float32Array(256);
			for (let i = 0; i < 256; i++) {
				idleDataR[i] = Math.sin((i / 256) * Math.PI * 4 + idlePhase + Math.PI) * breathAmp;
			}
			drawWaveformLine(ctx, idleDataR, w, h, '#e879f9', 0.25, 1.5);
		}

		ctx.save();
		ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
		ctx.lineWidth = 1;
		ctx.setLineDash([4, 6]);
		ctx.beginPath();
		ctx.moveTo(0, h / 2); ctx.lineTo(w / 2 - 18, h / 2);
		ctx.moveTo(w / 2 + 18, h / 2); ctx.lineTo(w, h / 2);
		ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h / 2 - 18);
		ctx.moveTo(w / 2, h / 2 + 18); ctx.lineTo(w / 2, h);
		ctx.stroke();
		ctx.restore();

		ctx.font = '9px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
		ctx.fillText('DEPTH', w / 2, 12);
		ctx.fillText('RATE',  w / 2, h - 6);
		ctx.textAlign = 'left';
		ctx.fillStyle = 'rgba(232, 121, 249, 0.35)';
		ctx.fillText('A / L', 6, h / 2 + 3);
		ctx.textAlign = 'right';
		ctx.fillText('B / R', w - 6, h / 2 + 3);

		ctx.font = '10px Inter, system-ui, sans-serif';
		ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
		ctx.textAlign = 'left';
		ctx.fillText('L', 8, 16);
		ctx.fillStyle = 'rgba(232, 121, 249, 0.6)';
		ctx.textAlign = 'right';
		ctx.fillText('R', w - 8, 16);

		ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(4, 4); ctx.lineTo(4, 20);
		ctx.moveTo(4, 4); ctx.lineTo(20, 4);
		ctx.stroke();

		ctx.strokeStyle = 'rgba(232, 121, 249, 0.2)';
		ctx.beginPath();
		ctx.moveTo(w - 4, 4); ctx.lineTo(w - 4, 20);
		ctx.moveTo(w - 4, 4); ctx.lineTo(w - 20, 4);
		ctx.stroke();

		const rate = $currentRate;
		ctx.font = 'bold 28px Inter, system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.shadowColor = 'rgba(34, 211, 238, 0.4)';
		ctx.shadowBlur = 16;
		ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
		ctx.fillText(rate.toFixed(1), w / 2, h / 2 + 10);
		ctx.shadowBlur = 0;

		ctx.font = '11px Inter, system-ui, sans-serif';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
		ctx.fillText('Hz', w / 2 + 30, h / 2 + 10);
	}

	function drawWaveformLine(
		ctx: CanvasRenderingContext2D,
		data: Float32Array,
		w: number,
		h: number,
		color: string,
		alpha: number,
		lineWidth: number
	) {
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = alpha > 0.5 ? 8 : 4;
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
		ctx.restore();
	}

	function drawMiniSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number, mainH: number) {
		const stripY = mainH;
		const stripH = h - mainH;
		const data = $spectrumData;

		if (!data || data.length === 0) return;

		ctx.fillStyle = 'rgba(8, 8, 12, 0.9)';
		ctx.fillRect(0, stripY, w, stripH);

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, stripY); ctx.lineTo(w, stripY);
		ctx.stroke();

		const barCount = 64;
		const barWidth = (w - 20) / barCount;

		for (let i = 0; i < barCount; i++) {
			const dataIdx = Math.floor(i * (data.length / barCount));
			const normalized = Math.max(0, (data[dataIdx] + 140) / 140);
			const barHeight = normalized * stripH * 0.8;

			const t = i / barCount;
			let r: number, g: number, b: number;
			if (t < 0.5) {
				const p = t * 2;
				r = Math.round(34 + (232 - 34) * p);
				g = Math.round(211 + (121 - 211) * p);
				b = Math.round(238 + (249 - 238) * p);
			} else {
				const p = (t - 0.5) * 2;
				r = Math.round(232 + (249 - 232) * p);
				g = Math.round(121 + (115 - 121) * p);
				b = Math.round(249 + (22 - 249) * p);
			}

			const barX = 10 + i * barWidth;
			ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
			ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
			ctx.shadowBlur = 4;
			ctx.fillRect(barX, stripY + stripH - barHeight - 2, barWidth - 1, barHeight);
		}
		ctx.shadowBlur = 0;

		const meterL = Math.min(1, $levelLeft * 3);
		const meterR = Math.min(1, $levelRight * 3);

		ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
		ctx.shadowColor = 'rgba(34, 211, 238, 0.3)';
		ctx.shadowBlur = 4;
		ctx.fillRect(2, stripY + stripH * (1 - meterL), 4, stripH * meterL);

		ctx.fillStyle = 'rgba(232, 121, 249, 0.6)';
		ctx.shadowColor = 'rgba(232, 121, 249, 0.3)';
		ctx.fillRect(w - 6, stripY + stripH * (1 - meterR), 4, stripH * meterR);
		ctx.shadowBlur = 0;
	}

	function drawSpectrum(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const data = $spectrumData;
		if (!data || data.length === 0) return;

		const colors = colorMap[color];
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
	}

	function drawMeter(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const level = Math.max($levelLeft, $levelRight);
		const pct = Math.min(1, level * 3);
		const colors = colorMap[color];

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
		'rounded-xl',
		className
	)}
	{width}
	{height}
	style="background: #08080c;"
></canvas>
