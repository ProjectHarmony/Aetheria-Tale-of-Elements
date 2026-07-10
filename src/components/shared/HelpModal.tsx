import { AnimatePresence, motion } from 'framer-motion';
import { ELEMENT_META, HELP_SECTIONS } from '@/constants';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

/** "How Battle Works" — ported verbatim from the original's HELP_SECTIONS,
 *  reachable from both Hub and the Battle topbar there too. */
export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88%] w-full flex-col rounded-t-[24px] border border-b-0 border-[var(--panel-border)] bg-[#241a30] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/8 px-4.5 py-4">
              <div className="font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">How Battle Works</div>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/14 bg-white/8 text-sm text-[#fff8f0]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4.5 pb-6 pt-4">
              {HELP_SECTIONS.map((s) => (
                <div key={s.title} className="mb-4.5 last:mb-0">
                  <div className="mb-1.5 flex items-center gap-1.5 font-['Baloo_2'] text-[13px] font-extrabold text-[var(--color-gold)]">
                    <span className="text-base">{s.icon}</span>
                    {s.title}
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-white/70 [&_b]:text-[#fff8f0]" dangerouslySetInnerHTML={{ __html: s.text }} />
                  {s.counter && (
                    <div className="my-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold">
                      {(['fire', 'earth', 'wind', 'water'] as const).map((el, i, arr) => (
                        <span key={el} className="flex items-center gap-1.5">
                          <span className="rounded-full px-2.5 py-1" style={{ background: `${ELEMENT_META[el].color}33`, color: ELEMENT_META[el].color }}>
                            {ELEMENT_META[el].icon} {el[0]!.toUpperCase() + el.slice(1)}
                          </span>
                          <span className="text-white/35">{i === arr.length - 1 ? '→ 🔥' : '→'}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {s.example && (
                    <div className="mt-1.5 rounded-xl border border-white/8 bg-black/25 px-2.5 py-2 text-[10px] leading-relaxed text-white/55">
                      💡 {s.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
