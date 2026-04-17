<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		active?: boolean;
		label?: string;
		icon?: any;
		color?: 'cyan' | 'magenta' | 'green';
		onClick?: () => void;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
	}

	let {
		active = false,
		label = '',
		icon: Icon,
		color = 'cyan',
		onClick,
		class: className = '',
		size = 'md',
		disabled = false
	}: Props = $props();

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-[10px]',
		md: 'px-4 py-2 text-xs',
		lg: 'px-5 py-2.5 text-sm'
	};

	const colorValues = {
		cyan: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)', bg15: 'rgba(34, 211, 238, 0.15)' },
		magenta: { primary: '#e879f9', glow: 'rgba(232, 121, 249, 0.3)', bg15: 'rgba(232, 121, 249, 0.15)' },
		green: { primary: '#34d399', glow: 'rgba(52, 211, 153, 0.3)', bg15: 'rgba(52, 211, 153, 0.15)' }
	};

	const cv = $derived(colorValues[color]);
</script>

<button
	class={cn(
		'relative flex items-center justify-center gap-1.5',
		'rounded-lg border transition-all duration-200',
		'font-semibold uppercase tracking-wider',
		'disabled:opacity-40 disabled:cursor-not-allowed',
		'active:scale-95',
		sizeClasses[size],
		className
	)}
	style="
		background: {active ? cv.bg15 : 'var(--ns-bg-surface)'};
		border-color: {active ? cv.primary : 'var(--ns-border)'};
		color: {active ? cv.primary : 'var(--ns-text-secondary)'};
		box-shadow: {active ? `0 0 12px ${cv.glow}, inset 0 0 12px ${cv.glow}` : 'none'};
	"
	onclick={onClick}
	disabled={disabled}
	type="button"
>
	{#if active}
		<!-- Dot indicator -->
		<span
			class="w-1.5 h-1.5 rounded-full"
			style="background: {cv.primary}; box-shadow: 0 0 4px {cv.glow};"
		></span>
	{/if}

	{#if Icon}
		<Icon class="w-3.5 h-3.5" />
	{/if}

	{#if label}
		<span>{label}</span>
	{/if}

	{#if active}
		<!-- Outer glow layer -->
		<div
			class="absolute inset-0 rounded-lg opacity-20 blur-md"
			style="background: {cv.primary}; z-index: -1;"
		></div>
	{/if}
</button>
