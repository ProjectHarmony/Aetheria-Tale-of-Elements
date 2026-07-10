const EQUIP_SLOTS = [
  { key: 'head', name: 'Headwear', icon: '🪖', sub: '+ Monster Card socket' },
  { key: 'robe', name: 'Robe', icon: '👘', sub: '+ Monster Card socket' },
  { key: 'cape', name: 'Cape', icon: '🧣', sub: '+ Monster Card socket' },
  { key: 'weapon', name: 'Staff / Wand', icon: '🪄', sub: '+ 3 Soul Stone sockets' },
  { key: 'acc1', name: 'Accessory', icon: '💍', sub: 'Unique effect, no socket' },
  { key: 'acc2', name: 'Accessory', icon: '💍', sub: 'Unique effect, no socket' },
];

export function EquipmentTab() {
  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Equipment — 6 slots per mage</div>
      <div className="grid grid-cols-2 gap-2">
        {EQUIP_SLOTS.map((slot) => (
          <div key={slot.key} className="rounded-2xl border-[1.5px] border-dashed border-white/16 bg-black/20 p-3.5 text-center">
            <div className="text-2xl opacity-50">{slot.icon}</div>
            <div className="mt-1 font-['Baloo_2'] text-[11px] font-bold text-[#fff8f0]">{slot.name}</div>
            <div className="mt-0.5 text-[8px] leading-snug text-white/35">{slot.sub}</div>
            <div className="mt-2 text-[9px] font-extrabold uppercase tracking-wide text-white/25">Empty</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-2.5 text-[10.5px] leading-relaxed text-white/45">
        🚧 Equipment system is designed but not wired in yet — loot, crafting, and card/soul-stone drops are the next build phase.
      </div>
    </div>
  );
}
