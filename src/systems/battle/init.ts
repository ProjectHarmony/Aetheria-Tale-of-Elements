import type { BattleState, Card, Hero } from '@/types';
import { DECK_CONFIG, MAX_ENERGY, MAX_SOUL, STARTING_ENERGY } from '@/constants';
import { drawCards } from './deck';
import { getPlanningOrder } from './planning';

export function createInitialBattleState(players: Hero[], enemies: Hero[], runtimeCards: Record<string, Card>): BattleState {
  players.forEach((h) => drawCards(h, DECK_CONFIG.handSize));
  const fastest = getPlanningOrder({ players })[0];

  return {
    players,
    enemies,
    runtimeCards,
    energy: STARTING_ENERGY,
    maxEnergy: MAX_ENERGY,
    soul: 0,
    maxSoul: MAX_SOUL,
    round: 1,
    combo: 0,
    phase: 'planning',
    planningHeroId: fastest?.id ?? null,
    pendingCardId: null,
    plans: {},
    heroDone: {},
    planningTimeLeft: 30,
    enemyActionsRemaining: 0,
    log: 'Plan your scrolls.',
    winner: null,
    enemyDmgScale: 1,
  };
}
