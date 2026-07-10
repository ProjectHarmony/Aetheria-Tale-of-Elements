import { motion } from 'framer-motion';
import type { BattleState } from '@/types';

interface TopBarProps {
  battle: BattleState;
  onOpenHelp: () => void;
}

export function TopBar({ battle, onOpenHelp }: TopBarProps) {
  const phaseLabel = battle.phase === 'planning' ? 'Plan your scrolls' : battle.phase === 'resolving' ? 'Resolving round' : 'Battle over';
  const urgent = battle.phase === 'planning' && battle.planningTimeLeft <= 10;

  return (
    <div className="relative z-20 flex items-center justify-between px-3.5 pb-1 pt-4">
      <motion.button
        onClick={onOpenHelp}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white/40 text-[16px] shadow-[0_4px_12px_rgba(255,200,80,0.4)]"
        style={{ background: 'linear-gradient(150deg, var(--color-gold), var(--color-fire))' }}
      >
        💡
      </motion.button>

      <div className="flex items-center gap-1.5 rounded-full border border-white/14 bg-[#140e20]/75 px-4 py-1.5">
        <span className="font-['Baloo_2'] text-xs font-extrabold text-[#f5f1ff]">⚔ Round {battle.round}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {battle.phase === 'planning' && (
          <motion.div
            key={urgent ? 'urgent' : 'normal'}
            animate={urgent ? { opacity: [1, 0.55, 1], scale: [1, 1.06, 1] } : { opacity: 1, scale: 1 }}
            transition={urgent ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : {}}
            className={`rounded-full border-2 px-3 py-1.5 font-['Baloo_2'] text-[15px] font-extrabold shadow-[0_3px_10px_rgba(0,0,0,0.25)] ${
              urgent ? 'border-[rgba(255,84,112,0.7)] bg-[rgba(255,84,112,0.28)] text-white' : 'border-white/30 bg-white/16 text-[#f5f1ff]'
            }`}
          >
            ⏱ {Math.max(0, battle.planningTimeLeft)}s
          </motion.div>
        )}
        <div className="rounded-full border border-white/14 bg-[#140e20]/75 px-3 py-1 text-[10px] font-bold text-white/60">{phaseLabel}</div>
      </div>
    </div>
  );
}
