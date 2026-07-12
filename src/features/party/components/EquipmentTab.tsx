import { useState } from 'react';
import type { GearSlot, ItemCategory, MageState } from '@/types';
import { ITEMS_BY_ID } from '@/constants';
import { useGameStore } from '@/stores/gameStore';

const GEAR_SLOTS: { key: GearSlot; name: string; icon: string }[] = [
  { key: 'head', name: 'Headgear', icon: '🪖' },
  { key: 'robe', name: 'Robe', icon: '👘' },
  { key: 'cape', name: 'Cape', icon: '🧣' },
  { key: 'weapon', name: 'Staff', icon: '🪄' },
  { key: 'acc1', name: 'Accessory', icon: '💍' },
  { key: 'acc2', name: 'Accessory', icon: '💍' },
];

const CATEGORY_TABS: { key: ItemCategory; name: string; icon: string }[] = [
  { key: 'consumable', name: 'Consumable', icon: '🧪' },
  { key: 'equipment', name: 'Equipment', icon: '🎽' },
  { key: 'loot', name: 'Loot', icon: '📜' },
  { key: 'soul', name: 'Soul', icon: '🔥' },
  { key: 'card', name: 'Card', icon: '🃏' },
];

interface EquipmentTabProps {
  mage: MageState;
  onOpenSlot: (slot: GearSlot) => void;
}

export function EquipmentTab({ mage, onOpenSlot }: EquipmentTabProps) {
  const inventory = useGameStore((s) => s.inventory);
  const [category, setCategory] = useState<ItemCategory>('equipment');

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
              className={`rounded-2xl border-[1.5px] p-3.5 text-center ${def ? 'border-white/25 bg-black/25' : 'border-dashed border-white/16 bg-black/20'}`}
            >
              <div className="text-2xl" style={{ opacity: def ? 1 : 0.5 }}>{def?.icon ?? slot.icon}</div>
              <div className="mt-1 font-['Baloo_2'] text-[11px] font-bold text-[#fff8f0]">{def?.name ?? slot.name}</div>
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
        <div className="flex flex-col gap-1.5">
          {bagItems.map(({ def, qty }) => (
            <div key={def.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
              <span className="flex-shrink-0 text-2xl">{def.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} <span className="text-white/40">×{qty}</span></div>
                <div className="text-[10px] leading-snug text-white/50">{def.desc}</div>
              </div>
              <div className="flex-shrink-0 text-right text-[9px] font-bold uppercase tracking-wide text-white/30">
                {def.category === 'equipment' && (def.slot ? `Tap ${GEAR_SLOTS.find((s) => s.key === def.slot)?.name}` : '')}
                {def.category === 'card' && 'Socket via Head/Robe/Cape'}
                {def.category === 'soul' && 'Socket via Staff'}
                {def.category === 'consumable' && 'Use in battle'}
                {def.category === 'loot' && 'Quest Item'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
