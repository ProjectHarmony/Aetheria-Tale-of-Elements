import { AnimatePresence, motion } from 'framer-motion';
import type { Element, GearSlot, ItemDef, MageState } from '@/types';
import { CARD_SOCKET_SLOTS, ITEMS_BY_ID, RARITY_COLOR, SOUL_SOCKET_SLOT } from '@/constants';
import { useGameStore } from '@/stores/gameStore';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

const SLOT_NAME: Record<GearSlot, string> = {
  head: 'Headgear', robe: 'Robe', cape: 'Cape', weapon: 'Staff (Weapon)', acc1: 'Necklace', acc2: 'Accessory',
};

interface CardSocketSheetProps {
  item: ItemDef | null;
  el: Element;
  mage: MageState;
  onClose: () => void;
}

/** Opened by double-clicking a Card or Soul Crystal in the Backpack grid —
 *  sockets it into whichever compatible gear the mage currently has
 *  equipped. Socketing isn't gated behind having the Equip sheet open;
 *  the Card/Soul Crystal itself is the entry point. */
export function CardSocketSheet({ item, el, mage, onClose }: CardSocketSheetProps) {
  const socketItem = useGameStore((s) => s.socketItem);
  useEscapeToClose(!!item, onClose);

  if (!item) return null;
  const slots: GearSlot[] = item.category === 'card' ? CARD_SOCKET_SLOTS : item.category === 'soul' ? [SOUL_SOCKET_SLOT] : [];

  const rows = slots.map((slot) => {
    const worn = mage.gear[slot];
    const wornDef = worn ? ITEMS_BY_ID[worn.itemId] : null;
    const capacity = wornDef?.socketCount ?? 0;
    return { slot, worn, wornDef, capacity };
  });

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[420] flex items-end justify-center bg-black/55 backdrop-blur-sm"
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
              <div className="flex items-center gap-2 font-['Baloo_2'] text-base font-extrabold" style={{ color: item.rarity ? RARITY_COLOR[item.rarity] : '#fff8f0' }}>
                <span className="text-xl">{item.icon}</span> Socket {item.name}
              </div>
              <button onClick={onClose} className="text-xl text-white/40">✕</button>
            </div>

            <div className="flex flex-col gap-1.5">
              {rows.map(({ slot, worn, wornDef, capacity }) => {
                const full = worn ? worn.socketedIds.length >= capacity : false;
                const disabled = !worn || capacity === 0 || full;
                return (
                  <button
                    key={slot}
                    disabled={disabled}
                    onClick={() => {
                      socketItem(el, slot, item.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 p-2.5 text-left disabled:opacity-35"
                  >
                    <span className="text-2xl">{wornDef?.icon ?? '❔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{SLOT_NAME[slot]}</div>
                      <div className="text-[10px] text-white/50">
                        {!worn ? 'Nothing equipped here' : capacity === 0 ? `${wornDef?.name} has no sockets` : full ? `${wornDef?.name} — sockets full` : `${wornDef?.name} — ${worn.socketedIds.length}/${capacity} sockets`}
                      </div>
                    </div>
                    {!disabled && <span className="flex-shrink-0 font-['Baloo_2'] text-[10.5px] font-extrabold text-[var(--color-gold)]">Insert</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
