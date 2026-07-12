import { AnimatePresence, motion } from 'framer-motion';
import type { BattleState } from '@/types';
import { ITEMS_BY_ID } from '@/constants';
import { useGameStore } from '@/stores/gameStore';

interface ItemsSheetProps {
  open: boolean;
  battle: BattleState;
  onClose: () => void;
  onUse: (itemId: string) => void;
}

/** Backpack popup, mid-battle — healing Consumables only (Equipment/Card/
 *  Soul are worn before a fight starts, from Party > Equipment; Loot has no
 *  in-battle use; the Town Portal Scroll is overworld-only — see
 *  MapItemsSheet — retreating out of a fight isn't implemented). Always
 *  heals the party's lowest-HP living mage, same auto-target convention the
 *  rest of battle UI already uses. Using one spends the currently-planning
 *  hero's turn (same cost as Pass) — not a free action, so healing mid-fight
 *  trades away that hero's attack for the round. */
export function ItemsSheet({ open, battle, onClose, onUse }: ItemsSheetProps) {
  const inventory = useGameStore((s) => s.inventory);
  const consumables = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'consumable' && !!e.def.healAmount && e.qty > 0);

  const canUse = battle.phase === 'planning' && !!battle.planningHeroId && !battle.pendingCardId;
  const allFull = battle.players.every((h) => !h.alive || h.hp >= h.maxHp);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">🎒 Consumables</div>
              <button onClick={onClose} className="text-xl text-white/40">✕</button>
            </div>

            {!canUse && <div className="mb-3 text-[11px] text-white/50">{battle.pendingCardId ? 'Confirm or cancel your staged scroll first.' : 'Only usable while planning.'}</div>}
            {canUse && allFull && <div className="mb-3 text-[11px] text-white/50">Everyone's already at full HP.</div>}
            {canUse && !allFull && <div className="mb-3 text-[11px] text-[var(--color-gold)]">Using an item spends this mage's turn — choose wisely.</div>}

            {consumables.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-white/40">No consumables in your Backpack.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {consumables.map(({ def, qty }) => (
                  <div key={def.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                    <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} <span className="text-white/40">×{qty}</span></div>
                      <div className="text-[10px] text-white/50">Heals {def.healAmount} HP · costs this mage's turn</div>
                    </div>
                    <button
                      onClick={() => onUse(def.id)}
                      disabled={!canUse || allFull}
                      className="flex-shrink-0 rounded-lg px-3 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-30"
                      style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
