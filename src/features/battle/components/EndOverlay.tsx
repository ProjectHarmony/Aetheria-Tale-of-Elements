import { motion } from 'framer-motion';
import type { BattleState } from '@/types';

interface EndOverlayProps {
  battle: BattleState;
  restartLabel: string;
  xpSummary?: string;
  onRestart: () => void;
}

export function EndOverlay({ battle, restartLabel, xpSummary, onRestart }: EndOverlayProps) {
  if (battle.phase !== 'ended') return null;
  const won = battle.winner === 'players';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#08050f]/92 px-8 text-center backdrop-blur-md"
    >
      <div className="mb-2.5 text-[54px]">{won ? '🏆' : '💀'}</div>
      <div className="mb-1.5 font-['Baloo_2'] text-[26px] font-extrabold text-white">{won ? 'Victory!' : 'Defeat'}</div>
      <div className="mb-6 text-xs text-white/55">
        {won ? `Your mages prevailed after ${battle.round} rounds.` : `Your team was defeated after ${battle.round} rounds.`}
        {won && xpSummary && <span className="mt-1 block text-[var(--color-gold)]">{xpSummary}</span>}
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onRestart}
        className="rounded-[13px] px-7 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] shadow-[0_8px_20px_rgba(255,217,142,0.35)]"
        style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
      >
        {restartLabel}
      </motion.button>
    </motion.div>
  );
}
