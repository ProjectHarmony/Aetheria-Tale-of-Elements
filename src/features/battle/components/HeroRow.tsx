import { forwardRef } from 'react';
import type { BattleState, Hero } from '@/types';
import type { TimedBattleEvent } from '@/stores/battleStore';
import { cardById, getPlanningOrder, incomingAttackCount } from '@/systems/battle';
import { HeroCard } from './HeroCard';

interface HeroRowProps {
  battle: BattleState;
  team: Hero[];
  side: 'player' | 'enemy';
  events: TimedBattleEvent[];
  onTapHero: (heroId: string) => void;
  onUndo: (heroId: string) => void;
  scale: number;
}

// A real triangle needs the odd-one-out role centered between the paired
// role, not just stacked in role order — a 1-front/2-back column reads as
// [back, front, back] (the lone front sits centered, pushed toward the
// enemy, with both backs spread above/below it and pulled rearward), and
// a 2-front/1-back column mirrors that with the lone back as the rear tip.
// Combined with HeroCard's own front/back depth offset, this is what
// actually produces the wedge/triangle shape instead of a straight column.
function orderTriangle(team: Hero[]): Hero[] {
  const fronts = team.filter((h) => h.row === 'front');
  const backs = team.filter((h) => h.row === 'back');
  if (fronts.length === 1 && backs.length === 2) return [backs[0]!, fronts[0]!, backs[1]!].filter(Boolean);
  if (backs.length === 1 && fronts.length === 2) return [fronts[0]!, backs[0]!, fronts[1]!].filter(Boolean);
  return [...backs, ...fronts];
}

export const HeroRow = forwardRef<HTMLDivElement, HeroRowProps>(function HeroRow({ battle, team, side, events, onTapHero, onUndo, scale }, ref) {
  const ordered = orderTriangle(team);
  const planningOrder = side === 'player' ? getPlanningOrder(battle) : [];
  const disabled = battle.phase !== 'planning';

  return (
    <div
      ref={ref}
      className={`relative z-[6] flex flex-col items-center justify-center gap-0.5 py-0.5 lg:gap-1.5 ${side === 'player' ? 'pl-2 lg:pl-8' : 'pr-2 lg:pr-8'}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
      {ordered.map((hero) => {
        let planLabel: string | null = null;
        let isPass = false;
        let orderRank: number | null = null;
        let canUndo = false;

        if (side === 'player') {
          const plan = battle.plans[hero.id];
          const isDone = !!battle.heroDone[hero.id];
          canUndo = battle.phase === 'planning' && hero.alive;
          if (isDone && (!Array.isArray(plan) || plan.length === 0)) {
            isPass = true;
          } else if (Array.isArray(plan) && plan.length > 0) {
            const lastCard = cardById(battle, plan[plan.length - 1]!.cardId);
            planLabel = lastCard ? `${lastCard.name}${plan.length > 1 ? ` ×${plan.length}` : ''}` : null;
          } else if (battle.phase === 'planning' && hero.alive) {
            orderRank = planningOrder.findIndex((o) => o.id === hero.id) + 1;
          }
        }

        return (
          <HeroCard
            key={hero.id}
            hero={hero}
            side={side}
            isSelected={battle.phase === 'planning' && battle.planningHeroId === hero.id}
            planLabel={planLabel}
            isPass={isPass}
            orderRank={orderRank}
            incomingCount={side === 'enemy' && battle.phase === 'planning' ? incomingAttackCount(battle, hero.id) : 0}
            events={events}
            onTap={() => onTapHero(hero.id)}
            onUndo={() => onUndo(hero.id)}
            canUndo={canUndo}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
});
