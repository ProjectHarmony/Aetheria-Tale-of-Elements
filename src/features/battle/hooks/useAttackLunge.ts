import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { TimedBattleEvent } from '@/stores/battleStore';

/**
 * Lunge-and-recoil motion for whichever hero is currently resolving their
 * action — GSAP owns this element's transform imperatively, kept on its own
 * plain wrapper div (not the Framer-Motion-driven sprite node) so the two
 * animation systems never fight over the same inline style. Direction is
 * flipped by side: players lunge up toward the enemy row, enemies lunge
 * down toward the player row.
 */
export function useAttackLunge(events: TimedBattleEvent[], heroId: string, side: 'player' | 'enemy', ref: React.RefObject<HTMLDivElement | null>) {
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    for (const { event } of fresh) {
      if (event.type === 'actingStart' && event.actorId === heroId && ref.current) {
        const dir = side === 'player' ? -1 : 1;
        gsap
          .timeline()
          .to(ref.current, { y: dir * 16, scale: 1.1, duration: 0.32, ease: 'power2.out' })
          .to(ref.current, { y: 0, scale: 1, duration: 0.3, ease: 'power2.inOut' });
      }
    }
  }, [events, heroId, side, ref]);
}
