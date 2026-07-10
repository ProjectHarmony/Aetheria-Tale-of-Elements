import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Element, Row } from '@/types';

const MOVE_THRESHOLD = 6; // px of finger/cursor travel before a press becomes a drag, not a tap

interface Ghost {
  el: Element;
  x: number;
  y: number;
}

/**
 * Unifies "tap to pick up, tap a slot to place" and "drag straight onto a
 * slot" into one pointer-gesture handler, matching the original's dual
 * interaction modes (script.js's `dnd` object + the tap-fallback wired
 * alongside it). Drop zones (slots, the bench) mark themselves with
 * `data-drop-row` ('front' | 'back' | 'bench') and `data-drop-occupant`
 * (the Element currently in that exact slot, or '') so a drag release can
 * be hit-tested via `elementFromPoint` without threading occupant state
 * through the hook itself.
 */
export function useDragToPlace(
  onDrop: (movingEl: Element, target: Row | null, occupantEl?: Element) => void,
  onTap: (el: Element) => void,
) {
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const startRef = useRef<{ x: number; y: number; el: Element; pointerId: number } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback(
    (el: Element) => (e: ReactPointerEvent) => {
      startRef.current = { x: e.clientX, y: e.clientY, el, pointerId: e.pointerId };
      movedRef.current = false;
    },
    [],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const start = startRef.current;
    if (!start || e.pointerId !== start.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!movedRef.current && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      movedRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (movedRef.current) setGhost({ el: start.el, x: e.clientX, y: e.clientY });
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || e.pointerId !== start.pointerId) return;

      if (movedRef.current) {
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const zone = under?.closest<HTMLElement>('[data-drop-row]');
        if (zone) {
          const rowAttr = zone.dataset.dropRow!;
          const occupantAttr = zone.dataset.dropOccupant || undefined;
          const target = rowAttr === 'bench' ? null : (rowAttr as Row);
          const occupant = occupantAttr && occupantAttr !== start.el ? (occupantAttr as Element) : undefined;
          onDrop(start.el, target, occupant);
        }
      } else {
        onTap(start.el);
      }
      movedRef.current = false;
      setGhost(null);
    },
    [onDrop, onTap],
  );

  return { ghost, onPointerDown, onPointerMove, onPointerUp };
}
