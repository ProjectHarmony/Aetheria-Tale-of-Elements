import { AnimatePresence } from 'framer-motion';
import type { BattleState } from '@/types';
import { cardsForHero, heroById } from '@/systems/battle';
import { Card } from './Card';
import type { FilterKey } from './FilterChips';

interface HandZoneProps {
  battle: BattleState;
  filter: FilterKey;
  onSelectCard: (cardId: string) => void;
}

export function HandZone({ battle, filter, onSelectCard }: HandZoneProps) {
  if (battle.phase !== 'planning') {
    return <div className="w-full px-4 py-6 text-center text-[11px] font-semibold text-[#2c1f3d]/80">Resolving the round — scrolls are locked.</div>;
  }

  const hero = battle.planningHeroId ? heroById(battle, battle.planningHeroId) : undefined;
  if (!hero) {
    return <div className="w-full px-4 py-6 text-center text-[11px] font-semibold text-[#2c1f3d]/80">All mages have locked in their scrolls. Tap Attack to resolve the round.</div>;
  }

  const budget = hero.energy ?? 0;
  let cards = cardsForHero(battle, hero);
  if (filter !== 'all') cards = cards.filter((c) => c.type === filter);
  cards = cards.slice().sort((a, b) => (a.isUltimate ? 1 : 0) - (b.isUltimate ? 1 : 0) || a.cost - b.cost);

  return (
    <div className="flex min-h-[140px] items-center gap-2.5 overflow-x-auto px-3 py-4 lg:min-h-[190px] lg:justify-center lg:gap-4 lg:px-6" style={{ scrollSnapType: 'x proximity' }}>
      {cards.length === 0 && (
        <div className="w-full py-6 text-center text-[11px] font-semibold text-[#2c1f3d]/80">No scrolls match this filter.</div>
      )}
      {/* Keyed by hero+card, not just card id: skill ids are stable across
          rounds and hero switches, so a bare card.id key can collide between
          an outgoing AnimatePresence exit and an incoming enter (e.g. Ember's
          "Spark" reappearing next round while last round's node is still
          animating out). Scoping the key to planningHeroId keeps every
          instance unique for the animation layer's identity tracking. */}
      <AnimatePresence initial={false}>
        {cards.map((c) => (
          <Card
            key={`${battle.planningHeroId}-${c.id}`}
            card={c}
            affordable={budget >= c.cost}
            isSelected={battle.pendingCardId === c.id}
            onTap={() => onSelectCard(c.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
