import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRosterStore } from '@/stores/rosterStore';
import { useGameStore } from '@/stores/gameStore';
import { AppearanceStep } from './AppearanceStep';
import { StoryStep } from './StoryStep';

export function RosterPage() {
  const step = useRosterStore((s) => s.step);
  const characterName = useRosterStore((s) => s.characterName);
  const hairColor = useRosterStore((s) => s.hairColor);
  const eyeColor = useRosterStore((s) => s.eyeColor);
  const el = useRosterStore((s) => s.el);
  const goToStory = useRosterStore((s) => s.goToStory);
  const goBackToAppearance = useRosterStore((s) => s.goBackToAppearance);
  const resetRoster = useRosterStore((s) => s.reset);
  const createParty = useGameStore((s) => s.createParty);
  const navigate = useNavigate();

  useEffect(() => () => resetRoster(), [resetRoster]);

  const canContinue = step === 'appearance' ? characterName.trim().length > 0 : !!el;

  function handleContinue() {
    if (step === 'appearance') {
      goToStory();
    } else if (el) {
      // A character is one mage now (see the MMORPG rehaul) — placements/
      // formation only ever mattered for a multi-mage squad, so both are
      // trivial here (the lone mage always takes the front slot).
      createParty([el], { [el]: 'front' }, '2f1b', { name: characterName.trim(), hairColor, eyeColor });
      resetRoster();
      navigate('/tutorial');
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pb-2 pt-5 text-center">
        <div className="font-['Baloo_2'] text-lg font-extrabold text-[#2c1f3d]">Two Elements</div>
        <div className="mt-1.5 inline-block rounded-full border border-white/14 bg-[var(--panel-bg)] px-3.5 py-1 text-[10.5px] font-bold text-[var(--color-gold)]">
          {step === 'appearance' ? 'Step 1 — Create your character' : 'Step 2 — Your story begins'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {step === 'appearance' ? <AppearanceStep /> : <StoryStep />}
      </div>

      <div className="flex gap-2 p-4">
        {step === 'story' && (
          <button onClick={goBackToAppearance} className="flex-1 rounded-[13px] border-2 border-white/20 bg-[#241a30]/90 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-white">
            Back
          </button>
        )}
        <motion.button
          whileTap={canContinue ? { scale: 0.97 } : undefined}
          disabled={!canContinue}
          onClick={handleContinue}
          className="animate-gradient flex-[2] rounded-[13px] py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] disabled:opacity-30"
          style={{ background: 'linear-gradient(120deg, var(--color-fire), var(--color-gold), var(--color-earth))' }}
        >
          {step === 'appearance' ? 'Continue' : '✓ Begin Your Journey'}
        </motion.button>
      </div>
    </div>
  );
}
