import type { Element } from './element';

export type SkillKind = 'attack' | 'buff' | 'passive' | 'ultimate';

/**
 * Effects are a sparse bag of optional numeric knobs, extended for the v3.1
 * skill tree's much larger mechanic set (see constants/skills.ts). Grouped
 * roughly by how the engine consumes them:
 *  - "team*"/"enemy*" fields are applied unconditionally on cast (own team /
 *    enemy team wide), independent of whether the card also deals damage.
 *  - "target*" fields apply only to the specific hero this cast's damage hit
 *    (not the whole enemy team) and reuse that hero's own round-scoped
 *    fields (dmgUpRound etc.) for the common 1-round-only debuffs.
 *  - on-hit rider fields apply once per successful hit against a target.
 *  - passive conditional knobs are read by derivedStatsFor / the damage
 *    pipeline at cast time; they never mutate Hero state directly.
 */
export interface SkillEffect {
  // --- team/enemy-wide (applied unconditionally on cast) ---
  blockOnAttack?: number;
  execBonus?: number;
  reflect?: number;
  regen?: number;
  dmgReduction?: number;
  dodgeUp?: number;
  speedUp?: number;
  teamDmgUpRound?: number;
  teamHeal?: number;
  teamBlock?: number;
  teamDodgeUpRound?: number;
  teamSpeedNextRound?: number;
  energyGain?: number;
  enemyDmgDown?: number;
  enemyDodgeDown?: number;
  enemySpeedDown?: number;
  enemyAccDown?: number;
  /** Ocean Dominion-style: chance to Freeze every enemy (each rolls own dodge). */
  freezeAllChance?: number;
  /** Cleanse every negative status off the caster's whole team. */
  cleanseTeam?: boolean;
  /** Revive the first dead ally found, at this % of their max HP. */
  reviveAllyPct?: number;
  /** Team-wide temporary regen (distinct from the permanent passive `regen`). */
  teamRegenAmount?: number;
  teamRegenRounds?: number;

  // --- single-target riders (apply only to the hero this cast's hit landed on) ---
  /** 1-round debuffs — reuse the target's own hard-reset-every-round fields. */
  targetDmgDownPct?: number;
  targetDodgeDownPct?: number;
  targetAccDownPct?: number;
  targetSpeedDown?: number;
  /** Multi-round debuff — target takes +shredPct% dmg for shredRounds rounds. */
  shredPct?: number;
  shredRounds?: number;

  burnChance?: number;
  burnDmg?: number;
  burnTicks?: number;
  freezeChance?: number;
  /** Bonus flat dmg vs a currently-Frozen target. */
  dmgVsFrozen?: number;
  /** If true and target is Frozen, this hit consumes (clears) the Freeze. */
  shatterFreeze?: boolean;
  /** Bonus flat dmg if the target is currently Taunting or has shield > 0. */
  dmgVsTauntingOrShielded?: number;
  /** Bonus flat dmg if the target has already taken damage this round. */
  dmgVsDamagedThisRound?: number;
  /** Bonus flat dmg if the target hit the caster back on the previous round. */
  dmgVsAttackedMeLastRound?: number;
  /** Bonus flat dmg if the target is currently Burning. */
  dmgVsBurned?: number;
  /** If the target is Burning, consume it for this flat bonus dmg. */
  consumeBurnBonus?: number;
  /** Secondary hit on one other random enemy, at this % of the primary dmg. */
  secondaryRandomPct?: number;

  // --- self riders ---
  /** Caster becomes the forced enemy-AI target for tauntRounds rounds. */
  tauntRounds?: number;
  /** Caster reflects thornsFlat flat dmg to attackers for thornsRounds rounds. */
  thornsFlat?: number;
  thornsRounds?: number;
  /** Remove every negative status from the caster. */
  cleanseSelf?: boolean;
  healAllyLowestPct?: number;
  healAllyLowestFlat?: number;
  healSelfFlat?: number;
  /** Approximated as "a random other alive ally" — no strict adjacency model. */
  healAdjacentAllyPctOfDmg?: number;
  healSelfPctOfDmg?: number;
  shieldAllyLowestFlat?: number;
  /** Give a % of the caster's current shield to the lowest-HP ally. */
  shieldAllyPctOfOwnShield?: number;
  /** Give a % of the caster's current shield to the lowest-HP back-row ally (falls back to lowest-HP ally). */
  shieldBackRowAllyPctOfGain?: number;
  /** Multiplies this cast's blockOnAttack proc (e.g. "3x shield gain this cast"). */
  shieldSelfMult?: number;
  /** 1-round self buffs — reuse the caster's own dodgeUpRound field. */
  selfDodgeUpRound?: number;
  /** Chance to grant selfDodgeUpRound at all on cast. */
  selfDodgeUpOnCastChance?: number;
  /** True multi-round self dodge buff (distinct field, own duration). */
  selfDodgeBuff?: number;
  selfDodgeBuffRounds?: number;
  /** 1-round self damage-reduction buff (temporary, distinct from passive dmgReduction). */
  selfDmgReductionRound?: number;
  /** 1-round self dmg-up buff (distinct from the team-wide teamDmgUpRound). */
  selfDmgUpRound?: number;
  /** 1-round self Speed buff for next round only (distinct from team-wide teamSpeedNextRound). */
  selfSpeedNextRound?: number;
  /** Flat self-damage the caster takes for casting this. */
  selfRecoil?: number;
  /** Bonus crit chance for just this one cast. */
  critChanceThisHit?: number;
  /** Skips the accuracy roll entirely for this cast. */
  guaranteedHit?: boolean;
  /** Flat bonus dmg if the caster currently has shield > 0 (one-shot rider, distinct from the passive %). */
  dmgIfShielded?: number;
  /** Flat bonus dmg vs targets below lowHpThreshold (distinct from the passive % version). */
  execFlatBonus?: number;
  /** Attune: for the rest of this round, the caster's matchup always resolves as favored. */
  forceFavoredRound?: boolean;

  /** Bypass frontline protection — hits the chosen target even if it's back row behind a living front row. */
  pierce?: boolean;
  /** Multi-hit: this many separate to-hit/dodge/crit rolls, each at dmg/hits. */
  hits?: number;
  /** Overrides simple `aoe` targeting: hit the whole front row, or 2 distinct random enemies. */
  aoeMode?: 'front' | 'random2';

  /** Energy refunded to the caster's team if this hit kills its target. */
  energyRefundOnKill?: number;
  /** Chance to refund 1 energy on any cast, independent of whether it kills. */
  energyRefundChance?: number;

  /** Bonus dmg equal to a % of the caster's current shield (block), optionally capped. */
  dmgPctOfShield?: number;
  dmgPctOfShieldCap?: number;
  /** Bonus flat dmg if the caster is the first actor to act this round. */
  dmgIfActedFirst?: number;
  /** Chain: bonus flat dmg per prior cast this same hero has already resolved this round. */
  dmgPerPriorCastThisRound?: number;

  // --- passive conditional knobs (read at cast/derive time, not stored on Hero) ---
  accUp?: number;
  dmgVsLowHpPct?: number;
  lowHpThreshold?: number;
  critVsLowHpPct?: number;
  critDmgUp?: number;
  /** Unconditional passive crit-chance bonus (distinct from the conditional critVsLowHpPct). */
  critUpPct?: number;
  /** Bonus crit chance vs currently-Burning targets. */
  critVsBurnedPct?: number;
  dmgWhileShieldedPct?: number;
  dmgUpWhileLowHpPct?: number;
  /** Bonus dmg % while the caster acted first this round (passive version of dmgIfActedFirst). */
  dmgUpWhileActedFirstPct?: number;
  dmgReductionWhileLowHpPct?: number;
  aoeDmgUpPct?: number;
  multiHitDmgUpPct?: number;
  /** Percentage passive version of dmgVsFrozen. */
  dmgVsFrozenPct?: number;
  /** Chance to refund 1 energy on an AoE or multi-hit cast (once per turn). */
  energyRefundOnAoEChance?: number;
  dmgPer100Shield?: number;
  /** On successfully dodging an incoming hit: recoil dmg dealt back to the attacker. */
  onDodgeRecoil?: number;
  /** On successfully dodging an incoming hit: flat shield gained. */
  onDodgeShield?: number;
  /** While the caster has shield > 0, anyone who lands a hit on them gets Burned. */
  thornBurnDmgWhileShielded?: number;
  thornBurnTicksWhileShielded?: number;
  /** Extra flat shield granted whenever this hero's Taunt is applied. */
  tauntShieldBonus?: number;
  /** Always-on % dmg increase from this hero's attacks (rank-scaled). */
  dmgUpPct?: number;
  /** Additive bonus to this hero's own burnChance rolls (rank-scaled). */
  burnChanceUp?: number;
  /** Additive bonus to the tick damage of burns this hero applies (rank-scaled). */
  burnTickDmgUp?: number;
  /** Additive bonus to the reflect dmg of this hero's own active Thorns status (rank-scaled). */
  thornsFlatUp?: number;
  /** Regen that only applies while this hero currently has shield > 0 (rank-scaled). */
  regenWhileShielded?: number;
  /** Always-on % max HP increase (rank-scaled). */
  maxHpUpPct?: number;
  /** Multiplies the magnitude of this hero's own heal riders (healAllyLowestPct/Flat, healSelfPctOfDmg, teamHeal), rank-scaled. */
  healUpPct?: number;
  /** % of an overheal (past max HP) converted to shield instead of wasted, rank-scaled. */
  overflowToShieldPct?: number;
  /** Also grants the healed ally a 1-round dodge buff of this amount. */
  allyDodgeUpRound?: number;

  // --- monster-kit additions (Aetheria Monster Database) ---
  /** Bonus % dmg vs a target currently under ANY debuff (dmg/dodge/acc down, vulnerable, burning, frozen). */
  dmgVsAnyDebuffPct?: number;
  /** Skips the dodge roll entirely for this hit — distinct from `guaranteedHit`, which only skips the accuracy roll. */
  ignoreDodge?: boolean;
  /** Ignores this % of the target's current Block when absorbing this hit (the block value itself isn't reduced beyond what's absorbed). */
  shieldPiercePct?: number;
  /** Flat self-shield granted on cast — monster kit self-heal/self-shield %-of-own-HP effects are pre-flattened to a number per monster instance at data-build time, so this (like `healSelfFlat`) is always a flat number, never a %. */
  selfShieldFlat?: number;
  /** Rounds `targetDmgDownPct` persists (default 1 if omitted, matching pre-existing 1-round-only behavior). */
  targetDmgDownRounds?: number;
  /** Rounds `targetAccDownPct` persists (default 1 if omitted, matching pre-existing 1-round-only behavior). */
  targetAccDownRounds?: number;
  /** Field Reversal: swap one random alive Front-row ally with one random alive Back-row ally on the caster's OPPOSING team. Utility only — no damage roll, no target selection. */
  swapRandomFrontBack?: boolean;
  /** Heal the lowest-HP ally by this % of THEIR OWN max HP (distinct from `healAllyLowestPct`, which is a % of this cast's own damage dealt — unusable for a 0-damage utility heal like Rally). */
  healAllyLowestPctOfMaxHp?: number;
  /** Team-wide heal, each member healed by this % of THEIR OWN max HP (distinct from the flat `teamHeal`, which applies the same absolute number to every member regardless of their HP). */
  teamHealPctOfMaxHp?: number;
  /** Active-cast % dmg bonus vs a target under `lowHpThreshold` — distinct from the passive `dmgVsLowHpPct` (read from `actor.passives`, which monsters don't have). */
  dmgVsLowHpActivePct?: number;
  /** Active-cast % dmg bonus if the caster acted first this round — distinct from the passive `dmgUpWhileActedFirstPct` (read from `actor.passives`, which monsters don't have). */
  dmgIfActedFirstPct?: number;
  /**
   * Ruinous Charge-style 2-round telegraphed channel: round 1 locks onto
   * whoever holds the lowest Block on the target team (no damage, just a
   * telegraph); round 2 auto-resolves regardless of intervening actions —
   * 100% of the locked target's current Max HP if their Block is still
   * exactly 0 at impact, 50% if they have ANY Block > 0. Bypasses the normal
   * block-soak pipeline entirely (presence of Block, not its size, is the
   * gate). Not a generic rider — handled as a dedicated resolve.ts step.
   */
  channelKind?: 'ruinousCharge';
  /** Rounds this skill locks itself out for on the caster after being cast (e.g. Field Reversal: 2). Checked against the caster's `skillCooldowns` before the AI/player may pick it again. */
  cooldownRounds?: number;
}

export interface SkillPrereq {
  /** Stable id of the prerequisite skill. */
  skillId: string;
  /** Minimum rank the prerequisite must have. */
  rank: number;
}

export interface Skill {
  id: string;
  kind: SkillKind;
  /** Branch name within the element's tree — 'Root' and 'Ultimate' are the two non-branch groups. */
  branch: string;
  tier: 1 | 2 | 3 | 4 | 5;
  cost?: number;
  dmg?: number;
  aoe?: boolean;
  maxRank: number;
  /** AND-combined — every listed prerequisite must be met to raise this skill's rank above 0. */
  prereqs: SkillPrereq[];
  name: string;
  desc: string;
  effect?: SkillEffect;
}

/** A per-mage rank-aware presentation of a Skill, shaped for the hand UI. */
export interface Card {
  id: string;
  el: Element;
  type: SkillKind;
  cost: number;
  name: string;
  stat: string;
  desc: string;
  isUltimate: boolean;
  kind: SkillKind;
  aoe: boolean;
  effect: SkillEffect | null;
  rank: number;
}
