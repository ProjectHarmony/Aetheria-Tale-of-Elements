import type { Element } from './element';
import type { MonsterTier } from './map';

/** The 10 shared Role archetypes from the Aetheria Monster Database — every
 *  monster's combat identity (stat multipliers, element counter-depth, skill
 *  kit) is entirely Role-derived, never hand-tuned per monster. */
export type MonsterRole =
  | 'Tank'
  | 'Tactician'
  | 'Healer'
  | 'Damager'
  | 'Assassin'
  | 'AoE Controller'
  | 'AoE Damager'
  | 'Dodger'
  | 'Burst'
  | 'Accuracy';

/** A monster's raw, hand-authored identity — everything else (HP, Speed,
 *  Dodge, Crit, Accuracy, element counter-depth, skill kit) is computed from
 *  just these fields via `computeMonsterStats`/monster skill-kit lookup. */
export interface MonsterRosterEntry {
  name: string;
  role: MonsterRole;
  element: Element;
  level: number;
  tier: MonsterTier;
  /** 'Field' (roaming wild monster) or 'Boss Underling' (spawns only alongside its Boss). */
  subtype: 'Field' | 'Boss Underling';
  aggressive: boolean;
}

/** Output of `computeMonsterStats` — the fully-derived battle-ready stat block for one roster entry. */
export interface ComputedMonsterStats {
  hp: number;
  dmg: number;
  speed: number;
  accuracy: number;
  dodge: number;
  crit: number;
  elementLevel: number;
  elementResistLevel: number;
  netCounterMult: number;
}
