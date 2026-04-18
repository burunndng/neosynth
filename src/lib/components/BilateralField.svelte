<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { onMount, onDestroy } from 'svelte';
	import { waveformLeft, waveformRight } from '$lib/stores/audioStore';

	let container: HTMLDivElement;
	let width = 800;
	let height = 400;
	let dpr = 1;
	let mouseX = 0.5;
	let mouseY = 0.5;
	let animId: number;
	let hue = 0;
	let phase = 0;
	let lvl = 0;

	function update(event?: MouseEvent) {
		if (container) {
			const rect = container.getBoundingClientRect();
			if (event) {
				mouseX = (event.clientX - rect.left) / rect.width;
				mouseY = (event.clientY - rect.top) / rect.height;
			}
		}
	}

	onMount(() => {
		const onResize = () => {
			if (container) {
				const rect = container.getBoundingClientRect();
				width = rect.width;
				height = rect.height;
				dpr = window.devicePixelRatio || 1;
			}
		};
		onResize();

		window.addEventListener('resize', onResize);
		container.addEventListener('mousemove', update);
		container.addEventListener('touchmove', (e: TouchEvent) => {
			if (e.touches[0]) {
				const rect = container.getBoundingClientRect();
				mouseX = (e.touches[0].clientX - rect.left) / rect.width;
				mouseY = (e.touches[0].clientY - rect.top) / rect.height;
			}
		}, { passive: true });

		function loop() {
			phase += 0.002 + $waveformLeft * 0.01;
			lvl = 0.3 + $waveformLeft * 0.7;
			hue = (hue + 0.3 + $waveformRight * 0.5) % 360;
			animId = requestAnimationFrame(loop);
		}
		loop();

		return () => {
			window.removeEventListener('resize', onResize);
			container.removeEventListener('mousemove', update);
			cancelAnimationFrame(animId);
		};
	});
</script>

<div
	bind:this={container}
	class="field-container relative w-full rounded-xl overflow-hidden border border-gray-800 bg-[#08080c] shadow-2xl"
	style="width: 100%; height: {height}px;"
	role="img"
	aria-label="Bilateral field visualization"
>
	<svg
		width="100%"
		height="100%"
		viewBox="0 0 {width} {height}"
		class="block w-full h-full"
		preserveAspectRatio="xMidYMid slice"
	>
		<defs>
			<radialGradient id="vignette" cx="50%" cy="50%" r="65%" fx="50%" fy="50%">
				<stop offset="70%" stop-color="transparent" />
				<stop offset="100%" stop-color="#000000" stop-opacity="0.75" />
			</radialGradient>
			<linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="var(--ns-accent-primary, #22d3ee)" stop-opacity="0.3" />
				<stop offset="100%" stop-color="transparent" />
			</linearGradient>
			<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>

			<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
				<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="0.5"/>
			</pattern>
		</defs>

		<rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />

		{#each Array.from({ length: 4 }, (_, i) => i) as ring}
			<g transform="translate({width / 2}, {height / 2})">
				<circle
					r={80 + ring * 60 + lvl * 100}
					fill="none"
					stroke={`hsl(${Math.round(hue)}, 70%, 50%)`}
					stroke-width="1"
					stroke-opacity={0.3 - ring * 0.05 + lvl * 0.15}
					filter="url(#softGlow)"
				>
					<animate attributeName="r" values="{80 + ring * 60};{100 + ring * 60 + lvl * 80};{80 + ring * 60}" dur="{2 / (1 + $waveformLeft * 2)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
					<animate attributeName="stroke-opacity" values="0.15;0.3;0.15" dur="{2 / (1 + $waveformLeft * 2)}s" repeatCount="indefinite" />
				</circle>
			</g>
		{/each}

		<g transform="translate({width * mouseX}, {height * mouseY})">
			<circle r="6" fill="var(--ns-accent-primary, #22d3ee)" stroke="white" stroke-width="2" opacity="0.9">
				<animate attributeName="r" values="4;20;4" dur="{1.5 / (1 + lvl * 3)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 1 1;0.4 0 1 1" />
				<animate attributeName="opacity" values="0.9;0.3;0.9" dur="{1.5 / (1 + lvl * 3)}s" repeatCount="indefinite" />
			</circle>
		</g>
	</svg>

	<div
		class="absolute inset-0 pointer-events-none"
		style="background: radial-gradient(circle at {mouseX * 100}% {mouseY * 100}%, rgba(34,211,238,0.08) 0%, transparent 40%);"
	></div>
</div>