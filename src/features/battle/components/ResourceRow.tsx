import { motion } from 'framer-motion';
import type { BattleState } from '@/types';

interface ResourceRowProps {
  battle: BattleState;
}

export function ResourceRow({ battle }: ResourceRowProps) {
  const pips = Array.from({ length: battle.maxEnergy }, (_, i) => i < battle.energy);
  const soulPct = (battle.soul / battle.maxSoul) * 100;

  return (
    <div className="relative z-10 mx-3 flex items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-[#100a1a]/82 px-3.5 py-1.5 shadow-lg">
      <span className="text-[8.5px] font-extrabold uppercase tracking-wide text-white/45">⚡ Energy</span>
      <div className="flex gap-[3px]">
        {pips.map((on, i) => (
          <motion.div
            key={i}
            className="h-2.5 w-2.5 rounded-[3px] border"
            animate={{
              background: on ? 'linear-gradient(135deg,#ffc85c,#ffe09a)' : 'rgba(255,255,255,0.08)',
              borderColor: on ? '#ffc85c' : 'rgba(255,200,80,0.16)',
              boxShadow: on ? '0 0 5px rgba(255,200,80,0.5)' : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-[9px] font-extrabold text-[#ffe09a]">{battle.energy}/{battle.maxEnergy}</span>

      <div className="mx-1 h-4 w-px bg-white/10" />

      <span className="ml-0.5 text-[8.5px]">🔮</span>
      <div className="relative h-[18px] w-[18px] overflow-hidden rounded-full border-[1.5px] border-[rgba(201,168,255,0.45)] bg-white/6">
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{ background: 'linear-gradient(180deg,var(--color-wind-glow),var(--color-wind))' }}
          animate={{ height: `${soulPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
