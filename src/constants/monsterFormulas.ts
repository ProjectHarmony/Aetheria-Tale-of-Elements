import type { ComputedMonsterStats, MonsterRole, MonsterTier } from '@/types';

/**
 * Aetheria Monster Database — "shortened coding" stat system, ported as a
 * live formula (not baked per-monster numbers) so retuning one multiplier
 * here still updates every monster that uses it, exactly like the source
 * workbook's own design goal. See `Aetheria_Monster-Database-v5.xlsx`:
 * README + Base Curve + Role Profiles + Tier Settings sheets.
 */

// ============================================================
// BASE CURVE — Regular-tier, role-neutral per-level stat curve.
// ============================================================
const BASE_CURVE = {
  hp: { base: 80, growth: 14 },
  dmg: { base: 12, growth: 2.2 },
  speed: { base: 90, growth: 0.3 },
  accuracy: { base: 85, growth: 0.12, cap: 97 },
  dodge: { base: 5, growth: 0.35, cap: 35 },
  crit: { base: 5, growth: 0.28, cap: 30 },
};

// ============================================================
// ROLE PROFILES — the only place Role balance is tuned; every monster of a
// given Role inherits these multipliers (+ element counter-depth) automatically.
// ============================================================
interface RoleProfile {
  hpMult: number;
  dmgMult: number;
  speedMult: number;
  dodgeMult: number;
  critMult: number;
  accMult: number;
  elementLevel: number;
  elementResistLevel: number;
}

export const ROLE_PROFILES: Record<MonsterRole, RoleProfile> = {
  'Tank': { hpMult: 1.4, dmgMult: 0.7, speedMult: 0.85, dodgeMult: 0.8, critMult: 0.7, accMult: 0.9, elementLevel: 1, elementResistLevel: 4 },
  'Tactician': { hpMult: 1, dmgMult: 0.85, speedMult: 1, dodgeMult: 1, critMult: 0.9, accMult: 1.1, elementLevel: 2, elementResistLevel: 3 },
  'Healer': { hpMult: 1.1, dmgMult: 0.6, speedMult: 0.95, dodgeMult: 0.9, critMult: 0.7, accMult: 1, elementLevel: 2, elementResistLevel: 3 },
  'Damager': { hpMult: 1, dmgMult: 1.15, speedMult: 1, dodgeMult: 0.9, critMult: 1, accMult: 1, elementLevel: 3, elementResistLevel: 2 },
  'Assassin': { hpMult: 0.75, dmgMult: 1.35, speedMult: 1.25, dodgeMult: 1.1, critMult: 1.3, accMult: 1, elementLevel: 4, elementResistLevel: 1 },
  'AoE Controller': { hpMult: 0.95, dmgMult: 0.9, speedMult: 0.95, dodgeMult: 0.9, critMult: 0.85, accMult: 1.15, elementLevel: 2, elementResistLevel: 2 },
  'AoE Damager': { hpMult: 0.9, dmgMult: 1.1, speedMult: 0.9, dodgeMult: 0.85, critMult: 0.95, accMult: 1, elementLevel: 3, elementResistLevel: 1 },
  'Dodger': { hpMult: 0.85, dmgMult: 0.9, speedMult: 1.2, dodgeMult: 1.5, critMult: 1, accMult: 0.95, elementLevel: 3, elementResistLevel: 2 },
  'Burst': { hpMult: 0.85, dmgMult: 1.4, speedMult: 1.05, dodgeMult: 0.9, critMult: 1.2, accMult: 0.95, elementLevel: 4, elementResistLevel: 2 },
  'Accuracy': { hpMult: 0.95, dmgMult: 1.05, speedMult: 1, dodgeMult: 0.85, critMult: 1.05, accMult: 1.35, elementLevel: 2, elementResistLevel: 3 },
};

// ============================================================
// TIER SETTINGS — HP/Dmg multipliers apply on TOP of the Role profile
// (Speed/Accuracy/Dodge/Crit are Role-only, no Tier scaling).
// ============================================================
interface TierProfile {
  hpMult: number;
  dmgMult: number;
  respawnMs: number;
}

export const TIER_PROFILES: Record<MonsterTier, TierProfile> = {
  regular: { hpMult: 1, dmgMult: 1, respawnMs: 1 * 60 * 1000 },
  elite: { hpMult: 1.3, dmgMult: 1.2, respawnMs: 5 * 60 * 1000 },
  miniboss: { hpMult: 2, dmgMult: 1.4, respawnMs: 30 * 60 * 1000 },
  boss: { hpMult: 3.5, dmgMult: 1.6, respawnMs: 60 * 60 * 1000 },
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

function curve(c: { base: number; growth: number }, level: number): number {
  return c.base + c.growth * (level - 1);
}
function curveCapped(c: { base: number; growth: number; cap: number }, level: number): number {
  return Math.min(c.cap, c.base + c.growth * level);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** The whole "shortened coding" system in one call: 5 raw fields in, every
 *  other stat out. Rounds only once at the end, matching the workbook. */
export function computeMonsterStats(role: MonsterRole, level: number, tier: MonsterTier): ComputedMonsterStats {
  const rp = ROLE_PROFILES[role];
  const tp = TIER_PROFILES[tier];

  const hp = Math.round(curve(BASE_CURVE.hp, level) * rp.hpMult * tp.hpMult);
  const dmg = Math.round(curve(BASE_CURVE.dmg, level) * rp.dmgMult * tp.dmgMult);
  const speed = Math.round(curve(BASE_CURVE.speed, level) * rp.speedMult);
  const accuracy = round1(curveCapped(BASE_CURVE.accuracy, level) * rp.accMult);
  const dodge = round1(curveCapped(BASE_CURVE.dodge, level) * rp.dodgeMult);
  const crit = round1(curveCapped(BASE_CURVE.crit, level) * rp.critMult);

  return {
    hp, dmg, speed, accuracy, dodge, crit,
    elementLevel: rp.elementLevel,
    elementResistLevel: rp.elementResistLevel,
    netCounterMult: netCounterMult(rp.elementLevel, rp.elementResistLevel),
  };
}
