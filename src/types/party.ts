import type { Element, Row } from './element';
import type { MageStats } from '@/constants/heroes';
import type { FormationKey } from '@/constants/formations';

/** Persistent per-mage progression — the roster/party feature owns this shape. */
export interface MageState {
  level: number;
  xp: number;
  statPoints: number;
  skillPoints: number;
  stats: MageStats;
  ranks: Record<string, number>;
  /** null = auto-equip (first N unlocked actives); array = manual pick */
  equipped: string[] | null;
}

export interface Party {
  /** Exactly 3 elements, in pick order — the 4th is never recruited (permanent choice). */
  picks: Element[];
  placements: Partial<Record<Element, Row>>;
  mages: Partial<Record<Element, MageState>>;
  formationType: FormationKey;
}
