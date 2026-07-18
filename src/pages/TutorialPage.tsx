import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore } from '@/stores/battleStore';
import { BattleScreen } from '@/features/battle';
import { ResponsiveShell } from '@/layouts/ResponsiveShell';
import { buildPlayerTeamFromParty, buildTutorialEncounter, buildTutorialShowcaseMage } from '@/systems/battle';
import { ELEMENT_META, HERO_NAMES, MAX_MAGE_LEVEL } from '@/constants';
import { MageSprite } from '@/components/ui/MageSprite';

/** New-character guided battle — a single deliberately weak Training Dummy
 *  (see buildTutorialEncounter) so the player can safely try casting their
 *  scrolls with the real battle engine before ever facing a real monster.
 *  Shown exactly once per character (see RequireTutorial's guard in App.tsx,
 *  gated on party.tutorialCompleted). */
export function TutorialPage() {
  const party = useGameStore((s) => s.party);
  const completeTutorial = useGameStore((s) => s.completeTutorial);
  const startBattle = useBattleStore((s) => s.startBattle);
  const battle = useBattleStore((s) => s.battle);
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);

  if (!party) return null;
  const el = party.picks[0]!;
  const meta = ELEMENT_META[el];
  const displayName = party.characterName || HERO_NAMES[el];

  function handleStart() {
    if (!party) return;
    // Showcase-only: stages this fight with a Lv{MAX_MAGE_LEVEL}, every-skill-
    // maxed version of the chosen mage so the tutorial doubles as a preview
    // of what the element can eventually do. Nothing here touches the real
    // gameStore — the actual character is still Level 1 with real (near-
    // empty) skill ranks the moment this battle ends.
    const showcaseParty = { ...party, mages: { [el]: buildTutorialShowcaseMage(el) } };
    const { heroes: players, runtimeCards } = buildPlayerTeamFromParty(showcaseParty);
    const enemies = buildTutorialEncounter();
    startBattle(players, enemies, runtimeCards, 1);
    setStarted(true);
  }

  function handleFinish() {
    completeTutorial();
    navigate('/map');
  }

  if (started && battle) {
    return (
      <ResponsiveShell>
        <BattleScreen restartLabel="🏙️ Continue to Crown Haven" onRestart={handleFinish} />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <div className="flex h-full flex-col items-center justify-center gap-5 overflow-y-auto px-7 py-8 text-center">
        <div className="relative h-24 w-24">
          <MageSprite el={el} />
          <span
            className="absolute -bottom-1 -right-1 rounded-full border border-white/20 px-1.5 py-0.5 font-['Baloo_2'] text-[9px] font-extrabold text-[var(--color-gold-deep)]"
            style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
          >
            Lv {MAX_MAGE_LEVEL}
          </span>
        </div>
        <div>
          <div className="font-['Baloo_2'] text-xl font-extrabold" style={{ color: meta.color }}>{displayName}</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">Your journey begins here</div>
        </div>

        <div className="w-full max-w-[320px] rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 backdrop-blur-md">
          <div className="mb-2 font-['Baloo_2'] text-[15px] font-extrabold text-[#fff8f0]">A Vision of Your Future</div>
          <p className="text-[11px] leading-relaxed text-white/60">
            The spirits grant you a glimpse: {displayName} at the height of their power, every scroll fully mastered, facing a Training Dummy to demonstrate what your element can become.
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-white/40">
            This is a preview — you'll begin your real journey at Level 1.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleStart}
          className="animate-gradient w-full max-w-[320px] rounded-[13px] py-3.5 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)]"
          style={{ background: 'linear-gradient(120deg, var(--color-fire), var(--color-gold), var(--color-water))' }}
        >
          ⚔️ Witness the Vision
        </motion.button>
      </div>
    </ResponsiveShell>
  );
}
