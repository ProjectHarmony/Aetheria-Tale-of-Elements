import { useEffect, useRef, useState } from 'react';
import type { TimedBattleEvent } from '@/stores/battleStore';

export type FloaterKind = 'damage' | 'crit' | 'counter' | 'heal' | 'block' | 'miss' | 'dodge';

export interface Floater {
  id: number;
  kind: FloaterKind;
  text: string;
}

const LIFETIME_MS = 900;

/**
 * Watches the shared battle event stream and turns any event addressed to
 * `heroId` into a short-lived floating combat text entry, scoped entirely
 * to whichever component calls this — no DOM measurement or manual layer
 * management needed, each HeroCard just renders its own floaters absolutely
 * positioned within itself.
 */
export function useFloatingEvents(events: TimedBattleEvent[], heroId: string): Floater[] {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    const newFloaters: Floater[] = [];
    for (const { id, event } of fresh) {
      if (event.type === 'hit' && event.targetId === heroId) {
        newFloaters.push({ id, kind: event.isCrit ? 'crit' : event.matchup === 'favored' ? 'counter' : 'damage', text: String(event.amount) });
        if (event.absorbed > 0) newFloaters.push({ id: id + 0.1, kind: 'block', text: `🛡${event.absorbed}` });
      }
      if (event.type === 'hit' && event.actorId === heroId && event.reflected > 0) {
        newFloaters.push({ id: id + 0.2, kind: 'counter', text: String(event.reflected) });
      }
      if (event.type === 'heal' && event.targetId === heroId) {
        newFloaters.push({ id, kind: 'heal', text: `+${event.amount}` });
      }
      if (event.type === 'block' && event.targetId === heroId) {
        newFloaters.push({ id, kind: 'block', text: `🛡${event.amount}` });
      }
      if (event.type === 'miss' && event.targetId === heroId) {
        newFloaters.push({ id, kind: 'miss', text: 'MISS' });
      }
      if (event.type === 'dodge' && event.targetId === heroId) {
        newFloaters.push({ id, kind: 'dodge', text: 'DODGE' });
      }
    }
    if (newFloaters.length === 0) return;

    setFloaters((prev) => [...prev, ...newFloaters]);
    newFloaters.forEach((f) => {
      setTimeout(() => setFloaters((prev) => prev.filter((x) => x.id !== f.id)), LIFETIME_MS);
    });
  }, [events, heroId]);

  return floaters;
}
