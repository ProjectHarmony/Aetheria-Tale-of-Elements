import type { BattleEvent, BattleState, Card, EnemyPlan, Hero, PlayerCast } from '@/types';
import { ALL_SKILLS_BY_ID, DECK_CONFIG, ENERGY_PER_ROUND, RESOLUTION_HIT_DELAY_MS, RESOLUTION_STEP_GAP_MS, skillDamage } from '@/constants';
import { delay } from '@/utils/delay';
import { applyBuffCard, applyHit, applyOnHitRiders, computeAttackDamage, tickHeroStatuses } from './combat';
import { cardById, drawCards, flushPendingDiscards, shuffleArray, validTargets } from './deck';
import { aliveHeroes, currentPlanningHero, heroById } from './planning';

interface QueueStep {
  actorId: string;
  side: 'player' | 'enemy';
  plan: PlayerCast | EnemyPlan;
  speed: number;
}

export function regenEnergyForRound(state: Pick<BattleState, 'energy' | 'maxEnergy' | 'soul' | 'maxSoul'>): { gained: number; overflow: number } {
  let total = state.energy + ENERGY_PER_ROUND;
  let overflow = 0;
  if (total > state.maxEnergy) {
    overflow = total - state.maxEnergy;
    state.soul = Math.min(state.maxSoul, state.soul + overflow);
    total = state.maxEnergy;
  }
  state.energy = total;
  return { gained: ENERGY_PER_ROUND, overflow };
}

/** Enemy AI: picks the strongest (highest-cost) currently-affordable skill
 *  from the monster's own kit, falling back to nothing playable (shouldn't
 *  happen — every monster's basic attack costs 1e and starting energy is
 *  always >= 1). Ties broken randomly for a little variety. */
function chooseEnemySkill(actor: Hero): Card | null {
  const moveset = actor.moveset ?? [];
  const affordable = moveset.filter((c) => c.cost <= (actor.energy ?? 0) && !(actor.skillCooldowns?.[c.id] ?? 0));
  if (affordable.length === 0) return null;
  const maxCost = Math.max(...affordable.map((c) => c.cost));
  const best = affordable.filter((c) => c.cost === maxCost);
  return best[Math.floor(Math.random() * best.length)] ?? null;
}

/** Picks the AoE-mode-appropriate target list for a player cast. Single-target cards return just [target]. */
function targetsFor(card: { aoe: boolean; effect: { aoeMode?: 'front' | 'random2' } | null } | undefined, target: Hero, enemies: Hero[]): Hero[] {
  const mode = card?.effect?.aoeMode;
  if (card?.aoe) return aliveHeroes(enemies);
  if (mode === 'front') {
    const alive = aliveHeroes(enemies);
    const front = alive.filter((h) => h.row === 'front');
    return front.length > 0 ? front : alive;
  }
  if (mode === 'random2') return shuffleArray(aliveHeroes(enemies)).slice(0, 2);
  return [target];
}

/**
 * Resolution is decoupled from rendering entirely: this async generator
 * mutates the battle state draft it's given (same in-place-mutation model
 * the original engine used for its global `state` object) and yields a
 * BattleEvent after every meaningful beat. The caller (battleStore) is
 * responsible for re-publishing the draft to subscribers after each yield
 * and for driving Framer Motion off the events — this module has zero
 * knowledge of React, the DOM, or how anything is drawn.
 */
export async function* resolveRound(state: BattleState): AsyncGenerator<BattleEvent, void, unknown> {
  state.phase = 'resolving';
  state.planningHeroId = null;
  state.pendingCardId = null;

  // Build the enemy AI's plans now (hidden choice, revealed as steps
  // resolve). Enemies regen their own energy here rather than at endRound
  // (like players do) since an enemy's "planning" and "resolution" are the
  // same step, unlike the player's split plan/resolve phases.
  for (const e of aliveHeroes(state.enemies)) {
    e.energy = Math.min(e.maxEnergy ?? 10, (e.energy ?? 0) + ENERGY_PER_ROUND);

    const targets = validTargets(state.players, null);
    if (targets.length === 0) continue;

    // A Ruinous Charge-style channel started last round resolves now,
    // regardless of what else this monster might otherwise afford/choose —
    // it spends its entire action on the payoff, not a fresh pick.
    if (e.channel && e.channel.resolvesRound === state.round) {
      const channelSkill = e.moveset?.find((c) => c.id === e.channel!.skillId);
      if (channelSkill) state.plans[e.id] = { isEnemy: true, targetId: e.channel.targetId, card: channelSkill };
      e.channel = undefined;
      continue;
    }

    const chosen = chooseEnemySkill(e);
    if (!chosen) continue;
    e.energy = Math.max(0, (e.energy ?? 0) - chosen.cost);

    if (chosen.effect?.channelKind === 'ruinousCharge') {
      // Round 1: lock onto whoever holds the lowest Block, telegraph, no
      // damage yet — this IS the monster's whole action for the round.
      const lowestBlock = [...targets].sort((a, b) => a.block - b.block)[0]!;
      e.channel = { skillId: chosen.id, targetId: lowestBlock.id, resolvesRound: state.round + 1 };
      yield { type: 'log', message: `⚠️ ${e.name} begins channeling ${chosen.name} at ${lowestBlock.name}!` };
      continue;
    }

    const target = targets[Math.floor(Math.random() * targets.length)]!;
    state.plans[e.id] = { isEnemy: true, targetId: target.id, card: chosen };
  }
  state.enemyActionsRemaining = Object.keys(state.plans).filter((id) => state.enemies.some((e) => e.id === id)).length;

  // Build the action queue, sorted by speed (fastest acts first). Player
  // heroes may contribute up to maxCastsPerMagePerRound entries each.
  const queue: QueueStep[] = [];
  aliveHeroes(state.players).forEach((h) => {
    const casts = state.plans[h.id];
    if (Array.isArray(casts)) casts.forEach((p) => queue.push({ actorId: h.id, side: 'player', plan: p, speed: h.speed }));
  });
  aliveHeroes(state.enemies).forEach((h) => {
    const p = state.plans[h.id];
    if (p && !Array.isArray(p)) queue.push({ actorId: h.id, side: 'enemy', plan: p, speed: h.speed });
  });
  queue.sort((a, b) => b.speed - a.speed);

  let actedFirstId: string | null = null;
  const priorCasts = new Map<string, number>();

  for (const step of queue) {
    const actor = heroById(state, step.actorId);
    if (!actor || !actor.alive) continue;
    const target = heroById(state, step.plan.targetId);
    if (!target || !target.alive) continue;

    yield { type: 'actingStart', actorId: actor.id };
    if (step.side === 'enemy') {
      state.enemyActionsRemaining = Math.max(0, state.enemyActionsRemaining - 1);
    }

    if (actor.frozen) {
      actor.frozen = false;
      yield { type: 'log', message: `${actor.name} is Frozen and skips their turn!` };
      yield { type: 'actingEnd', actorId: actor.id };
      continue;
    }

    const actedFirst = actedFirstId === null;
    if (actedFirstId === null) actedFirstId = actor.id;

    const card = step.side === 'player' ? cardById(state, (step.plan as PlayerCast).cardId) : (step.plan as EnemyPlan).card;
    const cardName = card ? card.name : 'an attack';
    const isChannelPayoff = card?.effect?.channelKind === 'ruinousCharge';
    const dealsDirectDamage = card ? (!!ALL_SKILLS_BY_ID[card.id]?.dmg || isChannelPayoff) : true;
    const isBuff = !!card && !dealsDirectDamage;
    yield { type: 'cast', actorId: actor.id, targetId: target.id, cardName, cardDesc: card?.desc ?? '', isBuff };
    yield { type: 'log', message: `✨ ${actor.name} uses ${cardName}${isBuff ? '' : ` on ${target.name}`}!` };

    await delay(RESOLUTION_HIT_DELAY_MS);

    // Whichever side the actor is on, `opposingTeam` is who its attacks/AoE
    // should hit and `ownTeam` is who its buffs/heals should hit — computed
    // once so a monster's AoE (Cleave, Unnerving Roar, a Boss's Crownfall)
    // targets the PLAYER team, not hardcoded to `state.enemies` (which used
    // to mean an acting monster's AoE hit its own side — itself, if solo,
    // or its Underlings in a Boss trio — dealing zero damage to players).
    const casterIsPlayer = state.players.some((h) => h.id === actor.id);
    const ownTeam = aliveHeroes(casterIsPlayer ? state.players : state.enemies);
    const opposingTeam = aliveHeroes(casterIsPlayer ? state.enemies : state.players);

    // Team/enemy-wide effects apply unconditionally on cast, independent of
    // whether the card also deals direct damage (covers both classic buff
    // cards and hybrid Ultimates like World Pillar: AoE dmg + team shield + taunt).
    if (card && card.effect) {
      const buffEvents = applyBuffCard(card, ownTeam, opposingTeam, state);
      for (const ev of buffEvents) yield ev;
      if (card.effect.cooldownRounds) {
        actor.skillCooldowns = { ...actor.skillCooldowns, [card.id]: card.effect.cooldownRounds };
      }
    }

    if (dealsDirectDamage) {
      const targets: Hero[] = targetsFor(card, target, opposingTeam);
      const hitsCount = card?.effect?.hits ?? 1;
      const alliesOfActor = ownTeam;

      for (const t of targets) {
        for (let hitIdx = 0; hitIdx < hitsCount; hitIdx++) {
          if (!t.alive) break;

          // Ruinous Charge bypasses the entire normal to-hit/dodge/block
          // pipeline — presence of Block (not its size) is the only gate.
          if (isChannelPayoff) {
            const dmg = t.block > 0 ? Math.round(t.maxHp * 0.5) : t.maxHp;
            t.hp = Math.max(0, t.hp - dmg);
            if (t.hp <= 0) t.alive = false;
            yield { type: 'hit', actorId: actor.id, targetId: t.id, amount: dmg, absorbed: 0, reflected: 0, isCrit: false, matchup: 'neutral' };
            yield { type: 'log', message: `${cardName} resolves on ${t.name}!` };
            if (!t.alive) yield { type: 'death', targetId: t.id };
            continue;
          }

          const guaranteedHit = !!card?.effect?.guaranteedHit;
          const acc = Math.max(0.1, (actor.acc ?? 0.9) - (actor.accDownRound || 0));
          if (!guaranteedHit && Math.random() > acc) {
            yield { type: 'miss', targetId: t.id };
            yield { type: 'log', message: `${cardName} misses ${t.name}!` };
            continue;
          }
          const ignoreDodge = !!card?.effect?.ignoreDodge;
          const dodgeChance = ignoreDodge ? 0 : Math.max(0, Math.min(0.75, (t.dodge || 0) + (t.dodgeUpRound || 0) + (t.dodgeBuffExtra || 0)));
          if (Math.random() < dodgeChance) {
            yield { type: 'dodge', targetId: t.id };
            yield { type: 'log', message: `${t.name} dodges ${cardName}!` };
            if (t.passives?.onDodgeRecoil && actor.alive) {
              actor.hp = Math.max(0, actor.hp - t.passives.onDodgeRecoil);
              if (actor.hp <= 0) actor.alive = false;
              yield { type: 'hit', actorId: t.id, targetId: actor.id, amount: t.passives.onDodgeRecoil, absorbed: 0, reflected: 0, isCrit: false, matchup: 'neutral' };
            }
            if (t.passives?.onDodgeShield) {
              t.block += t.passives.onDodgeShield;
              yield { type: 'block', targetId: t.id, amount: t.passives.onDodgeShield };
            }
            continue;
          }

          const skill = card ? ALL_SKILLS_BY_ID[card.id] : undefined;
          const baseDmg = skill ? skillDamage(skill, card!.rank || 1) / hitsCount : 0;
          const res = computeAttackDamage({ actor, target: t, card: card!, actedFirst, priorCastsThisRound: priorCasts.get(actor.id) || 0 }, baseDmg);
          const dmg = res.dmg, isCrit = res.isCrit, m = res.matchupResult;

          const applied = applyHit(t, actor, dmg, card?.effect?.shieldPiercePct);
          yield { type: 'hit', actorId: actor.id, targetId: t.id, amount: applied.dealt, absorbed: applied.absorbed, reflected: applied.reflected, isCrit, matchup: m };
          if (applied.thorns > 0) yield { type: 'log', message: `${actor.name} is scorched by ${t.name}'s thorns for ${applied.thorns}!` };
          if (!t.alive) yield { type: 'death', targetId: t.id };

          if (card) {
            const riderEvents = applyOnHitRiders(actor, t, card, applied.dealt, !t.alive, alliesOfActor, state);
            for (const ev of riderEvents) yield ev;
          }
        }
      }

      // Chain Gale-style secondary hit on one other random enemy, at a % of the primary dmg.
      const secondaryPct = card?.effect?.secondaryRandomPct;
      if (card && secondaryPct && !isChannelPayoff) {
        const others = opposingTeam.filter((h) => h.id !== target.id);
        const t2 = others[Math.floor(Math.random() * others.length)];
        const skill = ALL_SKILLS_BY_ID[card.id];
        if (t2 && skill) {
          const baseDmg = skillDamage(skill, card.rank || 1) * secondaryPct;
          const res2 = computeAttackDamage({ actor, target: t2, card, actedFirst, priorCastsThisRound: priorCasts.get(actor.id) || 0 }, baseDmg);
          const applied = applyHit(t2, actor, res2.dmg, card.effect?.shieldPiercePct);
          yield { type: 'hit', actorId: actor.id, targetId: t2.id, amount: applied.dealt, absorbed: applied.absorbed, reflected: applied.reflected, isCrit: res2.isCrit, matchup: res2.matchupResult };
          if (!t2.alive) yield { type: 'death', targetId: t2.id };
        }
      }

      if (step.side === 'player' && actor.blockOnAttack) {
        const mult = card?.effect?.shieldSelfMult ?? 1;
        const gain = Math.round(actor.blockOnAttack * mult);
        actor.block += gain;
        yield { type: 'block', targetId: actor.id, amount: gain };
        yield { type: 'buffApplied', targetId: actor.id, statusKind: 'blockOnAttack' };
      }
    }

    if (step.side === 'player') priorCasts.set(actor.id, (priorCasts.get(actor.id) || 0) + 1);

    yield { type: 'actingEnd', actorId: actor.id };

    if (step.side === 'player') {
      state.combo = (state.combo + 1) % 3;
      const energyGranted = state.combo === 0;
      if (energyGranted) state.energy = Math.min(state.maxEnergy, state.energy + 1);
      yield { type: 'combo', comboValue: state.combo, energyGranted };
    }

    await delay(RESOLUTION_STEP_GAP_MS);
  }

  yield* endRound(state);
}

function* endRound(state: BattleState): Generator<BattleEvent, void, unknown> {
  flushPendingDiscards(state.players);

  for (const h of [...state.players, ...state.enemies]) {
    const tickEvents = tickHeroStatuses(h);
    for (const ev of tickEvents) yield ev;
  }

  const enemiesAlive = aliveHeroes(state.enemies).length;
  const playersAlive = aliveHeroes(state.players).length;
  if (enemiesAlive === 0 || playersAlive === 0) {
    state.phase = 'ended';
    // A mutual wipe (both sides hit 0 the same round) counts as a player
    // win, not a loss — you took out the last enemy, full stop. This edge
    // case got much more common once HP started carrying over between
    // fights (Pokemon-style): entering a fight already wounded means a
    // last-enemy kill and your own last mage's death can land in the same
    // round, and defaulting that to "enemies win" felt like the game
    // stealing a victory the player clearly earned.
    state.winner = enemiesAlive === 0 ? 'players' : 'enemies';
    yield { type: 'battleEnd', winner: state.winner };
    return;
  }

  [...state.players, ...state.enemies].forEach((h) => {
    if (!h.alive) return;
    if (h.regen) h.hp = Math.min(h.maxHp, h.hp + h.regen);
    // A multi-round targetDmgDownPct/targetAccDownPct rider (Rending Blow,
    // Debt Collection, Crownfall) leaves dmgDownRoundsLeft/accDownRoundsLeft
    // still counting after tickHeroStatuses' decrement above — skip the
    // hard reset while that's true so the debuff survives past round 1.
    if (!((h.dmgDownRoundsLeft ?? 0) > 0)) h.dmgUpRound = 0;
    h.dodgeUpRound = 0;
    if (!((h.accDownRoundsLeft ?? 0) > 0)) h.accDownRound = 0;
    if (h.speedNextRound) {
      h.speed += h.speedNextRound;
      h.speedSurge = h.speedNextRound;
      h.speedNextRound = 0;
    } else if (h.speedSurge) {
      h.speed -= h.speedSurge;
      h.speedSurge = 0;
    }
  });

  state.round += 1;
  state.plans = {};
  state.heroDone = {};
  state.phase = 'planning';
  const regen = regenEnergyForRound(state);
  state.planningHeroId = currentPlanningHero(state)?.id ?? null;

  aliveHeroes(state.players).forEach((h) => {
    const need = Math.min(DECK_CONFIG.drawPerRound, DECK_CONFIG.handSize - (h.hand?.length ?? 0));
    if (need > 0) drawCards(h, need);
  });

  yield { type: 'log', message: `Round ${state.round} begins — +${regen.gained} energy${regen.overflow > 0 ? ` (+${regen.overflow} Soul Charge overflow)` : ''}.` };
  yield { type: 'roundEnd' };
}
