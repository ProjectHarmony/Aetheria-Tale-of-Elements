import { AnimatePresence, motion } from 'framer-motion';
import type { Element, GearSlot, MageState } from '@/types';
import { CARD_SOCKET_SLOTS, ITEMS_BY_ID, RARITY_COLOR, SOUL_SOCKET_SLOT } from '@/constants';
import { useGameStore } from '@/stores/gameStore';

const SLOT_META: Record<GearSlot, { name: string; icon: string }> = {
  head: { name: 'Headgear', icon: '🪖' },
  robe: { name: 'Robe', icon: '👘' },
  cape: { name: 'Cape', icon: '🧣' },
  weapon: { name: 'Staff (Weapon)', icon: '🪄' },
  acc1: { name: 'Necklace', icon: '📿' },
  acc2: { name: 'Accessory', icon: '💍' },
};

interface GearSlotSheetProps {
  slot: GearSlot | null;
  el: Element;
  mage: MageState;
  onClose: () => void;
}

/** Rendered at PartyMageDetail's root (same pattern as SkillTreeSheet) so
 *  `absolute inset-0` resolves against the viewport-sized ancestor.
 *  Only handles Equip/Unequip and viewing what's socketed — inserting a new
 *  Card/Soul Crystal happens from the Backpack grid (double-click the item
 *  itself), not from here, so socketing never depends on this sheet being open. */
export function GearSlotSheet({ slot, el, mage, onClose }: GearSlotSheetProps) {
  const inventory = useGameStore((s) => s.inventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const unsocketItem = useGameStore((s) => s.unsocketItem);

  if (!slot) return null;
  const meta = SLOT_META[slot];
  const worn = mage.gear[slot];
  const wornDef = worn ? ITEMS_BY_ID[worn.itemId] : null;
  const capacity = wornDef?.socketCount ?? 0;
  const socketCategory: 'card' | 'soul' | null = CARD_SOCKET_SLOTS.includes(slot) ? 'card' : slot === SOUL_SOCKET_SLOT ? 'soul' : null;

  const equipOptions = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'equipment' && e.def.slot === slot && e.qty > 0);

  return (
    <AnimatePresence>
      {slot && (
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
            className="max-h-[80vh] w-full max-w-[420px] overflow-y-auto rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">{meta.icon} {meta.name}</div>
              <button onClick={onClose} className="text-xl text-white/40">✕</button>
            </div>

            {wornDef ? (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 p-3">
                  <span className="flex-shrink-0 text-2xl">{wornDef.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-['Baloo_2'] text-[12.5px] font-bold" style={{ color: wornDef.rarity ? RARITY_COLOR[wornDef.rarity] : '#fff8f0' }}>{wornDef.name}</div>
                    <div className="text-[10px] leading-snug text-white/50">{wornDef.desc}</div>
                  </div>
                  <button
                    onClick={() => unequipItem(el, slot)}
                    className="flex-shrink-0 rounded-lg border border-white/18 bg-white/8 px-2.5 py-2 font-['Baloo_2'] text-[10.5px] font-extrabold text-white/70"
                  >
                    Unequip
                  </button>
                </div>

                {capacity > 0 && (
                  <div className="mb-3">
                    <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wide text-white/45">
                      Sockets ({worn!.socketedIds.length}/{capacity}) — {socketCategory === 'card' ? 'Monster Cards' : 'Soul Crystals'}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {worn!.socketedIds.map((id) => {
                        const d = ITEMS_BY_ID[id];
                        if (!d) return null;
                        return (
                          <div key={id} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/20 p-2">
                            <span className="text-lg">{d.icon}</span>
                            <div className="min-w-0 flex-1 text-[11px] font-bold text-[#fff8f0]">{d.name}</div>
                            <button onClick={() => unsocketItem(el, slot, id)} className="flex-shrink-0 text-[13px] text-white/40">✕</button>
                          </div>
                        );
                      })}
                      {Array.from({ length: Math.max(0, capacity - worn!.socketedIds.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="rounded-lg border border-dashed border-white/15 bg-black/10 p-2 text-center text-[9.5px] font-bold uppercase tracking-wide text-white/25">
                          Empty Socket
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-center text-[9.5px] text-white/35">Double-tap a Card or Soul Crystal in the Backpack to insert it here.</div>
                  </div>
                )}
              </>
            ) : equipOptions.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-white/40">No {meta.name.toLowerCase()} in your Backpack.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {equipOptions.map(({ def, qty }) => {
                  const locked = mage.level < (def.reqLevel ?? 0);
                  return (
                    <button
                      key={def.id}
                      onClick={() => !locked && equipItem(el, def.id)}
                      disabled={locked}
                      className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 p-2.5 text-left disabled:opacity-45"
                    >
                      <span className="text-2xl">{def.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-['Baloo_2'] text-[12px] font-bold" style={{ color: def.rarity ? RARITY_COLOR[def.rarity] : '#fff8f0' }}>
                          {def.name} <span className="text-white/40">×{qty}</span>
                        </div>
                        <div className="text-[10px] text-white/50">{def.desc}</div>
                      </div>
                      <span className={`flex-shrink-0 font-['Baloo_2'] text-[10.5px] font-extrabold ${locked ? 'text-white/40' : 'text-[var(--color-gold)]'}`}>
                        {locked ? `🔒 Lv ${def.reqLevel}` : 'Equip'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
