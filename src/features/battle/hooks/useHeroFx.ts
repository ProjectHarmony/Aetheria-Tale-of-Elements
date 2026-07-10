import { useEffect, useRef, useState } from 'react';
import type { TimedBattleEvent } from '@/stores/battleStore';
import { STATUS_META, type StatusKind } from '@/constants/status';

export interface StatusPop {
  id: number;
  kind: StatusKind;
}

interface HeroFx {
  isHit: boolean;
  isActing: boolean;
  isAutoTargeted: boolean;
  statusPops: StatusPop[];
}

const HIT_FLASH_MS = 320;
const STATUS_POP_MS = 1100;
const AUTO_TARGET_PULSE_MS = 500;

export function useHeroFx(events: TimedBattleEvent[], heroId: string): HeroFx {
  const [isHit, setIsHit] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isAutoTargeted, setIsAutoTargeted] = useState(false);
  const [statusPops, setStatusPops] = useState<StatusPop[]>([]);
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    for (const { id, event } of fresh) {
      if (event.type === 'actingStart' && event.actorId === heroId) setIsActing(true);
      if (event.type === 'actingEnd' && event.actorId === heroId) setIsActing(false);
      if (event.type === 'hit' && event.targetId === heroId) {
        setIsHit(true);
        setTimeout(() => setIsHit(false), HIT_FLASH_MS);
      }
      if (event.type === 'autoTarget' && event.targetId === heroId) {
        setIsAutoTargeted(true);
        setTimeout(() => setIsAutoTargeted(false), AUTO_TARGET_PULSE_MS);
      }
      if (event.type === 'buffApplied' && event.targetId === heroId && event.statusKind in STATUS_META) {
        const pop: StatusPop = { id, kind: event.statusKind as StatusKind };
        setStatusPops((prev) => [...prev, pop]);
        setTimeout(() => setStatusPops((prev) => prev.filter((p) => p.id !== pop.id)), STATUS_POP_MS);
      }
    }
  }, [events, heroId]);

  return { isHit, isActing, isAutoTargeted, statusPops };
}
