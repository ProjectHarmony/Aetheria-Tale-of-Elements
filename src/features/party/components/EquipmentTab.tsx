import { useState } from 'react';
import type { Element, GearSlot, ItemCategory, MageState } from '@/types';
import { ITEMS_BY_ID, RARITY_COLOR } from '@/constants';
import { useGameStore } from '@/stores/gameStore';

const GEAR_SLOTS: { key: GearSlot; name: string; icon: string }[] = [
  { key: 'head', name: 'Headgear', icon: '🪖' },
  { key: 'robe', name: 'Robe', icon: '👘' },
  { key: 'cape', name: 'Cape', icon: '🧣' },
  { key: 'weapon', name: 'Staff', icon: '🪄' },
  { key: 'acc1', name: 'Necklace', icon: '📿' },
  { key: 'acc2', name: 'Accessory', icon: '💍' },
];

const CATEGORY_TABS: { key: ItemCategory; name: string; icon: string }[] = [
  { key: 'consumable', name: 'Consumable', icon: '🧪' },
  { key: 'equipment', name: 'Equipment', icon: '🎽' },
  { key: 'soul', name: 'Soul Crystal', icon: '🔥' },
  { key: 'card', name: 'Card', icon: '🃏' },
  { key: 'loot', name: 'Etc', icon: '📦' },
];

const DRAG_MIME = 'application/x-item-id';

interface EquipmentTabProps {
  el: Element;
  mage: MageState;
  onOpenSlot: (slot: GearSlot) => void;
  onOpenDetail: (itemId: string) => void;
}

export function EquipmentTab({ el, mage, onOpenSlot, onOpenDetail }: EquipmentTabProps) {
  const inventory = useGameStore((s) => s.inventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const [category, setCategory] = useState<ItemCategory>('equipment');
  const [dragOverSlot, setDragOverSlot] = useState<GearSlot | null>(null);

  const bagItems = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.qty > 0 && e.def.category === category)
    .sort((a, b) => a.def.name.localeCompare(b.def.name));

  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Equipment — 6 slots</div>
      <div className="grid grid-cols-2 gap-2">
        {GEAR_SLOTS.map((slot) => {
          const worn = mage.gear[slot.key];
          const def = worn ? ITEMS_BY_ID[worn.itemId] : null;
          return (
            <button
              key={slot.key}
              onClick={() => onOpenSlot(slot.key)}
              onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot.key); }}
              onDragLeave={() => setDragOverSlot((s) => (s === slot.key ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverSlot(null);
                const itemId = e.dataTransfer.getData(DRAG_MIME);
                const dropDef = itemId ? ITEMS_BY_ID[itemId] : null;
                if (dropDef?.category === 'equipment' && dropDef.slot === slot.key) equipItem(el, itemId);
              }}
              className={`rounded-2xl border-[1.5px] p-3.5 text-center transition-colors ${
                dragOverSlot === slot.key ? 'border-solid border-[var(--color-gold)] bg-[var(--color-gold)]/15' : def ? 'border-white/25 bg-black/25' : 'border-dashed border-white/16 bg-black/20'
              }`}
            >
              <div className="text-2xl" style={{ opacity: def ? 1 : 0.5 }}>{def?.icon ?? slot.icon}</div>
              <div className="mt-1 font-['Baloo_2'] text-[11px] font-bold" style={{ color: def?.rarity ? RARITY_COLOR[def.rarity] : '#fff8f0' }}>{def?.name ?? slot.name}</div>
              {def?.socketCount ? (
                <div className="mt-0.5 text-[8px] leading-snug text-white/35">{worn!.socketedIds.length}/{def.socketCount} sockets</div>
              ) : (
                <div className="mt-0.5 text-[8px] leading-snug text-white/35">{slot.name}</div>
              )}
              <div className={`mt-2 text-[9px] font-extrabold uppercase tracking-wide ${def ? 'text-[var(--color-gold)]' : 'text-white/25'}`}>
                {def ? 'Equipped' : 'Empty'}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">🎒 Backpack</div>
      <div className="mb-2.5 flex gap-1">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setCategory(t.key)}
            className={`flex-1 rounded-lg py-1.5 text-center text-[8.5px] font-bold uppercase tracking-wide ${
              category === t.key ? 'bg-[#241a30]/90 text-[#fff8f0]' : 'bg-[#1a1330]/70 text-white/50'
            }`}
          >
            <div className="text-[13px]">{t.icon}</div>
            {t.name}
          </button>
        ))}
      </div>

      {bagItems.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-center text-[10.5px] text-white/40">
          No {CATEGORY_TABS.find((t) => t.key === category)?.name} items in your Backpack.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1">
          {bagItems.map(({ def, qty }) => {
            const unidentified = def.identified === false;
            return (
              <button
                key={def.id}
                type="button"
                draggable={def.category === 'equipment' && !unidentified}
                onDragStart={(e) => e.dataTransfer.setData(DRAG_MIME, def.id)}
                onClick={() => onOpenDetail(def.id)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-md border bg-black/20 text-base ${def.category === 'equipment' && !unidentified ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{ borderColor: def.rarity ? `${RARITY_COLOR[def.rarity]}80` : 'rgba(255,255,255,0.12)' }}
              >
                {def.icon}
                {unidentified && <span className="absolute left-0.5 top-0.5 text-[8px]">❓</span>}
                {qty > 1 && (
                  <span className="absolute bottom-0 right-0.5 font-['Baloo_2'] text-[7px] font-extrabold text-white/70">×{qty}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-center text-[9px] leading-snug text-white/30">
        Tap any item for details · Drag Equipment onto a slot to wear it (or tap the slot above) · Socket Cards/Soul Crystals from the details popup · Unidentified gear needs an Identify Scroll
      </div>
    </div>
  );
}
