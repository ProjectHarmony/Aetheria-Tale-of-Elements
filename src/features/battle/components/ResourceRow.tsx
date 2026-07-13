import { motion } from 'framer-motion';
import type { BattleState } from '@/types';
import { ELEMENT_META } from '@/constants';

interface ResourceRowProps {
  battle: BattleState;
}

/** One chip per living mage — energy is per-hero now, so there's no single
 *  team total left to show; each mage's own pool renders side by side. */
export function ResourceRow({ battle }: ResourceRowProps) {
  const heroes = battle.players.filter((h) => h.alive);

  return (
    <div className="relative z-10 mx-3 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#100a1a]/82 px-3.5 py-1.5 shadow-lg">
      {heroes.map((h) => {
        const max = h.maxEnergy ?? 0;
        const energy = h.energy ?? 0;
        const meta = ELEMENT_META[h.el];
        return (
          <div key={h.id} className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ filter: `drop-shadow(0 0 3px ${meta.color})` }}>{meta.icon}</span>
            <div className="flex gap-[2px]">
              {Array.from({ length: max }, (_, i) => i < energy).map((on, i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-[2px] border"
                  animate={{
                    background: on ? 'linear-gradient(135deg,#ffc85c,#ffe09a)' : 'rgba(255,255,255,0.08)',
                    borderColor: on ? '#ffc85c' : 'rgba(255,200,80,0.16)',
                    boxShadow: on ? '0 0 4px rgba(255,200,80,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[8.5px] font-extrabold text-[#ffe09a]">{energy}/{max}</span>
          </div>
        );
      })}
    </div>
  );
}
