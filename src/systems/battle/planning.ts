import type { BattleState, Hero } from '@/types';
import { SPEED } from '@/constants';

export function aliveHeroes(list: Hero[]): Hero[] {
  return list.filter((h) => h.alive);
}

export function heroById(state: Pick<BattleState, 'players' | 'enemies'>, id: string | null | undefined): Hero | undefined {
  if (!id) return undefined;
  return state.players.find((h) => h.id === id) ?? state.enemies.find((h) => h.id === id);
}

/** Touch-move enforcement: heroes must plan in speed order, fastest first. */
export function getPlanningOrder(state: Pick<BattleState, 'players'>): Hero[] {
  return aliveHeroes(state.players).slice().sort((a, b) => SPEED[b.el] - SPEED[a.el]);
}

/** The one hero currently allowed to act — fastest living hero not yet marked done. */
export function currentPlanningHero(state: Pick<BattleState, 'players' | 'heroDone'>): Hero | null {
  return getPlanningOrder(state).find((h) => !state.heroDone[h.id]) ?? null;
}

export function incomingAttackCount(state: Pick<BattleState, 'plans'>, enemyId: string): number {
  let n = 0;
  Object.values(state.plans).forEach((plan) => {
    if (Array.isArray(plan)) {
      plan.forEach((p) => { if (p.targetId === enemyId) n++; });
    }
  });
  return n;
}
