import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Shrinks a set of content elements (via CSS `transform: scale()`, applied
 * by the caller) just enough that the tallest one fits inside `containerRef`
 * — never grows past 1. `transform` doesn't affect layout, so `offsetHeight`
 * always reports each element's true natural (pre-scale) height regardless
 * of whatever scale is currently applied, which is what makes this safe to
 * recompute continuously: no feedback loop, no guessing a fixed number that
 * only happens to fit one specific viewport/sibling-content combination.
 */
export function useFitScale(containerRef: RefObject<HTMLElement | null>, contentRefs: RefObject<HTMLElement | null>[]): number {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recompute() {
      const availableHeight = container!.clientHeight;
      if (availableHeight <= 0) return;
      let minScale = 1;
      for (const ref of contentRefs) {
        const el = ref.current;
        if (!el || el.offsetHeight <= 0) continue;
        minScale = Math.min(minScale, availableHeight / el.offsetHeight);
      }
      // A small safety margin: web-font swaps, plan-badge text wrapping, and
      // similar late reflows can nudge natural height by a few px after this
      // fires, and a slightly-smaller-than-strictly-needed scale is a much
      // safer failure mode here than clipping a hero off-screen.
      setScale(Math.min(1, minScale) * 0.93);
    }

    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    contentRefs.forEach((r) => r.current && ro.observe(r.current));
    recompute();
    // Web fonts ("Baloo 2"/"Manrope") loading in after first paint reflow
    // hero-card text and can change natural height without necessarily
    // re-triggering the ResizeObserver in time for the very first render.
    document.fonts?.ready?.then(recompute).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, ...contentRefs]);

  return scale;
}
