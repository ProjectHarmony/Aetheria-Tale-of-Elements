import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { TimedBattleEvent } from '@/stores/battleStore';
import { RESOLUTION_HIT_DELAY_MS } from '@/constants';
import { useHeroNodeRegistry } from '../context/HeroNodesContext';

interface ArrowState {
  key: number;
  path: string;
  x2: number;
  y2: number;
  angle: number;
}

/**
 * Draws the same curved caster→target arrow the original engine's
 * showArrowBetween did during resolution, but sourced from React-registered
 * hero DOM nodes (HeroNodesContext) instead of a raw `.hero[data-id]` query
 * — same visual read on "who's about to hit whom", React-idiomatic lookup.
 */
export function ArrowOverlay({ events }: { events: TimedBattleEvent[] }) {
  const { getNode } = useHeroNodeRegistry();
  const containerRef = useRef<HTMLDivElement>(null);
  const [arrow, setArrow] = useState<ArrowState | null>(null);
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    for (const { id, event } of fresh) {
      if (event.type !== 'cast' || event.isBuff) continue;
      const fromNode = getNode(event.actorId);
      const toNode = getNode(event.targetId);
      const container = containerRef.current;
      if (!fromNode || !toNode || !container) continue;

      const cRect = container.getBoundingClientRect();
      const a = fromNode.getBoundingClientRect();
      const b = toNode.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - cRect.left;
      const y1 = a.top - cRect.top;
      const x2 = b.left + b.width / 2 - cRect.left;
      const y2 = b.top + b.height - cRect.top;
      const midY = (y1 + y2) / 2 - 30;

      setArrow({
        key: id,
        path: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY} ${x2} ${y2}`,
        x2,
        y2,
        angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI,
      });
      setTimeout(() => setArrow((cur) => (cur?.key === id ? null : cur)), RESOLUTION_HIT_DELAY_MS);
    }
  }, [events, getNode]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[15]">
      <AnimatePresence>
        {arrow && (
          <motion.svg
            key={arrow.key}
            className="absolute inset-0 h-full w-full overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <path
              d={arrow.path}
              stroke="var(--color-gold)"
              strokeWidth={2.5}
              fill="none"
              strokeDasharray="6 5"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,80,0.6))' }}
            />
            <polygon
              points={`${arrow.x2 - 6},${arrow.y2 - 10} ${arrow.x2 + 6},${arrow.y2 - 10} ${arrow.x2},${arrow.y2}`}
              fill="var(--color-gold)"
              transform={`rotate(${arrow.angle - 90} ${arrow.x2} ${arrow.y2})`}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
