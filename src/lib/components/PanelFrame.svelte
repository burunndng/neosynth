<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { cn } from '$lib/utils/cn';
  import { useCablePortRegistry, measurePort, type PortEdge, type PortAccent } from '$lib/utils/cablePorts';

  interface Props {
    label: string;
    accent?: PortAccent;
    active?: boolean;
    portSide?: PortEdge | 'none';
    portId?: string;
    class?: string;
    headerRight?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let {
    label,
    accent = 'cyan',
    active = false,
    portSide = 'none',
    portId,
    class: className = '',
    headerRight,
    children
  }: Props = $props();

  const accentColor = $derived({
    cyan: 'var(--ns-accent-primary)',
    magenta: 'var(--ns-accent-secondary)',
    green: 'var(--ns-accent-tertiary)',
    amber: 'var(--ns-accent-warning)'
  }[accent]);

  const registry = useCablePortRegistry();
  let panelEl: HTMLDivElement | null = $state(null);
  let portEl: HTMLDivElement | null = $state(null);
  let resizeObs: ResizeObserver | null = null;

  function remeasure() {
    if (!registry || !portEl || !portId || portSide === 'none') return;
    let containerEl: HTMLElement | null = null;
    registry.container.subscribe((el) => (containerEl = el))();
    if (!containerEl) return;
    const { x, y } = measurePort(portEl, containerEl);
    registry.set({ id: portId, x, y, edge: portSide, accent, active });
  }

  $effect(() => {
    if (registry && portId && portSide !== 'none') remeasure();
  });

  onMount(() => {
    if (!registry || !portId || portSide === 'none') return;
    remeasure();
    resizeObs = new ResizeObserver(() => remeasure());
    if (panelEl) resizeObs.observe(panelEl);
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
  });

  onDestroy(() => {
    resizeObs?.disconnect();
    window.removeEventListener('resize', remeasure);
    window.removeEventListener('scroll', remeasure, true);
    if (registry && portId) registry.remove(portId);
  });
</script>

<div
  bind:this={panelEl}
  class={cn('ns-panel', className)}
  style="color: {accentColor};"
>
  <svg class="ns-bracket tl" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket tr" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket bl" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>
  <svg class="ns-bracket br" viewBox="0 0 12 12"><path d="M0 6 L0 0 L6 0" /></svg>

  {#if portSide !== 'none' && portId}
    <div bind:this={portEl} class="ns-port {portSide}" aria-hidden="true"></div>
  {/if}

  <div class="ns-panel-header" style="color: {accentColor};">
    <span class="ns-led {active ? 'pulse' : 'dim'}"></span>
    <span style="color: var(--ns-text-secondary);">{label}</span>
    {#if headerRight}
      <span class="ml-auto">{@render headerRight()}</span>
    {/if}
  </div>

  {@render children?.()}
</div>
