import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Element } from '@/types';
import { useBattleStore } from '@/stores/battleStore';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { BattleScreen, type VictorySummary } from '@/features/battle';
import { ResponsiveShell } from '@/layouts/ResponsiveShell';
import { buildEncounterEnemyTeam, buildPlayerTeamFromParty, buildRandomEnemyTeam } from '@/systems/battle';
import { avgPartyLevel } from '@/systems/party';

export function BattlePage() {
  const battle = useBattleStore((s) => s.battle);
  const startBattle = useBattleStore((s) => s.startBattle);
  const startDemoBattle = useBattleStore((s) => s.startDemoBattle);
  const battleContext = useGameStore((s) => s.battleContext);
  const party = useGameStore((s) => s.party);
  const grantXp = useGameStore((s) => s.grantXp);
  const addAeons = useGameStore((s) => s.addAeons);
  const addItem = useGameStore((s) => s.addItem);
  const syncPartyHp = useGameStore((s) => s.syncPartyHp);
  const activeEncounter = useMapStore((s) => s.activeEncounter);
  const resolveEncounter = useMapStore((s) => s.resolveEncounter);
  const warpToHub = useMapStore((s) => s.warpToHub);
  const navigate = useNavigate();
  const xpGrantedRef = useRef(false);
  const xpRewardRef = useRef(60);
  const aeonsRewardRef = useRef(8);
  const lootDropsRef = useRef<Record<string, number>>({});
  const encounterResolvedRef = useRef(false);
  const hpSyncedRef = useRef(false);
  const [summary, setSummary] = useState<VictorySummary | undefined>(undefined);

  useEffect(() => {
    xpGrantedRef.current = false;
    encounterResolvedRef.current = false;
    hpSyncedRef.current = false;
    setSummary(undefined);
    if (battleContext && party) {
      const { heroes: players, runtimeCards } = buildPlayerTeamFromParty(party);
      const level = avgPartyLevel(party);
      if (battleContext === 'adventure' && activeEncounter) {
        const { enemies, xpReward, aeonsReward, lootDrops, dmgScale } = buildEncounterEnemyTeam(activeEncounter.names, level);
        xpRewardRef.current = xpReward;
        aeonsRewardRef.current = aeonsReward;
        lootDropsRef.current = lootDrops;
        startBattle(players, enemies, runtimeCards, dmgScale);
      } else {
        const enemies = buildRandomEnemyTeam(level);
        startBattle(players, enemies, runtimeCards, 1 + 0.05 * (level - 1));
      }
    } else {
      startDemoBattle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const won = battle?.phase === 'ended' && battle.winner === 'players';
  const ended = battle?.phase === 'ended';
  // A mutual KO (the last enemy dies the same round as your own last mage)
  // still credits `winner: 'players'` (see resolve.ts's endRound), but with
  // every player Hero at 0 HP that's not a "stay in the field, keep your
  // banged-up HP" win in any real sense — it's a wipe that happens to also
  // kill the last enemy. Treat it exactly like a loss for HP/hub purposes
  // (mercy-revive to 1, warp to Crown Haven) while still crediting the
  // win's loot/XP/respawn-timer below, since the kill genuinely happened.
  const partyWiped = !!battle && ended && battle.players.every((h) => !h.alive);

  // Pokemon-style HP: persists whatever each mage ended the fight with
  // (including 0, if they got knocked out but the party still won) instead
  // of auto-healing back to full for the next encounter. A full party wipe
  // is the one exception — everyone wakes up at the hub with a mercy 1 HP
  // rather than staying at 0 (see mapStore.resolveEncounter for the actual
  // hub-return/position reset this pairs with).
  //
  // This MUST run before the XP-grant effect below: grantXp can level a
  // mage up mid-battle-end and gives them a fresh full heal at their NEW
  // max HP (see progression.ts) — if this effect ran second, it would
  // immediately overwrite that full heal with the stale battle-end HP
  // value (computed against the OLD, lower max), silently undoing the
  // level-up heal and leaving HP looking inconsistent from fight to fight.
  useEffect(() => {
    if (!ended || battleContext !== 'adventure' || !battle || hpSyncedRef.current) return;
    hpSyncedRef.current = true;
    if (won && !partyWiped) {
      const hpByEl: Partial<Record<Element, number>> = {};
      battle.players.forEach((h) => { hpByEl[h.el] = h.hp; });
      syncPartyHp(hpByEl);
    } else if (party) {
      const hpByEl: Partial<Record<Element, number>> = {};
      party.picks.forEach((el) => { hpByEl[el] = 1; });
      syncPartyHp(hpByEl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, battleContext]);

  useEffect(() => {
    if (!won || battleContext !== 'adventure' || xpGrantedRef.current) return;
    xpGrantedRef.current = true;
    const xpAmount = xpRewardRef.current;
    const aeonsAmount = aeonsRewardRef.current;
    const ups = grantXp(xpAmount);
    addAeons(aeonsAmount);
    const lootEntries = Object.entries(lootDropsRef.current);
    lootEntries.forEach(([itemId, qty]) => addItem(itemId, qty));
    setSummary({
      xp: xpAmount,
      aeons: aeonsAmount,
      loot: lootEntries.map(([itemId, qty]) => ({ itemId, qty })),
      levelUps: ups,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won, battleContext]);

  // Feeds the outcome back to the map: a win starts the defeated roamer's
  // respawn cooldown (or marks the MVP world-singleton dead); a loss leaves
  // it untouched so the fight can be retried immediately. `resolveEncounter`
  // itself only warps to the hub on its own `!won` branch, so a mutual-KO
  // wipe (won === true, but partyWiped) needs that warp forced explicitly —
  // otherwise a "win" that killed your whole party would leave you stranded
  // wherever you fell instead of sent back to regroup.
  useEffect(() => {
    if (!ended || battleContext !== 'adventure' || encounterResolvedRef.current) return;
    encounterResolvedRef.current = true;
    resolveEncounter(!!won);
    if (partyWiped) warpToHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, battleContext]);

  // A loss (or a mutual-KO wipe) sends you back to the hub to regroup (heal
  // up, respec, swap formation) rather than dropping you right back on the
  // map — walking straight back into the same roamer that just beat you
  // isn't a "continue exploring" moment. A clean win keeps the original
  // "stay in the field" flow.
  const adventureWon = battleContext === 'adventure' && won && !partyWiped;
  const restartLabel =
    battleContext === 'pvp' ? '🏠 Return to Hub' : adventureWon ? '🗺️ Continue Exploring' : battleContext === 'adventure' ? '🏠 Return to Hub' : '🔄 New Battle';

  function handleRestart() {
    if (battleContext === 'pvp') navigate('/hub');
    else if (battleContext === 'adventure') navigate(adventureWon ? '/map' : '/hub');
    else startDemoBattle();
  }

  return (
    <ResponsiveShell>
      {battle && <BattleScreen restartLabel={restartLabel} summary={summary} onRestart={handleRestart} />}
    </ResponsiveShell>
  );
}
