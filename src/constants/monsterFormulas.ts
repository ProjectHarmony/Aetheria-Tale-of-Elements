import type { ComputedMonsterStats, Element, MonsterRole, MonsterTier } from '@/types';
import { HERO_ACC, HERO_CRIT, HERO_DODGE, HERO_HP, SPEED, STAT_SCALE } from './heroes';
import { STAT_POINTS_PER_LEVEL } from './rules';

/**
 * Aetheria Monster Database — monsters now use the EXACT SAME stat system
 * players do: the 6 categories (Power/Cast Speed/Vital/Dodge/Crit/Accuracy),
 * converted onto the same per-element base curve players use (HERO_HP,
 * SPEED, HERO_DODGE, HERO_CRIT, HERO_ACC) via the identical STAT_SCALE
 * conversion factors. A monster's Level earns a stat-point pool at the same
 * rate a player earns points (STAT_POINTS_PER_LEVEL/level) — a Lv15 monster
 * gets 15 * 5 = 75 points, exactly what a Lv15 PLAYER would have earned
 * from leveling. This directly fixes the old curve-based system's core
 * problem: player power is almost entirely level-INDEPENDENT (a mage's HP
 * barely moves unless points are deliberately spent), so a Lv1 party could
 * steamroll a Lv25+ monster scaling on a totally different, hand-tuned
 * curve. Now monster and player power are the SAME formula — a same-level,
 * similarly-invested monster and player are directly comparable.
 *
 * Points are split across the 6 categories per ROLE, not evenly — a Tank
 * invests mostly in Vital, an Assassin in Crit + Cast Speed, a Healer in
 * Vital + Cast Speed (stays alive long enough to keep healing), etc. — see
 * ROLE_STAT_WEIGHTS. Tier (and, for population-pyramid monsters, Adult/Elder
 * — see monsterRoster.ts) then scale the TOTAL pool before it's split, so a
 * tougher tier reads as "a more developed specimen" with proportionally
 * better everything, not a bare damage-sponge multiplier bolted on after.
 */

/** Reference damage a monster's kit scales from — matches a fresh player's
 *  own Root-skill damage (e.g. Ember's Spark, 60 DMG at rank 1), so a
 *  monster's POW investment scales its output exactly like a player's does. */
const BASE_MONSTER_DMG = 60;

interface RoleStatWeights { pow: number; cs: number; vit: number; dge: number; crt: number; acc: number }

/** Each role's point split — weights sum to 1.0, i.e. "what this archetype
 *  would actually invest in" given a free pool, same as a player choosing
 *  where to put their own stat points. */
export const ROLE_STAT_WEIGHTS: Record<MonsterRole, RoleStatWeights> = {
  'Tank': { vit: 0.45, pow: 0.20, acc: 0.15, cs: 0.10, dge: 0.05, crt: 0.05 },
  'Tactician': { cs: 0.25, acc: 0.25, pow: 0.20, vit: 0.15, dge: 0.10, crt: 0.05 },
  'Healer': { vit: 0.35, cs: 0.30, acc: 0.15, pow: 0.10, dge: 0.05, crt: 0.05 },
  'Damager': { pow: 0.40, acc: 0.20, vit: 0.20, cs: 0.10, crt: 0.05, dge: 0.05 },
  // Assassin/Burst/both AoE roles simulated as unconditional losses at their
  // original, more offense-concentrated weights (crt/pow ~0.30-0.40 each) —
  // AoE roles hit all 3 party members per cast (a real x3 amplifier once the
  // AoE-targeting bug was fixed), and Assassin/Burst's crit+pow concentration
  // compounds with their own skill kit's dmgMult (e.g. Burst's Overload,
  // 1.6x). Re-weighted toward Vital so these roles stay dangerous without
  // being unwinnable — verified via headless battle-engine simulation.
  'Assassin': { crt: 0.20, cs: 0.20, pow: 0.20, vit: 0.25, acc: 0.10, dge: 0.05 },
  'AoE Controller': { acc: 0.25, cs: 0.20, vit: 0.35, pow: 0.10, dge: 0.05, crt: 0.05 },
  'AoE Damager': { pow: 0.25, vit: 0.35, acc: 0.20, cs: 0.10, dge: 0.05, crt: 0.05 },
  'Dodger': { dge: 0.40, cs: 0.25, crt: 0.15, pow: 0.10, acc: 0.05, vit: 0.05 },
  'Burst': { crt: 0.20, pow: 0.20, vit: 0.35, cs: 0.10, acc: 0.10, dge: 0.05 },
  'Accuracy': { acc: 0.45, pow: 0.20, crt: 0.15, cs: 0.10, vit: 0.05, dge: 0.05 },
};

/** Element counter-depth stays Role-derived — unrelated to the 6-stat point
 *  system, this is a separate exposure/resistance axis (see netCounterMult). */
interface RoleElementProfile { elementLevel: number; elementResistLevel: number }
export const ROLE_ELEMENT_PROFILES: Record<MonsterRole, RoleElementProfile> = {
  'Tank': { elementLevel: 1, elementResistLevel: 4 },
  'Tactician': { elementLevel: 2, elementResistLevel: 3 },
  'Healer': { elementLevel: 2, elementResistLevel: 3 },
  'Damager': { elementLevel: 3, elementResistLevel: 2 },
  'Assassin': { elementLevel: 4, elementResistLevel: 1 },
  'AoE Controller': { elementLevel: 2, elementResistLevel: 2 },
  'AoE Damager': { elementLevel: 3, elementResistLevel: 1 },
  'Dodger': { elementLevel: 3, elementResistLevel: 2 },
  'Burst': { elementLevel: 4, elementResistLevel: 2 },
  'Accuracy': { elementLevel: 2, elementResistLevel: 3 },
};

/** Tier is now a POINTS multiplier on the whole pool (scales hp/dmg/speed/
 *  dodge/crit/acc together) instead of separate hp/dmg multipliers — a solo
 *  Elite/Mini-Boss/Boss only ever gets one action per round against a full
 *  3-mage party (up to 3 casts/mage/round from a shared energy pool), so
 *  these compensate for that structural disadvantage. Values tuned via
 *  headless battle-engine simulation (resolveRound) against a fresh Lv1
 *  party, same method used throughout this balance pass. */
interface TierProfile { pointMult: number; respawnMs: number }
export const TIER_PROFILES: Record<MonsterTier, TierProfile> = {
  regular: { pointMult: 1, respawnMs: 1 * 60 * 1000 },
  elite: { pointMult: 1.8, respawnMs: 5 * 60 * 1000 },
  miniboss: { pointMult: 2.2, respawnMs: 30 * 60 * 1000 },
  boss: { pointMult: 4.2, respawnMs: 60 * 60 * 1000 },
};

// ============================================================
// ELEMENT COUNTER-DEPTH — Element Level (exposure) vs Element Resist Level
// (mitigation), net = 1 + MAX(0, exposure - resist). Can fully neutralize to
// 1.0x but never becomes an actual resistance below neutral.
// ============================================================
const ELEMENT_EXPOSURE: Record<number, number> = { 1: 0.10, 2: 0.20, 3: 0.35, 4: 0.50 };
const ELEMENT_RESIST: Record<number, number> = { 1: 0.05, 2: 0.10, 3: 0.15, 4: 0.20 };

export function netCounterMult(elementLevel: number, elementResistLevel: number): number {
  const exposure = ELEMENT_EXPOSURE[elementLevel] ?? 0;
  const resist = ELEMENT_RESIST[elementResistLevel] ?? 0;
  return 1 + Math.max(0, exposure - resist);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Splits `totalPoints` across the 6 categories per the role's weights —
 *  floors each share, then hands out the rounding remainder to the
 *  heaviest-weighted categories first (the most "in character" place for a
 *  monster of that archetype to round up), so the total always lands exact. */
function allocatePoints(totalPoints: number, weights: RoleStatWeights): RoleStatWeights {
  const keys = Object.keys(weights) as (keyof RoleStatWeights)[];
  const floored = keys.map((k) => Math.floor(totalPoints * weights[k]));
  let leftover = totalPoints - floored.reduce((a, b) => a + b, 0);
  const order = keys.map((_, i) => i).sort((a, b) => weights[keys[b]!] - weights[keys[a]!]);
  const alloc = {} as RoleStatWeights;
  keys.forEach((k, i) => { alloc[k] = floored[i]!; });
  for (let i = 0; i < order.length && leftover > 0; i++, leftover--) {
    const key = keys[order[i]!]!;
    alloc[key] += 1;
  }
  return alloc;
}

/**
 * The whole "stats like players" system in one call. `pointMultExtra`
 * folds in anything beyond Tier that should scale the whole pool (the
 * population-pyramid Adult/Elder bonus, or a Boss Underling's own override
 * — see monsterRoster.ts's `statsFor`, the only caller).
 */
export function computeMonsterStats(
  role: MonsterRole,
  level: number,
  tier: MonsterTier,
  element: Element,
  pointMultExtra = 1,
  tierPointMultOverride?: number,
  elementLevelOverride?: number,
): ComputedMonsterStats {
  const tierPointMult = tierPointMultOverride ?? TIER_PROFILES[tier].pointMult;
  const totalPoints = Math.round(STAT_POINTS_PER_LEVEL * level * tierPointMult * pointMultExtra);
  const alloc = allocatePoints(totalPoints, ROLE_STAT_WEIGHTS[role]);
  const elementProfile = ROLE_ELEMENT_PROFILES[role];
  // Exposure (Element Level) is hand-authored per monster in the database —
  // resist depth stays Role-derived, since the database doesn't carry a
  // separate resist rating.
  const elementLevel = elementLevelOverride ?? elementProfile.elementLevel;

  const hp = Math.round(HERO_HP[element] + alloc.vit * STAT_SCALE.vit);
  const dmg = Math.round(BASE_MONSTER_DMG * (1 + alloc.pow * STAT_SCALE.pow));
  const speed = Math.round(SPEED[element] + alloc.cs * STAT_SCALE.cs);
  const dodge = round1(Math.min(60, (HERO_DODGE[element] + alloc.dge * STAT_SCALE.dge) * 100));
  const crit = round1(Math.min(60, (HERO_CRIT[element] + alloc.crt * STAT_SCALE.crt) * 100));
  const accuracy = round1(Math.min(100, (HERO_ACC[element] + alloc.acc * STAT_SCALE.acc) * 100));

  return {
    hp, dmg, speed, accuracy, dodge, crit,
    elementLevel,
    elementResistLevel: elementProfile.elementResistLevel,
    netCounterMult: netCounterMult(elementLevel, elementProfile.elementResistLevel),
  };
}
