import type { Element, Row } from './element';
import type { Card } from './skill';

/**
 * Pre-baked passive-conditional knobs, summed at team-build time from a
 * mage's owned passive skills (coefficient * rank each). Kept as a nested
 * bag rather than 27 more top-level Hero fields — battle Heroes are
 * flattened snapshots with no live reference back to MageState/ranks, so
 * every passive contribution has to be pre-computed once, same as the
 * existing blockOnAttack/execBonus/reflect/dmgReduction/regen fields.
 */
export type PassiveKnobKey =
  | 'dmgUpPct'
  | 'burnChanceUp'
  | 'burnTickDmgUp'
  | 'thornsFlatUp'
  | 'regenWhileShielded'
  | 'healUpPct'
  | 'overflowToShieldPct'
  | 'dmgVsLowHpPct'
  | 'lowHpThreshold'
  | 'critVsLowHpPct'
  | 'critDmgUp'
  | 'critUpPct'
  | 'critVsBurnedPct'
  | 'dmgWhileShieldedPct'
  | 'dmgUpWhileLowHpPct'
  | 'dmgUpWhileActedFirstPct'
  | 'dmgReductionWhileLowHpPct'
  | 'aoeDmgUpPct'
  | 'multiHitDmgUpPct'
  | 'dmgVsFrozenPct'
  | 'energyRefundOnAoEChance'
  | 'dmgPer100Shield'
  | 'onDodgeRecoil'
  | 'onDodgeShield'
  | 'thornBurnDmgWhileShielded'
  | 'thornBurnTicksWhileShielded'
  | 'tauntShieldBonus';

export type HeroPassives = Record<PassiveKnobKey, number>;

/**
 * A single combatant on the battlefield — player mage or enemy. Fields map
 * 1:1 to the original engine's hero object (see buildPlayerTeamFromParty /
 * buildRandomEnemyTeam in script.js) so the resolution math ports verbatim.
 */
export interface Hero {
  id: string;
  name: string;
  el: Element;
  row: Row;
  level?: number;

  hp: number;
  maxHp: number;
  alive: boolean;
  block: number;

  speed: number;
  powMult: number;
  dodge: number;
  crit: number;
  acc: number;

  /** Element counter-depth (Aetheria Monster Database): how exposed this hero is to
   *  its counter-element (1-4) and how much of that exposure it resists (1-4). Players
   *  are always Lv2/Lv2 (nets to the original flat 1.2x/0.8x); monsters vary by Role. */
  elementLevel?: number;
  elementResistLevel?: number;

  /** Enemy-only: independent per-hero energy pool (players share one pool on
   *  BattleState instead). Regens every round, gates which moveset skill the
   *  AI can afford. Absent on players. */
  energy?: number;
  maxEnergy?: number;
  /** Enemy-only: the monster's resolved skill kit (basic attack + Role/Boss/Tier skills), built at team-assembly time. */
  moveset?: Card[];

  // Passive-derived combat modifiers (from unlocked passive skills)
  blockOnAttack: number;
  execBonus: number;
  reflect: number;
  dmgReduction: number;
  regen: number;
  passives: HeroPassives;

  // Round-scoped buff/debuff fields — reset to 0 every endRound()
  dmgUpRound: number;
  dodgeUpRound: number;
  speedNextRound: number;
  accDownRound: number;
  /** Speed delta currently applied from a resolved speedNextRound, removed next upkeep */
  speedSurge?: number;
  /** Attune: matchup always resolves favored for this hero for the rest of the round. */
  forceFavoredRound?: boolean;
  /** Base crit-damage multiplier (default 1.5), raised by Chill-Sense-style passives. */
  critDmgMult?: number;

  // Multi-round statuses (durations counted down once per endRound(), independent
  // of the always-reset-every-round fields above).
  burn?: { dmg: number; ticksLeft: number };
  frozen?: boolean;
  tauntRoundsLeft?: number;
  vulnPctRound?: number;
  vulnRoundsLeft?: number;
  thornsFlat?: number;
  thornsRoundsLeft?: number;
  dodgeBuffExtra?: number;
  dodgeBuffRoundsLeft?: number;
  tempRegen?: { amount: number; roundsLeft: number };
  /** Multi-round pairing for a `targetDmgDownPct`/`targetAccDownPct` rider with
   *  duration > 1 — while these count down, endRound() skips the normal
   *  hard-reset of dmgUpRound/accDownRound so the debuff survives past round 1. */
  dmgDownRoundsLeft?: number;
  accDownRoundsLeft?: number;
  /** Ruinous Charge-style pending channel — locked at cast time, resolves
   *  automatically on a later round regardless of intervening actions. */
  channel?: { skillId: string; targetId: string; resolvesRound: number };

  /** Round-scoped: did this hero take any damage yet this round? Reset every endRound(). */
  damagedThisRound?: boolean;
  /** Round-scoped temporary dmg-reduction on top of the passive-derived dmgReduction. */
  dmgReductionRoundExtra?: number;
  /** Ids of heroes who landed a hit on this hero, this round (being built) / last round (snapshot for checks). */
  attackedByThisRound?: string[];
  attackedByLastRound?: string[];

  // Player-only: deck/hand/discard cycle. Absent on enemies.
  hasUltimate?: boolean;
  deck?: string[];
  hand?: string[];
  discard?: string[];
  pendingDiscard?: string[];
}

export type Team = Hero[];
