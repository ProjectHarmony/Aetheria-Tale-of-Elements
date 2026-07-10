import type { Card } from './skill';
import type { Hero } from './hero';

export type BattlePhase = 'planning' | 'resolving' | 'ended';

/** One queued player cast: a card played against a resolved target. */
export interface PlayerCast {
  cardId: string;
  targetId: string;
  fromEnergy: number;
  fromSoul: number;
}

/** The enemy AI's single hidden action for the round, revealed at resolution.
 *  Carries the fully-resolved Card it picked from the monster's own
 *  `moveset` (see Hero.moveset) — damage/effects then resolve through the
 *  exact same pipeline as a player cast. */
export interface EnemyPlan {
  isEnemy: true;
  targetId: string;
  card: Card;
}

export type PlanMap = Record<string, PlayerCast[] | EnemyPlan | undefined>;

export interface BattleState {
  players: Hero[];
  enemies: Hero[];
  /** Per-battle, rank-aware skill->card instances for the player's team. */
  runtimeCards: Record<string, Card>;

  energy: number;
  maxEnergy: number;
  soul: number;
  maxSoul: number;

  round: number;
  combo: number;
  phase: BattlePhase;

  planningHeroId: string | null;
  pendingCardId: string | null;
  plans: PlanMap;
  heroDone: Record<string, boolean>;

  planningTimeLeft: number;
  enemyActionsRemaining: number;

  log: string;
  winner: 'players' | 'enemies' | null;
  enemyDmgScale: number;
}

/**
 * Resolution is decoupled from rendering: `resolveRound` (systems/battle)
 * yields a stream of these events instead of touching the DOM directly.
 * The UI layer (features/battle/hooks/useBattleResolution) consumes the
 * stream and drives Framer Motion animations + floating combat text off it.
 */
export type BattleEvent =
  | { type: 'actingStart'; actorId: string }
  | { type: 'actingEnd'; actorId: string }
  | { type: 'cast'; actorId: string; targetId: string; cardName: string; cardDesc: string; isBuff: boolean }
  | { type: 'buffApplied'; targetId: string; statusKind: string; amount?: number }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'block'; targetId: string; amount: number }
  | { type: 'autoTarget'; targetId: string }
  | { type: 'miss'; targetId: string }
  | { type: 'dodge'; targetId: string }
  | {
      type: 'hit';
      actorId: string;
      targetId: string;
      amount: number;
      absorbed: number;
      reflected: number;
      isCrit: boolean;
      matchup: 'favored' | 'neutral' | 'resisted';
    }
  | { type: 'death'; targetId: string }
  | { type: 'combo'; comboValue: number; energyGranted: boolean }
  | { type: 'log'; message: string }
  | { type: 'roundEnd' }
  | { type: 'battleEnd'; winner: 'players' | 'enemies' };
