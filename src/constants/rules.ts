/** Modular deck-system config — tune freely without touching engine logic. */
export const DECK_CONFIG = {
  handSize: 4,
  drawPerRound: 4,
  maxCastsPerMagePerRound: 3,
} as const;

export const ENERGY_PER_ROUND = 2;
export const PLANNING_TIME_SECONDS = 30;
export const STARTING_ENERGY = 3;
export const MAX_ENERGY = 10;
export const MAX_SOUL = 2;

/** Pacing of the resolution animation sequence — mirrors the original
 *  setTimeout(500)/setTimeout(550) beats in script.js runQueue/finishQueueStep. */
export const RESOLUTION_HIT_DELAY_MS = 500;
export const RESOLUTION_STEP_GAP_MS = 550;

/** RPG progression — Ragnarok-style leveling on the Axie battle chassis. */
export const MAX_MAGE_LEVEL = 60;
export const STAT_POINTS_PER_LEVEL = 5;
export const SKILL_POINTS_PER_LEVEL = 1;
export const PVP_UNLOCK_LEVEL = 6;
export const STARTING_RESPEC_TOKENS = 10;

/** XP to go from level L to L+1 — tuned for prototype pacing: early levels
 *  ~1 adventure fight each, later levels 3-4 fights each. */
export function xpNeededForLevel(level: number): number {
  return 60 + 30 * (level - 1);
}

/** Reward for punching above your weight: a monster higher-level than the
 *  party's own average earns bonus XP per level of gap (no penalty the
 *  other way — stomping something below your level just pays the normal
 *  tier reward, never less). Capped so an extreme mismatch (e.g. a Lv1
 *  party somehow tagging a Lv80 Boss) can't be exploited for an absurd
 *  windfall — see `xpGapMultiplier` in systems/battle/team.ts, the only caller. */
export const LEVEL_GAP_XP_BONUS_PER_LEVEL = 0.15;
export const LEVEL_GAP_XP_BONUS_MAX_MULT = 4;
