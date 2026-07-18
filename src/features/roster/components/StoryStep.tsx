import { motion } from 'framer-motion';
import { useRosterStore } from '@/stores/rosterStore';
import { ELEMENTS_ALL, ELEMENT_META, HERO_CRIT, HERO_DODGE, HERO_HP, HERO_NAMES, SKILL_TREES, SPEED } from '@/constants';
import { MageSprite } from '@/components/ui/MageSprite';

const KIND_ICON: Record<string, string> = { attack: '⚔', buff: '🌀', passive: '♦', ultimate: '✦' };

/** Placeholder opening narrative — swap this copy out once the real
 *  storyline is written. Ends in the character's defining choice: their
 *  one main element, for the rest of the game. */
const STORY_TEXT = [
  'The road to Crown Haven City is long behind you now, and the old world with it.',
  'Somewhere ahead, four elemental courts wait to claim you as their own — Fire, Water, Earth, Wind. Only one will answer when you call.',
  'Close your eyes. Reach for the one that already feels like home.',
];

export function StoryStep() {
  const el = useRosterStore((s) => s.el);
  const pickElement = useRosterStore((s) => s.pickElement);

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        {STORY_TEXT.map((line, i) => (
          <p key={i} className="mb-2 text-[11.5px] italic leading-relaxed text-white/70 last:mb-0">{line}</p>
        ))}
        <div className="mt-3 text-center text-[8.5px] uppercase tracking-wide text-white/25">📖 Placeholder story — final narrative coming later</div>
      </div>

      <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Choose your main element</div>

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {ELEMENTS_ALL.map((candidate) => {
          const meta = ELEMENT_META[candidate];
          const picked = el === candidate;

          return (
            <motion.div
              key={candidate}
              whileTap={{ scale: 0.96 }}
              onClick={() => pickElement(candidate)}
              className="relative flex aspect-[3/4.4] cursor-pointer flex-col items-center justify-end overflow-hidden rounded-xl border-2 p-2 text-center backdrop-blur-sm"
              style={{
                borderColor: picked ? meta.color : 'rgba(255,255,255,0.14)',
                background: 'linear-gradient(180deg, rgba(60,44,84,0.7), rgba(20,12,30,0.9))',
                boxShadow: picked ? `0 0 16px -2px ${meta.color}` : undefined,
              }}
            >
              <div className="mb-auto mt-2 h-14 w-14"><MageSprite el={candidate} /></div>
              <div className="mt-1 font-['Baloo_2'] text-[11px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[candidate]}</div>
              <div className="mt-0.5 text-[7.5px] leading-tight text-white/65">HP {HERO_HP[candidate]}<br />SPD {SPEED[candidate]}</div>
              <div className={`mt-1.5 w-full rounded px-1 py-1 text-[7.5px] font-extrabold uppercase tracking-wide ${picked ? 'bg-[rgba(126,232,184,0.22)] text-[var(--color-success)]' : 'bg-black/25 text-white/40'}`}>
                {picked ? '✓ Chosen' : 'Tap to choose'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="min-h-[120px] rounded-2xl border border-white/10 bg-black/20 p-3.5">
        {!el ? (
          <div className="py-6 text-center text-[11px] leading-relaxed text-white/40">
            Tap an element above to preview its skill tree — this choice is permanent for this character.
          </div>
        ) : (
          <>
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="h-10 w-10 flex-shrink-0"><MageSprite el={el} /></div>
              <div>
                <div className="font-['Baloo_2'] text-sm font-extrabold" style={{ color: ELEMENT_META[el].color }}>{HERO_NAMES[el]}</div>
                <div className="mt-0.5 text-[9px] text-white/50">
                  HP {HERO_HP[el]} · SPD {SPEED[el]} · Dodge {Math.round(HERO_DODGE[el] * 100)}% · Crit {Math.round(HERO_CRIT[el] * 100)}% — {SKILL_TREES[el].length} skills across 3 branches
                </div>
              </div>
            </div>
            <div className="mb-1.5 text-[8.5px] font-extrabold uppercase tracking-wide text-white/40">📜 Skill Tree Preview</div>
            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
              {SKILL_TREES[el].map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-lg border-l-[3px] bg-white/5 px-2 py-1.5" style={{ borderLeftColor: ELEMENT_META[el].color }}>
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
