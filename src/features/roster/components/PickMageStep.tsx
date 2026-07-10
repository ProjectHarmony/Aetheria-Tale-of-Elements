import { motion } from 'framer-motion';
import { useRosterStore } from '@/stores/rosterStore';
import { ELEMENTS_ALL, ELEMENT_META, HERO_CRIT, HERO_DODGE, HERO_HP, HERO_NAMES, SKILL_TREES, SPEED } from '@/constants';
import { MageSprite } from '@/components/ui/MageSprite';

const KIND_ICON: Record<string, string> = { attack: '⚔', buff: '🌀', passive: '♦', ultimate: '✦' };

export function PickMageStep() {
  const picks = useRosterStore((s) => s.picks);
  const previewEl = useRosterStore((s) => s.previewEl);
  const toggleElement = useRosterStore((s) => s.toggleElement);

  return (
    <div>
      <div className="mb-3.5 flex items-start gap-2.5 rounded-2xl border-[1.5px] border-[rgba(255,143,163,0.5)] bg-[#3a1f28]/70 p-3">
        <span className="text-lg leading-none">⚠️</span>
        <div className="text-[11px] leading-relaxed text-white/90">
          <b className="text-[var(--color-danger)]">This choice is permanent.</b> Once you confirm your 3 mages, they're locked in for this character — choose carefully.
        </div>
      </div>

      <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Choose 3 mages — tap a frame to preview their scrolls</div>

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {ELEMENTS_ALL.map((el) => {
          const meta = ELEMENT_META[el];
          const picked = picks.includes(el);
          const locked = !picked && picks.length >= 3;
          const previewing = previewEl === el;
          const pickOrder = picked ? picks.indexOf(el) + 1 : null;

          return (
            <motion.div
              key={el}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleElement(el)}
              className="relative flex aspect-[3/4.4] cursor-pointer flex-col items-center justify-end overflow-hidden rounded-xl border-2 p-2 text-center backdrop-blur-sm"
              style={{
                borderColor: picked ? meta.color : previewing ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.14)',
                background: 'linear-gradient(180deg, rgba(60,44,84,0.7), rgba(20,12,30,0.9))',
                boxShadow: picked ? `0 0 16px -2px ${meta.color}` : undefined,
                opacity: locked ? 0.35 : 1,
              }}
            >
              {pickOrder && (
                <div className="absolute left-1.5 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--color-gold)] font-['Baloo_2'] text-[10px] font-extrabold text-[var(--color-gold-deep)]">
                  {pickOrder}
                </div>
              )}
              <div className="mb-auto mt-2 h-14 w-14"><MageSprite el={el} /></div>
              <div className="mt-1 font-['Baloo_2'] text-[11px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</div>
              <div className="mt-0.5 text-[7.5px] leading-tight text-white/65">HP {HERO_HP[el]}<br />SPD {SPEED[el]}</div>
              <div className={`mt-1.5 w-full rounded px-1 py-1 text-[7.5px] font-extrabold uppercase tracking-wide ${picked ? 'bg-[rgba(126,232,184,0.22)] text-[var(--color-success)]' : 'bg-black/25 text-white/40'}`}>
                {picked ? '✓ Selected' : locked ? 'Team full' : 'Tap to select'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="min-h-[120px] rounded-2xl border border-white/10 bg-black/20 p-3.5">
        {!previewEl ? (
          <div className="py-6 text-center text-[11px] leading-relaxed text-white/40">
            Tap any mage above to preview their skill tree — build them out with skill points earned through Adventure.
          </div>
        ) : (
          <>
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="h-10 w-10 flex-shrink-0"><MageSprite el={previewEl} /></div>
              <div>
                <div className="font-['Baloo_2'] text-sm font-extrabold" style={{ color: ELEMENT_META[previewEl].color }}>{HERO_NAMES[previewEl]}</div>
                <div className="mt-0.5 text-[9px] text-white/50">
                  HP {HERO_HP[previewEl]} · SPD {SPEED[previewEl]} · Dodge {Math.round(HERO_DODGE[previewEl] * 100)}% · Crit {Math.round(HERO_CRIT[previewEl] * 100)}% — {SKILL_TREES[previewEl].length} skills across 3 branches
                </div>
              </div>
            </div>
            <div className="mb-1.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white/40">📜 Skill Tree Preview</div>
            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
              {SKILL_TREES[previewEl].map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-lg border-l-[3px] bg-white/5 px-2 py-1.5" style={{ borderLeftColor: ELEMENT_META[previewEl].color }}>
                  <span className="w-14 flex-shrink-0 pt-0.5 font-['Baloo_2'] text-[7.5px] font-extrabold uppercase text-[var(--color-gold)]">T{s.tier} {s.branch}</span>
                  <span className="flex-shrink-0 pt-0.5 text-[10px]">{KIND_ICON[s.kind]}</span>
                  <div className="min-w-0">
                    <div className="font-['Baloo_2'] text-[9.5px] font-bold text-[#fff8f0]">
                      {s.name}
                      {s.kind === 'ultimate' && <span className="ml-1 rounded bg-[rgba(255,217,142,0.15)] px-1 text-[6.5px] font-extrabold text-[var(--color-gold)]">ULTIMATE</span>}
                    </div>
                    <div className="mt-0.5 text-[7.5px] leading-snug text-white/45">
                      {s.dmg ? `${s.dmg} DMG${s.aoe ? ' · ALL' : ''} — ` : ''}{s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
