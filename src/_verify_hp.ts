// @ts-nocheck
// Polyfill localStorage for zustand persist middleware running under plain Node via tsx.
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
};

import { useGameStore } from './stores/gameStore';
import { buildPlayerTeamFromParty, buildRandomEnemyTeam } from './systems/battle/team';
import { createInitialBattleState } from './systems/battle/init';
import { commitPlannedCast } from './systems/battle/actions';
import { resolveRound } from './systems/battle/resolve';
import type { Element, Hero } from './types';

const gs = useGameStore.getState();
gs.register('tester', 'pw');
gs.createParty(['fire', 'water', 'earth'], {}, '2f1b');

function dumpHp(label: string) {
  const party = useGameStore.getState().party!;
  const out: Record<string, unknown> = {};
  party.picks.forEach((el) => { out[el] = party.mages[el]!.currentHp; });
  console.log(label, JSON.stringify(out));
}

async function runOneBattle(battleNum: number) {
  const party = useGameStore.getState().party!;
  const { heroes: players, runtimeCards } = buildPlayerTeamFromParty(party);
  const enemies = buildRandomEnemyTeam(1);
  const state = createInitialBattleState(players, enemies, runtimeCards);

  // Very dumb "AI": every alive player hero casts its first playable hand card at a random enemy each round.
  let guard = 0;
  while (state.phase !== 'ended' && guard < 200) {
    guard++;
    if (state.phase === 'planning') {
      for (const h of state.players) {
        if (!h.alive) continue;
        const cardId = h.hand?.[0];
        const target = state.enemies.find((e) => e.alive);
        if (cardId && target) commitPlannedCast(state, h.id, cardId, target.id);
      }
      const gen = resolveRound(state);
      for await (const _ of gen) { /* drain */ }
    }
  }

  const won = state.winner === 'players';

  // Replicate BattlePage's exact effect order: hpSync THEN xpGrant.
  const hpByEl: Partial<Record<Element, number>> = {};
  if (won) {
    state.players.forEach((h) => { hpByEl[h.el] = h.hp; });
  } else {
    party.picks.forEach((el) => { hpByEl[el] = 1; });
  }
  useGameStore.getState().syncPartyHp(hpByEl);

  if (won) {
    useGameStore.getState().grantXp(60);
  }

  console.log(`Battle ${battleNum}: winner=${state.winner}`, 'battle-end hp:', state.players.map((h) => `${h.el}=${h.hp}/${h.maxHp}`).join(', '));
  dumpHp(`  after battle ${battleNum} sync ->`);

  // Sanity: currentHp must never exceed maxHp for the mage's CURRENT gear/level.
  const partyAfter = useGameStore.getState().party!;
  for (const el of partyAfter.picks) {
    const mage = partyAfter.mages[el]!;
    const d = buildPlayerTeamFromParty(partyAfter).heroes.find((h) => h.el === el)!;
    if ((mage.currentHp ?? 0) > d.maxHp) {
      throw new Error(`FAIL: ${el} currentHp ${mage.currentHp} exceeds maxHp ${d.maxHp} after battle ${battleNum}`);
    }
    if ((mage.currentHp ?? 0) < 0) throw new Error(`FAIL: ${el} currentHp negative after battle ${battleNum}`);
  }
}

async function main() {
  for (let i = 1; i <= 8; i++) {
    await runOneBattle(i);
  }
  console.log('ALL BATTLES COMPLETED, NO INVARIANT VIOLATIONS DETECTED');
}

main();
