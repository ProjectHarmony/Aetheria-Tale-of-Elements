import { createContext, useContext, useRef, type ReactNode } from 'react';

interface HeroNodeRegistry {
  register: (heroId: string, node: HTMLElement | null) => void;
  getNode: (heroId: string) => HTMLElement | undefined;
}

const HeroNodesContext = createContext<HeroNodeRegistry | null>(null);

/**
 * Lets any hero card register its own DOM node under its heroId, and lets
 * anything else (namely ArrowOverlay) look that node up to measure a real
 * screen position — without prop-drilling refs through HeroRow/HeroCard or
 * relying on a global DOM query, matching how the original engine's
 * `showArrowBetween` grabbed `.hero[data-id=...]` but scoped to React state.
 */
export function HeroNodesProvider({ children }: { children: ReactNode }) {
  const nodes = useRef(new Map<string, HTMLElement>());

  const registry: HeroNodeRegistry = {
    register: (heroId, node) => {
      if (node) nodes.current.set(heroId, node);
      else nodes.current.delete(heroId);
    },
    getNode: (heroId) => nodes.current.get(heroId),
  };

  return <HeroNodesContext.Provider value={registry}>{children}</HeroNodesContext.Provider>;
}

export function useHeroNodeRegistry(): HeroNodeRegistry {
  const ctx = useContext(HeroNodesContext);
  if (!ctx) throw new Error('useHeroNodeRegistry must be used within a HeroNodesProvider');
  return ctx;
}
