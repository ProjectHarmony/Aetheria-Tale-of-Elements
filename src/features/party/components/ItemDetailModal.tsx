import { AnimatePresence, motion } from 'framer-motion';
import type { ItemDef } from '@/types';
import { RARITY_COLOR, RARITY_LABEL, STAT_META, type StatKey } from '@/constants';

const CATEGORY_LABEL: Record<ItemDef['category'], string> = {
  consumable: 'Consumable', equipment: 'Equipment', loot: 'Etc', soul: 'Soul Crystal', card: 'Card',
};

interface ItemDetailModalProps {
  item: ItemDef | null;
  qty: number;
  onClose: () => void;
}

/** Right-click (or long-press) a Backpack item to see its full details —
 *  the grid only shows an icon, so this is where name/desc/stat bonus live. */
export function ItemDetailModal({ item, qty, onClose }: ItemDetailModalProps) {
  if (!item) return null;
  const statEntries = (Object.keys(item.statBonus ?? {}) as StatKey[]).filter((k) => item.statBonus?.[k]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[430] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-2xl border border-[var(--panel-border)] bg-[#241a30] p-5"
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-['Baloo_2'] text-[15px] font-extrabold" style={{ color: item.rarity ? RARITY_COLOR[item.rarity] : '#fff8f0' }}>{item.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-white/40">
                  {item.rarity && <span style={{ color: RARITY_COLOR[item.rarity] }}>{RARITY_LABEL[item.rarity]}</span>}
                  {item.rarity && <span>·</span>}
                  <span>{CATEGORY_LABEL[item.category]} · ×{qty}</span>
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 text-xl text-white/40">✕</button>
            </div>
            <div className="mt-3 text-[11.5px] leading-relaxed text-white/65">{item.desc}</div>
            {statEntries.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {statEntries.map((k) => (
                  <span key={k} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-[var(--color-gold)]">
                    {STAT_META[k].icon} +{item.statBonus![k]} {STAT_META[k].name}
                  </span>
                ))}
                {!!item.bonusSkillRanks && (
                  <span className="rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--color-gold)]">
                    ✨ +{item.bonusSkillRanks} rank to invested skills
                  </span>
                )}
              </div>
            )}
            {item.category === 'consumable' && item.healAmount && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-center text-[10.5px] font-bold text-white/60">Heals {item.healAmount} HP · usable in battle</div>
            )}
            {!!item.reqLevel && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-center text-[10.5px] font-bold text-white/60">🔒 Requires Lv {item.reqLevel} to equip/socket</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
