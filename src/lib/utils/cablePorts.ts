import { writable, type Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';

export type PortEdge = 'left' | 'right' | 'top' | 'bottom';
export type PortAccent = 'cyan' | 'magenta' | 'green' | 'amber';

export interface PortInfo {
  id: string;
  x: number;
  y: number;
  edge: PortEdge;
  accent: PortAccent;
  active: boolean;
}

export interface CablePortRegistry {
  ports: Writable<Record<string, PortInfo>>;
  container: Writable<HTMLElement | null>;
  set: (info: PortInfo) => void;
  remove: (id: string) => void;
}

const KEY = Symbol('cablePortRegistry');

export function createCablePortRegistry(): CablePortRegistry {
  const ports = writable<Record<string, PortInfo>>({});
  const container = writable<HTMLElement | null>(null);
  const registry: CablePortRegistry = {
    ports,
    container,
    set(info) {
      ports.update((m) => ({ ...m, [info.id]: info }));
    },
    remove(id) {
      ports.update((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };
  setContext(KEY, registry);
  return registry;
}

export function useCablePortRegistry(): CablePortRegistry | undefined {
  return getContext<CablePortRegistry>(KEY);
}

export function measurePort(
  portEl: HTMLElement,
  containerEl: HTMLElement
): { x: number; y: number } {
  const p = portEl.getBoundingClientRect();
  const c = containerEl.getBoundingClientRect();
  return {
    x: p.left - c.left + p.width / 2,
    y: p.top - c.top + p.height / 2
  };
}
