import { AnimatePresence, motion } from 'framer-motion';
import type { ItemDef } from '@/types';
import { ELEMENT_META, RARITY_COLOR, RARITY_LABEL, STAT_META, type StatKey } from '@/constants';

const CATEGORY_LABEL: Record<ItemDef['category'], string> = {
  consumable: 'Consumable', equipment: 'Equipment', loot: 'Etc', soul: 'Soul Crystal', card: 'Card',
};

interface ItemDetailModalProps {
  item: ItemDef | null;
  qty: number;
  /** Whether the player currently holds at least one Identify Scroll — gates the Identify button. */
  hasIdentifyScroll: boolean;
  onClose: () => void;
  /** Opens the socket picker for this Card/Soul Crystal — a plain tap here
   *  (not a desktop-only dblclick/right-click) so the whole equip/socket
   *  flow works identically on touch and mouse. */
  onSocket: (itemId: string) => void;
  /** Reveals an Unidentified equipment item, consuming an Identify Scroll. */
  onIdentify: (itemId: string) => void;
}

/** Tap a Backpack item to see its full details — the grid only shows an
 *  icon, so this is where name/desc/stat bonus (and, for Cards/Soul
 *  Crystals, the Socket action) live. Single-tap is deliberate: mobile
 *  browsers don't reliably fire contextmenu/dblclick from touch, so those
 *  are no longer load-bearing for any interaction here. */
export function ItemDetailModal({ item, qty, hasIdentifyScroll, onClose, onSocket, onIdentify }: ItemDetailModalProps) {
  if (!item) return null;
  const unidentified = item.identified === false;
  const statEntries = (Object.keys(item.statBonus ?? {}) as StatKey[]).filter((k) => item.statBonus?.[k]);
  const resistEntries = Object.entries(item.elementResist ?? {});

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
                  {item.itemLevel !== undefined && <><span>·</span><span>Item Lv {item.itemLevel}</span></>}
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 text-xl text-white/40">✕</button>
            </div>
            <div className="mt-3 text-[11.5px] leading-relaxed text-white/65">{item.desc}</div>
            {!unidentified && (statEntries.length > 0 || resistEntries.length > 0 || item.wandElementDmgPct || item.elementSkillRankBonus) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {statEntries.map((k) => (
                  <span key={k} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-[var(--color-gold)]">
                    {STAT_META[k].icon} +{item.statBonus![k]} {STAT_META[k].name}
                  </span>
                ))}
                {resistEntries.map(([el, pct]) => (
                  <span key={el} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-[#9fd0ff]">
                    {ELEMENT_META[el as keyof typeof ELEMENT_META].icon} {Math.round(pct * 100)}% resist
                  </span>
                ))}
                {item.wandElementDmgPct && (
                  <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold text-[#ffb37a]">
                    {ELEMENT_META[item.wandElementDmgPct.el].icon} +{Math.round(item.wandElementDmgPct.pct * 100)}% element dmg
                  </span>
                )}
                {item.elementSkillRankBonus && (
                  <span className="rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--color-gold)]">
                    ✨ +{item.elementSkillRankBonus.ranks} rank to invested {item.elementSkillRankBonus.el} skills
                  </span>
                )}
              </div>
            )}
            {item.setBonusDesc && !unidentified && (
              <div className="mt-3 rounded-lg border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/8 p-2 text-center text-[10px] font-bold text-[var(--color-gold)]">🔗 {item.setBonusDesc}</div>
            )}
            {item.category === 'consumable' && item.healAmount && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-center text-[10.5px] font-bold text-white/60">Heals {item.healAmount} HP · usable in battle</div>
            )}
            {unidentified && (
              <>
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-center text-[10.5px] font-bold text-white/60">❓ Stats hidden until identified</div>
                <button
                  onClick={() => onIdentify(item.id)}
                  disabled={!hasIdentifyScroll}
                  className="mt-3 w-full rounded-xl px-3 py-2.5 font-['Baloo_2'] text-[12px] font-extrabold text-[#06281a] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,var(--color-gold),#ffe9c2)' }}
                >
                  {hasIdentifyScroll ? '🔍 Identify' : '🔍 Identify (need a scroll)'}
                </button>
              </>
            )}
            {(item.category === 'card' || item.category === 'soul') && (
              <button
                onClick={() => onSocket(item.id)}
                className="mt-3 w-full rounded-xl px-3 py-2.5 font-['Baloo_2'] text-[12px] font-extrabold text-[#06281a]"
                style={{ background: 'linear-gradient(135deg,var(--color-success),#8df0b8)' }}
              >
                Socket into gear…
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
