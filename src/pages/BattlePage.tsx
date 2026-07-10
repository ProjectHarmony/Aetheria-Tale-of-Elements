import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '@/stores/battleStore';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { BattleScreen } from '@/features/battle';
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
  const activeEncounter = useMapStore((s) => s.activeEncounter);
  const resolveEncounter = useMapStore((s) => s.resolveEncounter);
  const navigate = useNavigate();
  const xpGrantedRef = useRef(false);
  const xpRewardRef = useRef(60);
  const encounterResolvedRef = useRef(false);
  const [xpSummary, setXpSummary] = useState<string | undefined>(undefined);

  useEffect(() => {
    xpGrantedRef.current = false;
    encounterResolvedRef.current = false;
    setXpSummary(undefined);
    if (battleContext && party) {
      const { heroes: players, runtimeCards } = buildPlayerTeamFromParty(party);
      const level = avgPartyLevel(party);
      if (battleContext === 'adventure' && activeEncounter) {
        const { enemies, xpReward, dmgScale } = buildEncounterEnemyTeam(activeEncounter.names);
        xpRewardRef.current = xpReward;
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

  useEffect(() => {
    if (!won || battleContext !== 'adventure' || xpGrantedRef.current) return;
    xpGrantedRef.current = true;
    const xpAmount = xpRewardRef.current;
    const ups = grantXp(xpAmount);
    setXpSummary(`+${xpAmount} XP to each mage.` + (ups.length ? ` 🎉 Level up: ${ups.map((u) => `${u.el} → Lv ${u.level}`).join(', ')}` : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won, battleContext]);

  // Feeds the outcome back to the map: a win starts the defeated roamer's
  // respawn cooldown (or marks the MVP world-singleton dead); a loss leaves
  // it untouched so the fight can be retried immediately.
  useEffect(() => {
    if (!ended || battleContext !== 'adventure' || encounterResolvedRef.current) return;
    encounterResolvedRef.current = true;
    resolveEncounter(!!won);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, battleContext]);

  // A loss sends you back to the hub to regroup (heal up, respec, swap
  // formation) rather than dropping you right back on the map — walking
  // straight back into the same roamer that just beat you isn't a "continue
  // exploring" moment. A win keeps the original "stay in the field" flow.
  const adventureWon = battleContext === 'adventure' && won;
  const restartLabel =
    battleContext === 'pvp' ? '🏠 Return to Hub' : adventureWon ? '🗺️ Continue Exploring' : battleContext === 'adventure' ? '🏠 Return to Hub' : '🔄 New Battle';

  function handleRestart() {
    if (battleContext === 'pvp') navigate('/hub');
    else if (battleContext === 'adventure') navigate(adventureWon ? '/map' : '/hub');
    else startDemoBattle();
  }

  return (
    <ResponsiveShell>
      {battle && <BattleScreen restartLabel={restartLabel} xpSummary={xpSummary} onRestart={handleRestart} />}
    </ResponsiveShell>
  );
}
