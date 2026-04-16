<script lang="ts">
	import { cn } from '$lib/utils/cn';

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
	let animationFrame: number;
	let analyser: AnalyserNode | null = null;
	let dataArray: Uint8Array | null = null;

	const colorMap = {
		cyan: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
		magenta: { primary: '#e879f9', secondary: '#ec4899', glow: 'rgba(232, 121, 249, 0.5)' },
		green: { primary: '#34d399', secondary: '#22c55e', glow: 'rgba(52, 211, 153, 0.5)' }
	};

	function setAnalyser(node: AnalyserNode) {
		analyser = node;
		if (type === 'oscilloscope' || type === 'spectrum') {
			analyser.fftSize = 2048;
			const bufferLength = type === 'oscilloscope' 
				? analyser.fftSize 
				: analyser.frequencyBinCount;
			dataArray = new Uint8Array(bufferLength);
		} else {
			analyser.fftSize = 256;
			dataArray = new Uint8Array(analyser.frequencyBinCount);
		}
		draw();
	}

	function draw() {
		if (!canvas || !analyser || !dataArray) {
			animationFrame = requestAnimationFrame(draw);
			return;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const colors = colorMap[color];
		const w = canvas.width;
		const h = canvas.height;

		// Clear with fade effect for trail
		ctx.fillStyle = 'rgba(13, 13, 15, 0.2)';
		ctx.fillRect(0, 0, w, h);

		if (type === 'oscilloscope') {
			analyser.getByteTimeDomainData(dataArray);
			
			ctx.lineWidth = 2;
			ctx.strokeStyle = colors.primary;
			ctx.shadowColor = colors.glow;
			ctx.shadowBlur = 10;
			ctx.beginPath();

			const sliceWidth = w / dataArray.length;
			let x = 0;

			for (let i = 0; i < dataArray.length; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * h) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}

			ctx.lineTo(w, h / 2);
			ctx.stroke();
			ctx.shadowBlur = 0;
		} else if (type === 'spectrum') {
			analyser.getByteFrequencyData(dataArray);

			const barWidth = (w / dataArray.length) * 2.5;
			let x = 0;

			for (let i = 0; i < dataArray.length; i++) {
				const barHeight = (dataArray[i] / 255) * h;
				
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
			analyser.getByteFrequencyData(dataArray);
			
			// Calculate RMS
			let sum = 0;
			for (let i = 0; i < dataArray.length; i++) {
				sum += dataArray[i] * dataArray[i];
			}
			const rms = Math.sqrt(sum / dataArray.length);
			const level = rms / 255;

			// Draw meter background
			ctx.fillStyle = '#1f2937';
			ctx.fillRect(0, 0, w, h);

			// Draw level
			const gradient = ctx.createLinearGradient(0, h, 0, 0);
			gradient.addColorStop(0, colors.secondary);
			gradient.addColorStop(0.7, colors.primary);
			gradient.addColorStop(1, '#ffffff');
			
			ctx.fillStyle = gradient;
			ctx.shadowColor = colors.glow;
			ctx.shadowBlur = 10;
			ctx.fillRect(0, h * (1 - level), w, h * level);
			ctx.shadowBlur = 0;

			// Draw peak line
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, h * (1 - level) - 2, w, 2);
		}

		animationFrame = requestAnimationFrame(draw);
	}

	function onDestroy() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	}

	$effect(() => {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;
			draw();
		}
	});
</script>

<canvas
	bind:this={canvas}
	id="oscilloscope"
	class={cn(
		'rounded-lg bg-gray-900/50 backdrop-blur-sm',
		'ring-1 ring-gray-800',
		className
	)}
	{width}
	{height}
></canvas>
