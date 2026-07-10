import type { BattleState, Card, Hero } from '@/types';
import { DECK_CONFIG } from '@/constants';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Draws up to `n` cards into hero.hand, reshuffling discard -> deck when the draw pile runs dry mid-draw. */
export function drawCards(hero: Hero, n: number): void {
  const deck = (hero.deck ??= []);
  const discard = (hero.discard ??= []);
  const hand = (hero.hand ??= []);
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) return;
      // Mutate deck/discard in place (not `hero.deck = ...`) so the `deck`/
      // `discard` locals captured above stay in sync — reassigning the
      // hero's properties instead left those locals pointing at stale
      // arrays, so every later iteration this call saw a "still full"
      // discard pile and reshuffled+redrew the same card over and over.
      deck.push(...shuffleArray(discard));
      discard.length = 0;
    }
    const card = deck.pop();
    if (card) hand.push(card);
  }
}

/** Removes a card from hand the moment it's played, staging it for discard
 *  (the whole round's plays move to discard together, at endRound). */
export function playCardFromHand(hero: Hero, cardId: string): void {
  const hand = (hero.hand ??= []);
  const i = hand.indexOf(cardId);
  if (i >= 0) hand.splice(i, 1);
  hero.pendingDiscard ??= [];
  hero.pendingDiscard.push(cardId);
}

export function flushPendingDiscards(players: Hero[]): void {
  players.forEach((h) => {
    if (h.pendingDiscard && h.pendingDiscard.length) {
      h.discard ??= [];
      h.discard.push(...h.pendingDiscard);
      h.pendingDiscard = [];
    }
  });
}

export function cardById(state: Pick<BattleState, 'runtimeCards'>, id: string): Card | undefined {
  return state.runtimeCards[id];
}

/**
 * Playable cards for a hero this round. Enemies don't run the deck/hand
 * cycle in this engine — their single action per round is a flat random
 * "basic attack" resolved directly in resolveRound, matching the original
 * script.js AI (see `startResolution`), so this only has a real answer for
 * player heroes.
 */
export function cardsForHero(state: Pick<BattleState, 'runtimeCards'>, hero: Hero): Card[] {
  const handCards = (hero.hand ?? []).map((id) => cardById(state, id)).filter((c): c is Card => !!c);
  if (hero.hasUltimate) {
    const ultId = Object.keys(state.runtimeCards).find(
      (id) => state.runtimeCards[id]!.el === hero.el && state.runtimeCards[id]!.isUltimate,
    );
    if (ultId) return [...handCards, state.runtimeCards[ultId]!];
  }
  return handCards;
}

/**
 * Mirrors Battle.pickTarget(): front row is protected and must be destroyed
 * before back row can be targeted, unless the card pierces. Taunting heroes
 * override everything — they force all incoming targeting onto themselves.
 */
export function validTargets(enemyTeam: Hero[], card: Card | null): Hero[] {
  const alive = enemyTeam.filter((h) => h.alive);
  const taunting = alive.filter((h) => (h.tauntRoundsLeft ?? 0) > 0);
  if (taunting.length > 0) return taunting;
  if (card?.effect?.pierce) return alive;
  const front = alive.filter((h) => h.row === 'front');
  return front.length > 0 ? front : alive;
}

export function heroHasAnyValidPlay(state: Pick<BattleState, 'runtimeCards' | 'energy' | 'soul'>, hero: Hero, enemies: Hero[]): boolean {
  const budget = state.energy + state.soul;
  const playable = cardsForHero(state, hero).filter((c) => c.cost <= budget);
  return playable.some((c) => c.kind === 'buff' || validTargets(enemies, c).length > 0);
}

export function pickAutoTarget(enemies: Hero[], card: Card): Hero | null {
  const pool = validTargets(enemies, card);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export const MAX_CASTS_PER_MAGE_PER_ROUND = DECK_CONFIG.maxCastsPerMagePerRound;
