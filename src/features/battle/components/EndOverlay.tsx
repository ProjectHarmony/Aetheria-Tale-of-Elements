import { motion } from 'framer-motion';
import type { BattleState, Element } from '@/types';
import { ELEMENT_META, HERO_NAMES, ITEMS_BY_ID } from '@/constants';

export interface VictoryLevelUp {
  el: Element;
  level: number;
}

export interface VictoryLoot {
  itemId: string;
  qty: number;
}

export interface VictorySummary {
  xp: number;
  loot: VictoryLoot[];
  levelUps: VictoryLevelUp[];
}

interface EndOverlayProps {
  battle: BattleState;
  restartLabel: string;
  summary?: VictorySummary;
  onRestart: () => void;
}

const pop = (i: number) => ({
  initial: { opacity: 0, scale: 0.85, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { delay: 0.15 + i * 0.06, type: 'spring' as const, stiffness: 340, damping: 22 },
});

export function EndOverlay({ battle, restartLabel, summary, onRestart }: EndOverlayProps) {
  if (battle.phase !== 'ended') return null;
  const won = battle.winner === 'players';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-[#08050f]/92 px-6 py-8 text-center backdrop-blur-md"
    >
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="text-[52px]">
        {won ? '🏆' : '💀'}
      </motion.div>
      <div className="mt-1 font-['Baloo_2'] text-[26px] font-extrabold text-white">{won ? 'Victory!' : 'Defeat'}</div>
      <div className="mt-1 text-xs text-white/55">
        {won ? `Your mages prevailed after ${battle.round} rounds.` : `Your team was defeated after ${battle.round} rounds.`}
      </div>

      {won && summary && (
        <div className="mt-5 w-full max-w-[360px]">
          <motion.div {...pop(0)} className="flex gap-2">
            <div className="flex-1 rounded-2xl border border-[var(--color-gold)]/30 bg-white/5 py-2.5">
              <div className="font-['Baloo_2'] text-[18px] font-extrabold text-[var(--color-gold)]">+{summary.xp}</div>
              <div className="text-[9px] font-bold uppercase tracking-wide text-white/50">XP each mage</div>
            </div>
          </motion.div>

          {summary.loot.length > 0 && (
            <motion.div {...pop(1)} className="mt-2.5 rounded-2xl border border-white/12 bg-white/5 p-2.5">
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-white/45">🎁 Loot</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {summary.loot.map(({ itemId, qty }) => {
                  const def = ITEMS_BY_ID[itemId];
                  return (
                    <div key={itemId} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/25 py-1 pl-1.5 pr-2.5">
                      <span className="text-[15px]">{def?.icon ?? '❔'}</span>
                      <span className="text-[10.5px] font-bold text-white/85">
                        {def?.name ?? itemId}
                        {qty > 1 ? ` ×${qty}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {summary.levelUps.length > 0 && (
            <motion.div
              {...pop(2)}
              className="mt-2.5 rounded-2xl border-[1.5px] border-[var(--color-gold)]/50 p-2.5"
              style={{ background: 'linear-gradient(135deg, rgba(255,217,142,0.16), rgba(255,140,90,0.1))' }}
            >
              <div className="mb-1.5 font-['Baloo_2'] text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-gold)]">🎉 Level Up!</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {summary.levelUps.map((up, i) => {
                  const meta = ELEMENT_META[up.el];
                  return (
                    <motion.div
                      key={`${up.el}-${up.level}`}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 380, damping: 20 }}
                      className="flex items-center gap-1.5 rounded-full border-[1.5px] bg-black/25 py-1 pl-1.5 pr-2.5"
                      style={{ borderColor: meta.color }}
                    >
                      <span className="text-[15px]">{meta.icon}</span>
                      <span className="text-[10.5px] font-bold text-white">
                        {HERO_NAMES[up.el]} <span style={{ color: meta.color }}>Lv {up.level}</span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onRestart}
        className="mt-6 flex-shrink-0 rounded-[13px] px-7 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] shadow-[0_8px_20px_rgba(255,217,142,0.35)]"
        style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
      >
        {restartLabel}
      </motion.button>
    </motion.div>
  );
}
