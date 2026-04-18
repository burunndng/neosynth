<script lang="ts">
  import { useCablePortRegistry, type PortInfo, type PortEdge } from '$lib/utils/cablePorts';

  interface Connection {
    from: string;
    to: string;
  }

  interface Props {
    connections: Connection[];
  }

  let { connections }: Props = $props();

  const registry = useCablePortRegistry();
  let portMap = $state<Record<string, any>>({});

  $effect(() => {
    if (registry?.ports) {
      portMap = registry.ports;
    }
  });

  function edgeOffset(edge: PortEdge, dist: number): [number, number] {
    switch (edge) {
      case 'left':   return [-dist, 0];
      case 'right':  return [ dist, 0];
      case 'top':    return [0, -dist];
      case 'bottom': return [0,  dist];
      default:       return [0, 0];
    }
  }

  const accentMap: Record<string, string> = {
    cyan: 'var(--ns-accent-primary)',
    magenta: 'var(--ns-accent-secondary)',
    green: 'var(--ns-accent-tertiary)',
    amber: 'var(--ns-accent-warning)'
  };

  function accentToCss(a: PortInfo['accent']): string {
    return accentMap[a] ?? 'var(--ns-accent-primary)';
  }

  function buildPath(from: PortInfo, to: PortInfo): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.max(60, Math.hypot(dx, dy) * 0.4);
    const [fox, foy] = edgeOffset(from.edge, dist);
    const [tox, toy] = edgeOffset(to.edge, dist);
    const c1x = from.x + fox;
    const c1y = from.y + foy;
    const c2x = to.x + tox;
    const c2y = to.y + toy;
    return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
  }
</script>

{#if Object.keys(portMap).length > 0}
  <svg
    class="absolute inset-0 w-full h-full pointer-events-none cable-layer"
    style="z-index: 0;"
    aria-hidden="true"
  >
    {#each connections as conn (conn.from + '->' + conn.to)}
      {@const f = portMap[conn.from]}
      {@const t = portMap[conn.to]}
      {#if f && t}
        {@const active = f.active || t.active}
        {@const stroke = active ? accentToCss(f.accent) : 'rgba(90, 100, 140, 0.35)'}
        {@const path = buildPath(f, t)}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          stroke-width={active ? 2 : 1.5}
          stroke-linecap="round"
          style="filter: {active ? `drop-shadow(0 0 4px ${stroke})` : 'none'}; transition: stroke 0.3s, stroke-width 0.3s;"
        />
        {#if active}
          <path
            d={path}
            fill="none"
            stroke={stroke}
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="6 14"
            style="animation: ns-cable-flow 1.4s linear infinite; opacity: 0.85;"
          />
        {/if}
      {/if}
    {/each}
  </svg>

  <style>
    @media (max-width: 767px) { .cable-layer { display: none; } }
  </style>
{/if}
