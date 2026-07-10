import type { BattleEvent, Card, Hero } from '@/types';
import { DEFAULT_BURN_DMG, DEFAULT_BURN_TICKS, elementCounterMult, matchup } from '@/constants';

/** Any status a target is currently under — feeds `dmgVsAnyDebuffPct` (Exploit). */
function hasAnyDebuff(h: Hero): boolean {
  return h.dmgUpRound < 0 || h.dodgeUpRound < 0 || h.accDownRound > 0 || (h.dmgDownRoundsLeft ?? 0) > 0
    || (h.accDownRoundsLeft ?? 0) > 0 || (h.vulnRoundsLeft ?? 0) > 0 || !!h.burn || !!h.frozen;
}

/** Damage application with vuln/shred, block absorption (with optional shield-pierce), damage reduction, reflect, and thorns. */
export function applyHit(target: Hero, attacker: Hero | null, rawDmg: number, shieldPiercePct?: number): { dealt: number; absorbed: number; reflected: number; thorns: number } {
  let dmg = rawDmg;
  if (target.vulnPctRound) dmg = Math.round(dmg * (1 + target.vulnPctRound));
  const reduction = (target.dmgReduction || 0) + (target.dmgReductionRoundExtra || 0);
  if (reduction) dmg = Math.round(dmg * (1 - reduction));

  const wasShielded = target.block > 0;
  let absorbed = 0;
  if (target.block > 0) {
    const effectiveBlock = shieldPiercePct ? target.block * (1 - shieldPiercePct) : target.block;
    absorbed = Math.min(effectiveBlock, dmg);
    target.block -= absorbed;
    dmg -= absorbed;
  }

  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp <= 0) target.alive = false;

  if (dmg > 0) {
    target.damagedThisRound = true;
    if (attacker) {
      target.attackedByThisRound ??= [];
      if (!target.attackedByThisRound.includes(attacker.id)) target.attackedByThisRound.push(attacker.id);
    }
  }

  let reflected = 0;
  if (target.reflect && dmg > 0 && attacker && attacker.alive) {
    reflected = Math.round(dmg * target.reflect);
    if (reflected > 0) {
      attacker.hp = Math.max(0, attacker.hp - reflected);
      if (attacker.hp <= 0) attacker.alive = false;
    }
  }

  let thorns = 0;
  if ((target.thornsFlat ?? 0) > 0 && dmg > 0 && attacker && attacker.alive) {
    thorns = target.thornsFlat!;
    attacker.hp = Math.max(0, attacker.hp - thorns);
    if (attacker.hp <= 0) attacker.alive = false;
  }

  if (wasShielded && dmg > 0 && attacker && attacker.alive && target.passives.thornBurnDmgWhileShielded > 0) {
    attacker.burn = { dmg: target.passives.thornBurnDmgWhileShielded, ticksLeft: target.passives.thornBurnTicksWhileShielded || 1 };
  }

  return { dealt: dmg, absorbed, reflected, thorns };
}

interface DamageContext {
  actor: Hero;
  target: Hero;
  card: Card;
  actedFirst: boolean;
  priorCastsThisRound: number;
}

/** The full outgoing-damage pipeline: every conditional dmg/crit/matchup modifier the v3.1 tree introduces, applied in one pass. */
export function computeAttackDamage(ctx: DamageContext, baseDmg: number): { dmg: number; isCrit: boolean; matchupResult: 'favored' | 'neutral' | 'resisted' } {
  const { actor, target, card } = ctx;
  const eff = card.effect ?? {};
  let dmg = baseDmg;

  dmg = Math.round(dmg * (actor.powMult || 1));
  if (actor.dmgUpRound) dmg = Math.round(dmg * (1 + actor.dmgUpRound));
  if (actor.execBonus && target.hp / target.maxHp < 0.5) dmg = Math.round(dmg * (1 + actor.execBonus));

  const lowHpThreshold = eff.lowHpThreshold ?? actor.passives.lowHpThreshold ?? 0.5;
  const targetLow = target.hp / target.maxHp < lowHpThreshold;

  if (eff.execFlatBonus && targetLow) dmg += eff.execFlatBonus;
  if (actor.passives.dmgVsLowHpPct && targetLow) dmg = Math.round(dmg * (1 + actor.passives.dmgVsLowHpPct));
  if (eff.dmgVsLowHpActivePct && targetLow) dmg = Math.round(dmg * (1 + eff.dmgVsLowHpActivePct));
  if (eff.dmgVsAnyDebuffPct && hasAnyDebuff(target)) dmg = Math.round(dmg * (1 + eff.dmgVsAnyDebuffPct));
  if (eff.dmgVsFrozen && target.frozen) dmg += eff.dmgVsFrozen;
  if (actor.passives.dmgVsFrozenPct && target.frozen) dmg = Math.round(dmg * (1 + actor.passives.dmgVsFrozenPct));
  if (eff.consumeBurnBonus && target.burn) { dmg += eff.consumeBurnBonus; target.burn = undefined; }
  if (eff.dmgVsBurned && target.burn) dmg += eff.dmgVsBurned;
  if (eff.dmgVsTauntingOrShielded && ((target.tauntRoundsLeft ?? 0) > 0 || target.block > 0)) dmg += eff.dmgVsTauntingOrShielded;
  if (eff.dmgVsDamagedThisRound && target.damagedThisRound) dmg += eff.dmgVsDamagedThisRound;
  if (eff.dmgVsAttackedMeLastRound && actor.attackedByLastRound?.includes(target.id)) dmg += eff.dmgVsAttackedMeLastRound;
  if (eff.dmgIfActedFirst && ctx.actedFirst) dmg += eff.dmgIfActedFirst;
  if (actor.passives.dmgUpWhileActedFirstPct && ctx.actedFirst) dmg = Math.round(dmg * (1 + actor.passives.dmgUpWhileActedFirstPct));
  if (eff.dmgIfActedFirstPct && ctx.actedFirst) dmg = Math.round(dmg * (1 + eff.dmgIfActedFirstPct));
  if (eff.dmgPerPriorCastThisRound) dmg += eff.dmgPerPriorCastThisRound * ctx.priorCastsThisRound;
  if (actor.passives.dmgUpPct) dmg = Math.round(dmg * (1 + actor.passives.dmgUpPct));
  if (eff.dmgIfShielded && actor.block > 0) dmg += eff.dmgIfShielded;
  if (actor.passives.dmgWhileShieldedPct && actor.block > 0) dmg = Math.round(dmg * (1 + actor.passives.dmgWhileShieldedPct));
  if (actor.passives.dmgUpWhileLowHpPct && actor.hp / actor.maxHp < 0.5) dmg = Math.round(dmg * (1 + actor.passives.dmgUpWhileLowHpPct));
  if (eff.dmgPctOfShield) {
    let bonus = Math.round(actor.block * eff.dmgPctOfShield);
    if (eff.dmgPctOfShieldCap) bonus = Math.min(bonus, eff.dmgPctOfShieldCap);
    dmg += bonus;
  }
  if (actor.passives.dmgPer100Shield) dmg += Math.floor(actor.block / 100) * actor.passives.dmgPer100Shield;
  if (card.aoe && actor.passives.aoeDmgUpPct) dmg = Math.round(dmg * (1 + actor.passives.aoeDmgUpPct));
  if ((eff.hits ?? 1) > 1 && actor.passives.multiHitDmgUpPct) dmg = Math.round(dmg * (1 + actor.passives.multiHitDmgUpPct));

  const matchupResult = actor.forceFavoredRound ? 'favored' : matchup(actor.el, target.el);
  dmg = Math.round(dmg * elementCounterMult(matchupResult, target.elementLevel, target.elementResistLevel));

  let critChance = actor.crit ?? 0.1;
  critChance += eff.critChanceThisHit ?? 0;
  critChance += actor.passives.critUpPct ?? 0;
  if (targetLow) critChance += actor.passives.critVsLowHpPct ?? 0;
  if (target.burn) critChance += actor.passives.critVsBurnedPct ?? 0;
  const isCrit = Math.random() < critChance;
  if (isCrit) dmg = Math.round(dmg * ((actor.critDmgMult ?? 1.5) + (actor.passives.critDmgUp ?? 0)));

  return { dmg, isCrit, matchupResult };
}

function healHero(h: Hero, amount: number, healUpPct: number | undefined, overflowToShieldPct: number | undefined): number {
  if (amount <= 0 || !h.alive) return 0;
  const boosted = Math.round(amount * (1 + (healUpPct ?? 0)));
  const before = h.hp;
  h.hp = Math.min(h.maxHp, h.hp + boosted);
  const actualHealed = h.hp - before;
  const overflow = boosted - actualHealed;
  if (overflow > 0 && overflowToShieldPct) h.block += Math.round(overflow * overflowToShieldPct);
  return actualHealed;
}

function cleanseHero(h: Hero): void {
  h.burn = undefined;
  h.frozen = false;
  h.vulnPctRound = 0;
  h.vulnRoundsLeft = 0;
  if (h.dmgUpRound < 0) h.dmgUpRound = 0;
  if (h.dodgeUpRound < 0) h.dodgeUpRound = 0;
  h.accDownRound = 0;
  if (h.speedNextRound < 0) h.speedNextRound = 0;
}

function lowestHpAlly(team: Hero[], excludeId?: string): Hero | undefined {
  return team.filter((h) => h.alive && h.id !== excludeId).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

/**
 * Post-hit rider effects for an attack card — burn/freeze application, single-target
 * debuffs, self buffs (taunt/thorns/dodge/attune/recoil), and heal/shield riders.
 * Applied once per landed hit (multi-hit skills call this per hit, matching the
 * "each hit heals/Burns X%" flavor of skills like Twin Streams/Ember Volley).
 */
export function applyOnHitRiders(
  actor: Hero,
  target: Hero,
  card: Card,
  dealt: number,
  killed: boolean,
  allyTeam: Hero[],
  energyState: { energy: number; maxEnergy: number },
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const eff = card.effect ?? {};

  if (eff.burnChance && Math.random() < eff.burnChance + (actor.passives.burnChanceUp ?? 0)) {
    const tickDmg = (eff.burnDmg ?? DEFAULT_BURN_DMG) + (actor.passives.burnTickDmgUp ?? 0);
    target.burn = { dmg: tickDmg, ticksLeft: eff.burnTicks ?? DEFAULT_BURN_TICKS };
    events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'burning' });
  }
  if (eff.freezeChance && Math.random() < eff.freezeChance) {
    target.frozen = true;
    events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'frozen' });
  }
  if (eff.shatterFreeze && target.frozen) target.frozen = false;
  if (eff.shredPct) {
    target.vulnPctRound = Math.max(target.vulnPctRound ?? 0, eff.shredPct);
    target.vulnRoundsLeft = Math.max(target.vulnRoundsLeft ?? 0, eff.shredRounds ?? 1);
    events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'vulnerable' });
  }
  if (eff.targetDmgDownPct) {
    target.dmgUpRound = Math.min(target.dmgUpRound, -eff.targetDmgDownPct);
    if (eff.targetDmgDownRounds && eff.targetDmgDownRounds > 1) target.dmgDownRoundsLeft = Math.max(target.dmgDownRoundsLeft ?? 0, eff.targetDmgDownRounds);
    events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'dmgDown' });
  }
  if (eff.targetDodgeDownPct) { target.dodgeUpRound = Math.min(target.dodgeUpRound, -eff.targetDodgeDownPct); events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'dodgeDown' }); }
  if (eff.targetAccDownPct) {
    target.accDownRound = Math.max(target.accDownRound || 0, eff.targetAccDownPct);
    if (eff.targetAccDownRounds && eff.targetAccDownRounds > 1) target.accDownRoundsLeft = Math.max(target.accDownRoundsLeft ?? 0, eff.targetAccDownRounds);
    events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'accDown' });
  }
  if (eff.targetSpeedDown) { target.speedNextRound = Math.min(target.speedNextRound, -eff.targetSpeedDown); events.push({ type: 'buffApplied', targetId: target.id, statusKind: 'speedDown' }); }

  if (killed && eff.energyRefundOnKill) energyState.energy = Math.min(energyState.maxEnergy, energyState.energy + eff.energyRefundOnKill);
  if (eff.energyRefundChance && Math.random() < eff.energyRefundChance) energyState.energy = Math.min(energyState.maxEnergy, energyState.energy + 1);

  if (eff.tauntRounds) {
    actor.tauntRoundsLeft = Math.max(actor.tauntRoundsLeft ?? 0, eff.tauntRounds);
    if (actor.passives.tauntShieldBonus) actor.block += actor.passives.tauntShieldBonus;
    events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'taunting' });
  }
  if (eff.thornsFlat) {
    actor.thornsFlat = Math.max(actor.thornsFlat ?? 0, eff.thornsFlat + (actor.passives.thornsFlatUp ?? 0));
    actor.thornsRoundsLeft = Math.max(actor.thornsRoundsLeft ?? 0, eff.thornsRounds ?? 1);
    events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'thorns' });
  }
  if (eff.cleanseSelf) cleanseHero(actor);
  if (eff.forceFavoredRound) { actor.forceFavoredRound = true; events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'attuned' }); }
  if (eff.selfDodgeUpRound && (!eff.selfDodgeUpOnCastChance || Math.random() < eff.selfDodgeUpOnCastChance)) {
    actor.dodgeUpRound = Math.max(actor.dodgeUpRound, eff.selfDodgeUpRound);
    events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'dodgeUp' });
  }
  if (eff.selfDodgeBuff) {
    actor.dodgeBuffExtra = Math.max(actor.dodgeBuffExtra ?? 0, eff.selfDodgeBuff);
    actor.dodgeBuffRoundsLeft = Math.max(actor.dodgeBuffRoundsLeft ?? 0, eff.selfDodgeBuffRounds ?? 1);
    events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'dodgeUp' });
  }
  if (eff.selfDmgReductionRound) actor.dmgReductionRoundExtra = Math.max(actor.dmgReductionRoundExtra ?? 0, eff.selfDmgReductionRound);
  if (eff.selfDmgUpRound) { actor.dmgUpRound = Math.max(actor.dmgUpRound, eff.selfDmgUpRound); events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'dmgUp' }); }
  if (eff.selfSpeedNextRound) actor.speedNextRound = Math.max(actor.speedNextRound, eff.selfSpeedNextRound);
  if (eff.selfRecoil) { actor.hp = Math.max(0, actor.hp - eff.selfRecoil); if (actor.hp <= 0) actor.alive = false; }
  if (eff.selfShieldFlat) { actor.block += eff.selfShieldFlat; events.push({ type: 'block', targetId: actor.id, amount: eff.selfShieldFlat }); events.push({ type: 'buffApplied', targetId: actor.id, statusKind: 'shielded' }); }

  const healUp = actor.passives.healUpPct;
  const overflowPct = actor.passives.overflowToShieldPct;
  if (eff.healSelfFlat) healHero(actor, eff.healSelfFlat, healUp, overflowPct);
  if (eff.healSelfPctOfDmg) healHero(actor, Math.round(dealt * eff.healSelfPctOfDmg), healUp, overflowPct);

  if (eff.healAllyLowestFlat) {
    const a = lowestHpAlly(allyTeam);
    if (a) { const healed = healHero(a, eff.healAllyLowestFlat, healUp, overflowPct); if (healed > 0) events.push({ type: 'heal', targetId: a.id, amount: healed }); }
  }
  if (eff.healAllyLowestPct) {
    const a = lowestHpAlly(allyTeam);
    if (a) {
      const amt = Math.round(dealt * eff.healAllyLowestPct);
      const healed = healHero(a, amt, healUp, overflowPct);
      if (healed > 0) events.push({ type: 'heal', targetId: a.id, amount: healed });
      if (eff.allyDodgeUpRound) a.dodgeUpRound = Math.max(a.dodgeUpRound, eff.allyDodgeUpRound);
    }
  }
  if (eff.healAllyLowestPctOfMaxHp) {
    const a = lowestHpAlly(allyTeam);
    if (a) {
      const healed = healHero(a, Math.round(a.maxHp * eff.healAllyLowestPctOfMaxHp), healUp, overflowPct);
      if (healed > 0) events.push({ type: 'heal', targetId: a.id, amount: healed });
    }
  }
  if (eff.healAdjacentAllyPctOfDmg) {
    const others = allyTeam.filter((h) => h.alive && h.id !== actor.id);
    const a = others[Math.floor(Math.random() * others.length)];
    if (a) { const healed = healHero(a, Math.round(dealt * eff.healAdjacentAllyPctOfDmg), healUp, overflowPct); if (healed > 0) events.push({ type: 'heal', targetId: a.id, amount: healed }); }
  }
  if (eff.shieldAllyLowestFlat) {
    const a = lowestHpAlly(allyTeam);
    if (a) { a.block += eff.shieldAllyLowestFlat; events.push({ type: 'block', targetId: a.id, amount: eff.shieldAllyLowestFlat }); }
  }
  if (eff.shieldAllyPctOfOwnShield) {
    const a = lowestHpAlly(allyTeam, actor.id);
    if (a) { const amt = Math.round(actor.block * eff.shieldAllyPctOfOwnShield); a.block += amt; events.push({ type: 'block', targetId: a.id, amount: amt }); }
  }
  if (eff.shieldBackRowAllyPctOfGain) {
    const backRow = allyTeam.filter((h) => h.alive && h.row === 'back' && h.id !== actor.id).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
    const a = backRow[0] ?? lowestHpAlly(allyTeam, actor.id);
    if (a) { const amt = Math.round(actor.block * eff.shieldBackRowAllyPctOfGain); a.block += amt; events.push({ type: 'block', targetId: a.id, amount: amt }); }
  }

  return events;
}

/** Buff/debuff card resolution — targets own team (or enemy team for the
 *  handful of debuff-flavored buffs), no to-hit rolls. Mutates in place and
 *  returns the events the UI should animate/announce. */
export function applyBuffCard(
  card: Card,
  team: Hero[],
  enemyTeam: Hero[],
  energyState: { energy: number; maxEnergy: number },
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const eff = card.effect ?? {};
  const healUp = team[0]?.passives?.healUpPct;
  const overflowPct = team[0]?.passives?.overflowToShieldPct;

  if (eff.teamHeal) team.forEach((h) => {
    const healed = healHero(h, eff.teamHeal!, healUp, overflowPct);
    if (healed > 0) events.push({ type: 'heal', targetId: h.id, amount: healed });
  });
  if (eff.teamHealPctOfMaxHp) team.forEach((h) => {
    if (!h.alive) return;
    const healed = healHero(h, Math.round(h.maxHp * eff.teamHealPctOfMaxHp!), healUp, overflowPct);
    if (healed > 0) events.push({ type: 'heal', targetId: h.id, amount: healed });
  });
  if (eff.teamBlock) team.forEach((h) => {
    h.block += eff.teamBlock!;
    events.push({ type: 'block', targetId: h.id, amount: eff.teamBlock! });
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'shielded' });
  });
  if (eff.teamDmgUpRound) team.forEach((h) => {
    h.dmgUpRound = Math.max(h.dmgUpRound, eff.teamDmgUpRound!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'dmgUp' });
  });
  if (eff.teamDodgeUpRound) team.forEach((h) => {
    h.dodgeUpRound = Math.max(h.dodgeUpRound, eff.teamDodgeUpRound!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'dodgeUp' });
  });
  if (eff.teamSpeedNextRound) team.forEach((h) => {
    h.speedNextRound = Math.max(h.speedNextRound, eff.teamSpeedNextRound!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'speedUp' });
  });
  if (eff.teamRegenAmount) team.forEach((h) => {
    if (!h.alive) return;
    h.tempRegen = { amount: Math.max(h.tempRegen?.amount ?? 0, eff.teamRegenAmount!), roundsLeft: Math.max(h.tempRegen?.roundsLeft ?? 0, eff.teamRegenRounds ?? 1) };
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'regen' });
  });
  if (eff.cleanseTeam) team.forEach((h) => cleanseHero(h));
  if (eff.reviveAllyPct) {
    const fallen = team.find((h) => !h.alive);
    if (fallen) {
      fallen.alive = true;
      fallen.hp = Math.round(fallen.maxHp * eff.reviveAllyPct);
      events.push({ type: 'heal', targetId: fallen.id, amount: fallen.hp });
    }
  }
  if (eff.energyGain) energyState.energy = Math.min(energyState.maxEnergy, energyState.energy + eff.energyGain);

  // Debuffs reuse the buffs' round-scoped fields with a negative magnitude —
  // Math.min (not Max) so the STRONGER debuff wins if two stack.
  if (eff.enemyDmgDown) enemyTeam.forEach((h) => {
    h.dmgUpRound = Math.min(h.dmgUpRound, -eff.enemyDmgDown!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'dmgDown' });
  });
  if (eff.enemyDodgeDown) enemyTeam.forEach((h) => {
    h.dodgeUpRound = Math.min(h.dodgeUpRound, -eff.enemyDodgeDown!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'dodgeDown' });
  });
  if (eff.enemySpeedDown) enemyTeam.forEach((h) => {
    h.speedNextRound = Math.min(h.speedNextRound, -eff.enemySpeedDown!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'speedDown' });
  });
  if (eff.enemyAccDown) enemyTeam.forEach((h) => {
    h.accDownRound = Math.max(h.accDownRound || 0, eff.enemyAccDown!);
    events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'accDown' });
  });
  if (eff.swapRandomFrontBack) {
    const front = enemyTeam.filter((h) => h.alive && h.row === 'front');
    const back = enemyTeam.filter((h) => h.alive && h.row === 'back');
    if (front.length && back.length) {
      const f = front[Math.floor(Math.random() * front.length)]!;
      const b = back[Math.floor(Math.random() * back.length)]!;
      f.row = 'back'; b.row = 'front';
      events.push({ type: 'log', message: `The formation is reversed — ${f.name} and ${b.name} swap rows!` });
    }
  }
  if (eff.freezeAllChance) enemyTeam.forEach((h) => {
    if (!h.alive) return;
    const dodgeChance = Math.max(0, Math.min(0.75, (h.dodge || 0) + (h.dodgeUpRound || 0) + (h.dodgeBuffExtra || 0)));
    if (Math.random() < dodgeChance) return;
    if (Math.random() < eff.freezeAllChance!) { h.frozen = true; events.push({ type: 'buffApplied', targetId: h.id, statusKind: 'frozen' }); }
  });

  return events;
}

/** Duration ticking at end of round: burn DoT, temp regen, shred/thorns/taunt/dodge-buff countdowns, and round-scoped resets not already handled elsewhere. */
export function tickHeroStatuses(h: Hero): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (h.burn && h.alive) {
    h.hp = Math.max(0, h.hp - h.burn.dmg);
    events.push({ type: 'hit', actorId: h.id, targetId: h.id, amount: h.burn.dmg, absorbed: 0, reflected: 0, isCrit: false, matchup: 'neutral' });
    if (h.hp <= 0) { h.alive = false; events.push({ type: 'death', targetId: h.id }); }
    h.burn.ticksLeft -= 1;
    if (h.burn.ticksLeft <= 0) h.burn = undefined;
  }
  if (h.tempRegen && h.alive) {
    h.hp = Math.min(h.maxHp, h.hp + h.tempRegen.amount);
    h.tempRegen.roundsLeft -= 1;
    if (h.tempRegen.roundsLeft <= 0) h.tempRegen = undefined;
  }
  if (h.passives?.regenWhileShielded && h.block > 0 && h.alive) h.hp = Math.min(h.maxHp, h.hp + h.passives.regenWhileShielded);
  if ((h.vulnRoundsLeft ?? 0) > 0) {
    h.vulnRoundsLeft = (h.vulnRoundsLeft ?? 0) - 1;
    if (h.vulnRoundsLeft <= 0) { h.vulnRoundsLeft = 0; h.vulnPctRound = 0; }
  }
  if ((h.dmgDownRoundsLeft ?? 0) > 0) h.dmgDownRoundsLeft = (h.dmgDownRoundsLeft ?? 0) - 1;
  if ((h.accDownRoundsLeft ?? 0) > 0) h.accDownRoundsLeft = (h.accDownRoundsLeft ?? 0) - 1;
  if ((h.thornsRoundsLeft ?? 0) > 0) {
    h.thornsRoundsLeft = (h.thornsRoundsLeft ?? 0) - 1;
    if (h.thornsRoundsLeft <= 0) { h.thornsRoundsLeft = 0; h.thornsFlat = 0; }
  }
  if ((h.tauntRoundsLeft ?? 0) > 0) h.tauntRoundsLeft = (h.tauntRoundsLeft ?? 0) - 1;
  if ((h.dodgeBuffRoundsLeft ?? 0) > 0) {
    h.dodgeBuffRoundsLeft = (h.dodgeBuffRoundsLeft ?? 0) - 1;
    if (h.dodgeBuffRoundsLeft <= 0) { h.dodgeBuffRoundsLeft = 0; h.dodgeBuffExtra = 0; }
  }
  h.forceFavoredRound = false;
  h.dmgReductionRoundExtra = 0;
  h.damagedThisRound = false;
  h.attackedByLastRound = h.attackedByThisRound ?? [];
  h.attackedByThisRound = [];
  return events;
}
