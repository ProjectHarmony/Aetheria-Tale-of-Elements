import { motion } from 'framer-motion';
import type { BattleState } from '@/types';
import { heroById } from '@/systems/battle';

interface CtaBarProps {
  battle: BattleState;
  onPass: () => void;
  onAttack: () => void;
  onConfirmCard: () => void;
  onCancelCard: () => void;
}

export function CtaBar({ battle, onPass, onAttack, onConfirmCard, onCancelCard }: CtaBarProps) {
  const alivePlayers = battle.players.filter((h) => h.alive);
  const allPlanned = alivePlayers.length > 0 && alivePlayers.every((h) => battle.heroDone[h.id]);
  const attackDisabled = !(battle.phase === 'planning' && allPlanned);

  const current = battle.planningHeroId ? heroById(battle, battle.planningHeroId) : undefined;
  const plan = current ? battle.plans[current.id] : undefined;
  const castCount = Array.isArray(plan) ? plan.length : 0;
  const passDisabled = battle.phase !== 'planning' || !current;

  // A staged (not-yet-committed) card takes over the CTA row entirely —
  // Pass/Attack don't make sense mid-selection, so Cancel/Confirm replaces
  // them until the player either confirms the cast or cancels the pick.
  // Button labels stay fixed-length (no card name interpolated in) so this
  // row is always exactly the same height as the Pass/Attack row it
  // replaces — the highlighted card in the hand already shows which skill
  // is staged, and letting a long skill name wrap here would grow the CTA
  // bar taller, squeezing the battlefield above it and reading as the whole
  // scene "jumping" every time a card is selected/deselected.
  if (battle.phase === 'planning' && battle.pendingCardId) {
    return (
      <div className="relative z-10 flex gap-2 px-3 pb-3.5 lg:gap-3 lg:px-5 lg:pb-5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCancelCard}
          className="flex-1 rounded-[13px] border-2 border-white/20 bg-[#241a30]/90 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] lg:py-4 lg:text-[15px]"
        >
          ✕ Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirmCard}
          className="animate-gradient flex-[2] rounded-[13px] py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] shadow-[0_8px_20px_rgba(255,217,142,0.4)] lg:py-4 lg:text-[15px]"
          style={{ background: 'linear-gradient(120deg, var(--color-fire), var(--color-gold), var(--color-earth))' }}
        >
          ✓ Confirm Cast
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex gap-2 px-3 pb-3.5 lg:gap-3 lg:px-5 lg:pb-5">
      <motion.button
        whileHover={passDisabled ? undefined : { scale: 1.02 }}
        whileTap={passDisabled ? undefined : { scale: 0.97 }}
        disabled={passDisabled}
        onClick={onPass}
        className="flex-1 rounded-[13px] border-2 border-white/20 bg-[#241a30]/90 py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] disabled:opacity-30 lg:py-4 lg:text-[15px]"
      >
        {castCount > 0 ? 'Done' : 'Pass'}
      </motion.button>
      <motion.button
        whileHover={attackDisabled ? undefined : { scale: 1.02 }}
        whileTap={attackDisabled ? undefined : { scale: 0.97 }}
        disabled={attackDisabled}
        onClick={onAttack}
        className="animate-gradient flex-[2] rounded-[13px] py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] shadow-[0_8px_20px_rgba(255,217,142,0.4)] disabled:opacity-30 disabled:shadow-none lg:py-4 lg:text-[15px]"
        style={{ background: 'linear-gradient(120deg, var(--color-fire), var(--color-gold), var(--color-earth))' }}
      >
        ⚔ Attack
      </motion.button>
    </div>
  );
}
