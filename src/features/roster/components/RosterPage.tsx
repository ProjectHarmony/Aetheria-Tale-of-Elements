import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRosterStore } from '@/stores/rosterStore';
import { useGameStore } from '@/stores/gameStore';
import { FORMATIONS } from '@/constants';
import { PickMageStep } from './PickMageStep';
import { PlacementStep } from './PlacementStep';

export function RosterPage() {
  const step = useRosterStore((s) => s.step);
  const picks = useRosterStore((s) => s.picks);
  const placements = useRosterStore((s) => s.placements);
  const formationType = useRosterStore((s) => s.formationType);
  const goToPlacement = useRosterStore((s) => s.goToPlacement);
  const goBackToPickMage = useRosterStore((s) => s.goBackToPickMage);
  const resetRoster = useRosterStore((s) => s.reset);
  const createParty = useGameStore((s) => s.createParty);
  const navigate = useNavigate();

  useEffect(() => () => resetRoster(), [resetRoster]);

  const formation = FORMATIONS[formationType];
  const frontCount = picks.filter((el) => placements[el] === 'front').length;
  const backCount = picks.filter((el) => placements[el] === 'back').length;
  const placementComplete = frontCount === formation.front && backCount === formation.back;

  const canContinue = step === 'pickMage' ? picks.length === 3 : placementComplete;

  function handleContinue() {
    if (step === 'pickMage') {
      goToPlacement();
    } else {
      createParty(picks, placements, formationType);
      resetRoster();
      navigate('/hub');
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pb-2 pt-5 text-center">
        <div className="font-['Baloo_2'] text-lg font-extrabold text-[#2c1f3d]">Two Elements</div>
        <div className="mt-1.5 inline-block rounded-full border border-white/14 bg-[var(--panel-bg)] px-3.5 py-1 text-[10.5px] font-bold text-[var(--color-gold)]">
          {step === 'pickMage' ? 'Step 1 — Pick your team' : 'Step 2 — Battle placement'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {step === 'pickMage' ? <PickMageStep /> : <PlacementStep />}
      </div>

      <div className="flex gap-2 p-4">
        {step === 'placement' && (
          <button onClick={goBackToPickMage} className="flex-1 rounded-[13px] border-2 border-white/20 bg-[#241a30]/90 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-white">
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
          {step === 'pickMage' ? 'Confirm 3 Mages — Continue' : '✓ Confirm Formation'}
        </motion.button>
      </div>
    </div>
  );
}
