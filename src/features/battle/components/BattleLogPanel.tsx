import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TimedBattleEvent } from '@/stores/battleStore';

interface BattleLogPanelProps {
  events: TimedBattleEvent[];
}

/** Desktop-only expanded combat log — the sidebar has real vertical room to
 *  spare there, so instead of just the single most-recent line (LogStrip,
 *  still used for the compact mobile layout) this shows the full scrolling
 *  history for the round, auto-scrolled to the newest entry. */
export function BattleLogPanel({ events }: BattleLogPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const entries = events.filter((e) => e.event.type === 'log') as (TimedBattleEvent & { event: { message: string } })[];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="hidden min-h-0 flex-1 flex-col rounded-[14px] border border-white/8 bg-[#0e0918]/70 lg:flex">
      <div className="flex-shrink-0 border-b border-white/8 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white/40">
        📜 Battle Log
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2">
        {entries.length === 0 && <p className="text-[11px] text-white/30">The round hasn&apos;t started yet.</p>}
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.p
              key={e.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1.5 text-[11px] leading-snug text-white/60"
            >
              {e.event.message}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
