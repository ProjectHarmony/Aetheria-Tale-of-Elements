import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { ELEMENT_META, HERO_NAMES } from '@/constants';
import { derivedStatsFor } from '@/systems/battle';
import { MageSprite } from '@/components/ui/MageSprite';

interface PartyOverviewProps {
  onSelectMage: (el: string) => void;
  onFormation: () => void;
}

export function PartyOverview({ onSelectMage, onFormation }: PartyOverviewProps) {
  const party = useGameStore((s) => s.party);
  if (!party) return null;

  return (
    <div>
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Your mages — tap one to manage</div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {party.picks.map((el) => {
          const m = party.mages[el]!;
          const meta = ELEMENT_META[el];
          const d = derivedStatsFor(el, m);
          const points = m.statPoints + m.skillPoints;
          return (
            <motion.div
              key={el}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => onSelectMage(el)}
              className="relative flex aspect-[3/4.2] cursor-pointer flex-col items-center justify-end rounded-xl border-2 p-2 text-center"
              style={{ borderColor: meta.color, background: 'linear-gradient(180deg, rgba(60,44,84,0.7), rgba(20,12,30,0.9))', boxShadow: `0 0 14px -3px ${meta.color}` }}
            >
              <div className="absolute left-1.5 top-1.5 rounded-full bg-[var(--color-gold)] px-1.5 py-0.5 font-['Baloo_2'] text-[9px] font-extrabold text-[var(--color-gold-deep)]">Lv {m.level}</div>
              <div className="mb-auto mt-2 h-14 w-14"><MageSprite el={el} /></div>
              <div className="mt-1 font-['Baloo_2'] text-[10.5px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</div>
              <div className="text-[7.5px] text-white/60">HP {Math.round(d.maxHp)}</div>
              <div className={`mt-1.5 w-full rounded px-1 py-1 text-[7px] font-extrabold uppercase ${points > 0 ? 'bg-[#3a2f14]/90 text-[var(--color-gold)]' : 'bg-black/25 text-white/40'}`}>
                {points > 0 ? `✨ ${points} points ready` : 'Tap to manage'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Battle Setup</div>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onFormation}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-3.5"
      >
        <span className="text-2xl">🗺</span>
        <div className="flex-1">
          <div className="font-['Baloo_2'] text-[13px] font-extrabold text-[#fff8f0]">Formation</div>
          <div className="text-[9.5px] text-white/45">Front / Back battle placement</div>
        </div>
        <span className="text-xl text-white/30">›</span>
      </motion.div>
    </div>
  );
}
