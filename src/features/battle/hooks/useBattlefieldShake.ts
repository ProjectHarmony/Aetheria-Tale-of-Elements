import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { TimedBattleEvent } from '@/stores/battleStore';

/** Whole-field punch on a crit landing — cheap "juice" that sells impact
 *  without touching any per-hero animation. Runs on its own ref so it never
 *  competes with Framer Motion's per-hero transforms. */
export function useBattlefieldShake(events: TimedBattleEvent[], ref: React.RefObject<HTMLDivElement | null>) {
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    for (const { event } of fresh) {
      if (event.type === 'hit' && event.isCrit && ref.current) {
        gsap
          .timeline()
          .to(ref.current, { x: -6, duration: 0.05 })
          .to(ref.current, { x: 6, duration: 0.08 })
          .to(ref.current, { x: -3, duration: 0.08 })
          .to(ref.current, { x: 0, duration: 0.08 });
      }
    }
  }, [events, ref]);
}
