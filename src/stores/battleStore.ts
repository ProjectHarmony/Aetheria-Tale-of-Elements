import { create } from 'zustand';
import type { BattleEvent, BattleState, Card, Hero } from '@/types';
import { PLANNING_TIME_SECONDS } from '@/constants';
import {
  assignPass,
  buildPlayerTeamFromParty,
  buildRandomEnemyTeam,
  cardById,
  cardsForHero,
  commitPlannedCast,
  createDemoParty,
  createInitialBattleState,
  heroById,
  pickAutoTarget,
  resolveRound,
  selectHeroForPlanning,
  syncPlanningHero,
  undoLastCast,
} from '@/systems/battle';

const MAX_BUFFERED_EVENTS = 40;

export interface TimedBattleEvent extends Record<string, unknown> {
  id: number;
  event: BattleEvent;
}

interface BattleStore {
  battle: BattleState | null;
  events: TimedBattleEvent[];
  isResolving: boolean;

  startDemoBattle: () => void;
  startBattle: (players: Hero[], enemies: Hero[], runtimeCards: Record<string, Card>, enemyDmgScale?: number) => void;
  selectHero: (heroId: string) => void;
  playCard: (cardId: string) => void;
  pass: () => void;
  attack: () => void;
  undo: (heroId: string) => void;
}

let eventSeq = 0;
let planningTimerHandle: ReturnType<typeof setInterval> | null = null;

export const useBattleStore = create<BattleStore>((set, get) => {
  /** Re-publishes the (in-place-mutated) battle draft as a new top-level
   *  reference so subscribers re-render, and records an event for the FX layer. */
  function publish(battle: BattleState, event?: BattleEvent) {
    set((s) => ({
      battle: { ...battle },
      events: event ? [...s.events, { id: ++eventSeq, event }].slice(-MAX_BUFFERED_EVENTS) : s.events,
    }));
  }

  function stopPlanningTimer() {
    if (planningTimerHandle) {
      clearInterval(planningTimerHandle);
      planningTimerHandle = null;
    }
  }

  function startPlanningTimer() {
    stopPlanningTimer();
    const battle = get().battle;
    if (!battle) return;
    battle.planningTimeLeft = PLANNING_TIME_SECONDS;
    publish(battle);
    planningTimerHandle = setInterval(() => {
      const b = get().battle;
      if (!b || b.phase !== 'planning') { stopPlanningTimer(); return; }
      b.planningTimeLeft -= 1;
      publish(b);
      if (b.planningTimeLeft <= 0) {
        stopPlanningTimer();
        autoResolvePlanningTimeout();
      }
    }, 1000);
  }

  /** Shared by the Attack button and the timeout: runs one round of
   *  resolution, then restarts the planning timer if the battle continues. */
  async function runResolution(battle: BattleState) {
    stopPlanningTimer();
    set({ isResolving: true });
    for await (const event of resolveRound(battle)) {
      if (event.type === 'log') battle.log = event.message;
      publish(battle, event);
    }
    set({ isResolving: false });
    if (battle.phase === 'planning') startPlanningTimer();
  }

  function autoResolvePlanningTimeout() {
    const battle = get().battle;
    if (!battle || battle.phase !== 'planning') return;
    battle.players.filter((h) => h.alive).forEach((h) => { battle.heroDone[h.id] = true; });
    battle.planningHeroId = null;
    publish(battle);
    void runResolution(battle);
  }

  return {
    battle: null,
    events: [],
    isResolving: false,

    startDemoBattle: () => {
      const party = createDemoParty();
      const { heroes: players, runtimeCards } = buildPlayerTeamFromParty(party);
      const enemies = buildRandomEnemyTeam(1);
      const battle = createInitialBattleState(players, enemies, runtimeCards);
      set({ battle, events: [], isResolving: false });
      startPlanningTimer();
    },

    startBattle: (players, enemies, runtimeCards, enemyDmgScale = 1) => {
      const battle = createInitialBattleState(players, enemies, runtimeCards);
      battle.enemyDmgScale = enemyDmgScale;
      set({ battle, events: [], isResolving: false });
      startPlanningTimer();
    },

    selectHero: (heroId) => {
      const battle = get().battle;
      if (!battle) return;
      selectHeroForPlanning(battle, heroId);
      publish(battle);
    },

    playCard: (cardId) => {
      const battle = get().battle;
      if (!battle || battle.phase !== 'planning' || !battle.planningHeroId) return;
      const hero = heroById(battle, battle.planningHeroId);
      const card = cardById(battle, cardId);
      if (!hero || !card) return;
      // Reject a stale/duplicate play for a card this hero can no longer
      // actually cast (already played, no longer affordable, wrong hero) —
      // a UI event firing twice for the same card must not double-spend.
      const stillPlayable = cardsForHero(battle, hero).some((c) => c.id === cardId);
      if (!stillPlayable || card.cost > battle.energy + battle.soul) return;

      if (card.kind === 'buff') {
        commitPlannedCast(battle, hero.id, card.id, hero.id);
        syncPlanningHero(battle);
        publish(battle);
        return;
      }

      const target = pickAutoTarget(battle.enemies, card);
      if (!target) return;
      commitPlannedCast(battle, hero.id, card.id, target.id);
      syncPlanningHero(battle);
      publish(battle, { type: 'autoTarget', targetId: target.id });
    },

    pass: () => {
      const battle = get().battle;
      if (!battle || battle.phase !== 'planning' || !battle.planningHeroId || battle.pendingCardId) return;
      assignPass(battle, battle.planningHeroId);
      publish(battle);
    },

    undo: (heroId) => {
      const battle = get().battle;
      if (!battle) return;
      undoLastCast(battle, heroId);
      publish(battle);
    },

    attack: async () => {
      const battle = get().battle;
      if (!battle || battle.phase !== 'planning') return;
      const alivePlayers = battle.players.filter((h) => h.alive);
      if (!alivePlayers.every((h) => battle.heroDone[h.id])) return;
      await runResolution(battle);
    },
  };
});
