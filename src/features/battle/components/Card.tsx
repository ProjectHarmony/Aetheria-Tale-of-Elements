import { motion } from 'framer-motion';
import type { Card as CardData } from '@/types';
import { ELEMENT_META } from '@/constants';

interface CardProps {
  card: CardData;
  affordable: boolean;
  isSelected: boolean;
  onTap: () => void;
}

export function Card({ card, affordable, isSelected, onTap }: CardProps) {
  const meta = ELEMENT_META[card.el];

  return (
    <motion.div
      // No enter/exit transition on purpose — switching to the next mage
      // (or the hand reshuffling after a multi-cast) should show that
      // mage's cards instantly, not slide/fade them in. `initial={false}`
      // skips only the entry animation; the isSelected/affordable `animate`
      // below still transitions live so picking/un-picking a card in place
      // keeps its highlight animation.
      initial={false}
      animate={{ opacity: affordable ? 1 : 0.35, y: isSelected ? -14 : 0, scale: isSelected ? 1.08 : 1 }}
      whileHover={affordable ? { scale: isSelected ? 1.08 : 1.04, y: isSelected ? -14 : -6 } : undefined}
      whileTap={affordable ? { scale: 0.95, y: -10 } : undefined}
      onClick={() => { if (affordable) onTap(); }}
      className={`relative flex h-[124px] w-[76px] flex-shrink-0 flex-col rounded-xl border-[1.5px] border-t-[3px] p-2 shadow-[0_6px_14px_rgba(0,0,0,0.3)] lg:h-[168px] lg:w-[102px] lg:p-3 ${affordable ? 'cursor-pointer' : 'pointer-events-none'} ${card.isUltimate ? 'shimmer-border' : ''} ${isSelected ? 'border-[var(--color-gold)]' : 'border-white/10'}`}
      style={{
        background: card.isUltimate ? 'linear-gradient(180deg,rgba(74,47,31,0.94),rgba(44,31,61,0.94))' : 'linear-gradient(180deg,rgba(58,44,84,0.94),rgba(44,31,61,0.94))',
        borderTopColor: card.isUltimate ? 'var(--color-gold)' : meta.color,
        boxShadow: isSelected
          ? '0 0 0 2.5px var(--color-gold), 0 8px 20px -2px rgba(255,200,80,0.55)'
          : card.isUltimate ? '0 6px 14px rgba(0,0,0,0.25), 0 0 16px -4px var(--color-gold)' : undefined,
      }}
    >
      {isSelected && (
        <div className="absolute -left-1.5 -top-1.5 z-10 flex h-[19px] w-[19px] items-center justify-center rounded-full border-[1.5px] border-[var(--color-ink)] bg-[var(--color-gold)] text-[10px] font-extrabold text-[var(--color-gold-deep)] lg:h-6 lg:w-6 lg:text-xs">
          ✓
        </div>
      )}
      <div className="absolute -right-1.5 -top-1.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-[1.5px] border-[var(--color-ink)] text-[9.5px] font-extrabold text-[var(--color-gold-deep)] lg:h-6 lg:w-6 lg:text-xs" style={{ background: 'radial-gradient(circle,#ffe9c2,var(--color-gold))' }}>
        {card.cost}
      </div>
      <div className={`flex-shrink-0 text-[6.5px] font-bold uppercase tracking-wide lg:text-[8px] ${card.isUltimate ? 'text-[var(--color-gold)]' : 'text-white/45'}`}>
        {card.isUltimate ? '✦ Ultimate' : card.type}
      </div>
      <div className="mt-0.5 line-clamp-2 h-[24.4px] flex-shrink-0 font-['Baloo_2'] text-[10px] font-bold leading-[1.22] text-[#fff8f0] lg:h-8 lg:text-[13px]">
        {card.name}
      </div>
      <div className="mt-1 flex-shrink-0 text-[8px] font-extrabold text-white/55 lg:text-[10px]">{card.stat}</div>
      <div className="mt-1 line-clamp-3 flex-1 text-[7px] leading-[1.32] text-white/40 lg:text-[9px]">{card.desc}</div>
    </motion.div>
  );
}
