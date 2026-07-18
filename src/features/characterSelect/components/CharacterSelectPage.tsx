import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, MAX_CHARACTER_SLOTS } from '@/stores/gameStore';
import { ELEMENT_META, HERO_NAMES } from '@/constants';
import { MageSprite } from '@/components/ui/MageSprite';

export function CharacterSelectPage() {
  const characters = useGameStore((s) => s.characters);
  const selectCharacterSlot = useGameStore((s) => s.selectCharacterSlot);
  const navigate = useNavigate();

  function pick(slotId: string) {
    const slot = characters[slotId];
    selectCharacterSlot(slotId);
    navigate(slot ? '/hub' : '/roster');
  }

  const slotIds = Array.from({ length: MAX_CHARACTER_SLOTS }, (_, i) => String(i));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pb-2 pt-6 text-center">
        <div className="font-['Baloo_2'] text-lg font-extrabold text-[#2c1f3d]">Aetheria — World 1</div>
        <div className="mt-1.5 inline-block rounded-full border border-white/14 bg-[var(--panel-bg)] px-3.5 py-1 text-[10.5px] font-bold text-[var(--color-gold)]">
          Choose a Character
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2.5">
          {slotIds.map((slotId) => {
            const slot = characters[slotId];
            if (!slot) {
              return (
                <motion.button
                  key={slotId}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => pick(slotId)}
                  className="flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-white/18 bg-[var(--panel-bg)] p-4 text-center backdrop-blur-md"
                >
                  <span className="font-['Baloo_2'] text-[13px] font-extrabold text-white/50">+ Create Character</span>
                </motion.button>
              );
            }

            const el = slot.party.picks[0];
            if (!el) return null;
            const meta = ELEMENT_META[el];
            const mage = slot.party.mages[el];
            const level = mage?.level ?? 1;
            const name = slot.party.characterName || HERO_NAMES[el];

            return (
              <motion.button
                key={slotId}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => pick(slotId)}
                className="flex items-center gap-3 rounded-2xl border-[1.5px] p-3 text-left backdrop-blur-md"
                style={{ borderColor: `${meta.color}66`, background: 'var(--panel-bg)' }}
              >
                <div className="h-12 w-12 flex-shrink-0"><MageSprite el={el} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-['Baloo_2'] text-[13px] font-extrabold text-[#fff8f0]">{name}</div>
                  <div className="mt-0.5 text-[9.5px] font-semibold text-white/45">Lv {level} · {meta.icon} {el[0]!.toUpperCase()}{el.slice(1)}</div>
                </div>
                <span className="flex-shrink-0 font-['Baloo_2'] text-[10.5px] font-extrabold text-[var(--color-gold)]">Play →</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
