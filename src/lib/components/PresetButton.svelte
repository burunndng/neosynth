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
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};

	const colorClasses = {
		cyan: active
			? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
			: 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400',
		magenta: active
			? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.3)]'
			: 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-fuchsia-500/50 hover:text-fuchsia-400',
		green: active
			? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
			: 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400'
	};
</script>

<button
	class={cn(
		'relative flex items-center justify-center gap-2',
		'rounded-lg border transition-all duration-200',
		'font-medium uppercase tracking-wider',
		'backdrop-blur-sm',
		'disabled:opacity-50 disabled:cursor-not-allowed',
		'hover:scale-105 active:scale-95',
		sizeClasses[size],
		colorClasses[color],
		className
	)}
	onclick={onClick}
	disabled={disabled}
	type="button"
>
	{#if Icon}
		<svelte:component this={Icon} class="w-4 h-4" />
	{/if}
	{#if label}
		<span>{label}</span>
	{/if}

	{#if active}
		<div
			class={cn(
				'absolute inset-0 rounded-lg opacity-30',
				'bg-gradient-to-br',
				color === 'cyan' ? 'from-cyan-400/20 to-blue-500/20' :
				color === 'magenta' ? 'from-fuchsia-400/20 to-pink-500/20' :
				'from-emerald-400/20 to-green-500/20',
				'blur-md'
			)}
			style="z-index: -1"
		/>
	{/if}
</button>
