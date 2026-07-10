import type { BattleState } from '@/types';
import { aliveHeroes } from '@/systems/battle';

interface EnemyIntelStripProps {
  battle: BattleState;
}

export function EnemyIntelStrip({ battle }: EnemyIntelStripProps) {
  const text =
    battle.phase === 'planning'
      ? (() => {
          const n = aliveHeroes(battle.enemies).length;
          return `${n} scroll${n === 1 ? '' : 's'} queued`;
        })()
      : battle.enemyActionsRemaining > 0
        ? `${battle.enemyActionsRemaining} left to reveal`
        : 'All revealed';

  return (
    <div className="relative z-20 flex justify-center pb-1 pt-0.5">
      <div className="flex items-center gap-1.5 rounded-full border border-white/13 bg-[#140e20]/78 px-3 py-1 text-[10px] font-bold text-white/60">
        <span className="text-white/45">🂠</span>
        {text}
      </div>
    </div>
  );
}
