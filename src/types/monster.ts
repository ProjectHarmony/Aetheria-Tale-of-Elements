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

/** Flavor/lore taxonomy from the Aetheria Monster Database — presentation
 *  only (bestiary text/filtering), never affects combat stats. */
export type MonsterRace = 'Plant' | 'Spirit' | 'Elemental' | 'Construct' | 'Beast' | 'Aberration' | 'Undead' | 'Dragonkin';

/** A monster's raw, hand-authored identity — everything else (HP, Speed,
 *  Dodge, Crit, Accuracy, skill kit) is computed from just these fields via
 *  `computeMonsterStats`/monster skill-kit lookup. `elementLevel` is the one
 *  exception: it's hand-authored per monster (the database's own per-species
 *  exposure rating), overriding the Role-derived default — see
 *  ROLE_ELEMENT_PROFILES/computeMonsterStats in monsterFormulas.ts. */
export interface MonsterRosterEntry {
  name: string;
  role: MonsterRole;
  element: Element;
  level: number;
  tier: MonsterTier;
  /** 'Field' (roaming wild monster) or 'Boss Underling' (spawns only alongside its Boss). */
  subtype: 'Field' | 'Boss Underling';
  aggressive: boolean;
  /** 1-4, this species' counter-element exposure depth (see ELEMENT_EXPOSURE in monsterFormulas.ts). */
  elementLevel: number;
  race: MonsterRace;
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
