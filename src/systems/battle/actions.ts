import type { BattleState } from '@/types';
import { DECK_CONFIG } from '@/constants';
import { cardById, heroHasAnyValidPlay, playCardFromHand } from './deck';
import { currentPlanningHero, heroById } from './planning';

/** Touch-move commit: spends energy/soul for real and queues the action. */
export function commitPlannedCast(state: BattleState, actorId: string, cardId: string, targetId: string): void {
  const actor = heroById(state, actorId);
  const card = cardById(state, cardId);
  if (!actor || !card) return;

  let fromEnergy = 0;
  let fromSoul = 0;
  if (state.energy >= card.cost) {
    fromEnergy = card.cost;
    state.energy -= card.cost;
  } else {
    fromEnergy = state.energy;
    fromSoul = card.cost - state.energy;
    state.energy = 0;
    state.soul = Math.max(0, state.soul - fromSoul);
  }

  const existing = state.plans[actor.id];
  const plan = Array.isArray(existing) ? existing : [];
  plan.push({ cardId: card.id, targetId, fromEnergy, fromSoul });
  state.plans[actor.id] = plan;

  if (!card.isUltimate) playCardFromHand(actor, card.id);
  state.pendingCardId = null;

  const castCount = plan.length;
  if (castCount >= DECK_CONFIG.maxCastsPerMagePerRound || !heroHasAnyValidPlay(state, actor, state.enemies)) {
    state.heroDone[actor.id] = true;
    const next = currentPlanningHero(state);
    state.planningHeroId = next ? next.id : null;
  }
}

/** Pops a hero's most recent committed cast, refunding its energy/soul cost
 *  and restoring the card to hand (undoes exactly what commitPlannedCast
 *  spent/discarded). Returns the popped card's id, or null if the hero had
 *  nothing queued — shared by the full-undo and reopen-for-editing paths so
 *  they can't drift apart on the refund math. */
function popLastCast(state: BattleState, heroId: string): string | null {
  const h = heroById(state, heroId);
  const plan = state.plans[heroId];
  if (!h || !Array.isArray(plan) || plan.length === 0) return null;

  const last = plan.pop()!;
  state.energy = Math.min(state.maxEnergy, state.energy + (last.fromEnergy || 0));
  state.soul = Math.min(state.maxSoul, state.soul + (last.fromSoul || 0));

  const card = cardById(state, last.cardId);
  if (card && !card.isUltimate) {
    const idx = (h.pendingDiscard ?? []).lastIndexOf(card.id);
    if (idx >= 0) {
      h.pendingDiscard!.splice(idx, 1);
      h.hand ??= [];
      h.hand.push(card.id);
    }
  }
  return card?.id ?? null;
}

/** The small ↩ button above a hero's head: fully undoes their last cast (or
 *  un-passes them) with no re-staging — hand goes back to unselected. */
export function undoLastCast(state: BattleState, heroId: string): void {
  if (state.phase !== 'planning') return;
  const h = heroById(state, heroId);
  if (!h) return;
  popLastCast(state, heroId);
  state.heroDone[heroId] = false;
  state.pendingCardId = null;
  selectHeroForPlanning(state, heroId);
}

/** Explicit tap-to-revisit: select any living player hero at any point during planning. */
export function selectHeroForPlanning(state: BattleState, heroId: string): void {
  if (state.phase !== 'planning') return;
  const h = heroById(state, heroId);
  if (!h || !h.alive || !state.players.some((p) => p.id === heroId)) return;
  state.planningHeroId = heroId;
  state.pendingCardId = null;
}

/** Tapping a hero's own portrait to revisit them: if they already have a
 *  committed cast this round, reopen it as a staged (highlighted) pick —
 *  refunded back into their hand — so the player sees exactly what they
 *  chose and can Cancel/swap it via the normal select→confirm flow, rather
 *  than tapping their portrait and finding no trace of the pick. A passed
 *  hero just un-passes; a hero who hasn't acted yet just switches focus. */
export function reopenHeroForEditing(state: BattleState, heroId: string): void {
  if (state.phase !== 'planning') return;
  const h = heroById(state, heroId);
  if (!h || !h.alive || !state.players.some((p) => p.id === heroId)) return;

  const restagedCardId = popLastCast(state, heroId);
  state.heroDone[heroId] = false;
  state.planningHeroId = heroId;
  state.pendingCardId = restagedCardId;
}

export function assignPass(state: BattleState, heroId: string): void {
  state.heroDone[heroId] = true;
  state.pendingCardId = null;
  const next = currentPlanningHero(state);
  state.planningHeroId = next ? next.id : null;
}

/** Keeps planningHeroId valid without overriding a deliberate manual selection. */
export function syncPlanningHero(state: BattleState): void {
  if (state.phase !== 'planning') return;
  const cur = state.planningHeroId ? heroById(state, state.planningHeroId) : undefined;
  const curValid = cur && cur.alive && state.players.some((p) => p.id === cur.id);
  if (!curValid) {
    const next = currentPlanningHero(state);
    state.planningHeroId = next ? next.id : null;
  }
}
