import type { BattleState } from '@/types';
import { DECK_CONFIG, SPEED } from '@/constants';
import { aliveHeroes, cardById, heroById } from '@/systems/battle';

interface PlanPromptProps {
  battle: BattleState;
}

export function PlanPrompt({ battle }: PlanPromptProps) {
  if (battle.phase !== 'planning') return null;

  const alive = aliveHeroes(battle.players);
  const current = battle.planningHeroId ? heroById(battle, battle.planningHeroId) : undefined;
  const plan = current ? battle.plans[current.id] : undefined;
  const castCount = Array.isArray(plan) ? plan.length : 0;
  const stagedCard = battle.pendingCardId ? cardById(battle, battle.pendingCardId) : undefined;

  const text = stagedCard
    ? `${stagedCard.name} selected — tap Confirm to cast, or pick another scroll`
    : current
      ? `${current.name} acts next (SPD ${SPEED[current.el]}) — ${castCount}/${DECK_CONFIG.maxCastsPerMagePerRound} scrolls cast`
      : 'All mages locked in — confirm Attack';

  const deckStatus = current ? `📚 ${current.deck?.length ?? 0} in deck · 🗑 ${current.discard?.length ?? 0} discarded` : '';

  return (
    <div className="relative z-10 mx-3 mt-1.5">
      <div className="flex items-center justify-between gap-2 rounded-[9px] border border-[rgba(255,200,80,0.3)] bg-[rgba(255,200,80,0.1)] px-2.5 py-1.5">
        <div className="min-w-0 truncate text-[10px] font-bold text-[var(--color-gold)]">{text}</div>
        <div className="flex flex-shrink-0 gap-1">
          {alive.map((h) => (
            <div key={h.id} className={`h-1.5 w-3.5 rounded-sm ${battle.heroDone[h.id] ? 'bg-[var(--color-gold)]' : 'bg-white/12'}`} />
          ))}
        </div>
      </div>
      {deckStatus && (
        <div className="mt-1 inline-block rounded-full bg-[#100a1a]/70 px-2 py-0.5 text-[8.5px] font-semibold text-white/80">{deckStatus}</div>
      )}
    </div>
  );
}
