import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MapDef } from '@/types';
import { ITEMS_BY_ID, SHOP_BUY_ITEMS } from '@/constants';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';

interface MapItemsSheetProps {
  open: boolean;
  map: MapDef;
  onClose: () => void;
}

type SubTab = 'items' | 'buy' | 'sell';

/** Overworld Backpack — reachable from any map (so a Town Portal Scroll is
 *  actually useful mid-adventure), but the Buy/Sell shop tabs only appear
 *  while standing in Crown Haven City (`map.safe`). Healing here works
 *  directly on the party's persisted HP (no turn/energy cost — there's no
 *  turn structure on the overworld, unlike the in-battle ItemsSheet). */
export function MapItemsSheet({ open, map, onClose }: MapItemsSheetProps) {
  const inventory = useGameStore((s) => s.inventory);
  const aeons = useGameStore((s) => s.aeons);
  const healFromMap = useGameStore((s) => s.healFromMap);
  const buyItem = useGameStore((s) => s.buyItem);
  const sellItem = useGameStore((s) => s.sellItem);
  const removeItem = useGameStore((s) => s.removeItem);
  const warpToHub = useMapStore((s) => s.warpToHub);
  const locked = useMapStore((s) => s.locked);
  const [tab, setTab] = useState<SubTab>('items');

  const consumables = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'consumable' && e.qty > 0);

  const lootToSell = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'loot' && !!e.def.sellPrice && e.qty > 0);

  function handleClose() {
    setTab('items');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-[420px] overflow-y-auto rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">🎒 Backpack</div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--color-gold)]/40 bg-black/25 px-2.5 py-1 font-['Baloo_2'] text-[11px] font-extrabold text-[var(--color-gold)]">
                  💰 {aeons}
                </span>
                <button onClick={handleClose} className="text-xl text-white/40">✕</button>
              </div>
            </div>

            {map.safe && (
              <div className="mb-3 flex gap-1">
                {(['items', 'buy', 'sell'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-lg py-1.5 text-center text-[9.5px] font-bold uppercase tracking-wide ${
                      tab === t ? 'bg-[#1a1330] text-[#fff8f0]' : 'bg-[#1a1330]/60 text-white/50'
                    }`}
                  >
                    {t === 'items' ? '🎒 Items' : t === 'buy' ? '🏪 Buy' : '💰 Sell'}
                  </button>
                ))}
              </div>
            )}

            {tab === 'items' && (
              consumables.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-white/40">No consumables in your Backpack.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {consumables.map(({ def, qty }) => {
                    const isTeleport = !!def.teleportHub;
                    const disabled = isTeleport ? map.safe || locked : false;
                    return (
                      <div key={def.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                        <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} <span className="text-white/40">×{qty}</span></div>
                          <div className="text-[10px] text-white/50">
                            {isTeleport ? (map.safe ? "You're already here" : 'Warps you back to Crown Haven City') : `Heals ${def.healAmount} HP`}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (isTeleport) { warpToHub(); removeItem(def.id, 1); handleClose(); }
                            else healFromMap(def.id);
                          }}
                          disabled={disabled}
                          className="flex-shrink-0 rounded-lg px-3 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-30"
                          style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
                        >
                          Use
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'buy' && map.safe && (
              <div className="flex flex-col gap-2">
                {SHOP_BUY_ITEMS.map((id) => {
                  const def = ITEMS_BY_ID[id];
                  if (!def) return null;
                  const owned = inventory[id] ?? 0;
                  const canAfford = aeons >= (def.buyPrice ?? Infinity);
                  return (
                    <div key={id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} {owned > 0 && <span className="text-white/40">×{owned}</span>}</div>
                        <div className="text-[10px] text-white/50">💰 {def.buyPrice} Aeons</div>
                      </div>
                      <button
                        onClick={() => buyItem(id, 1)}
                        disabled={!canAfford}
                        className="flex-shrink-0 rounded-lg px-3 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
                      >
                        Buy
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'sell' && map.safe && (
              lootToSell.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-white/40">No sellable loot in your Backpack.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lootToSell.map(({ def, qty }) => (
                    <div key={def.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} <span className="text-white/40">×{qty}</span></div>
                        <div className="text-[10px] text-white/50">💰 {def.sellPrice} Aeons each</div>
                      </div>
                      <button
                        onClick={() => sellItem(def.id, 1)}
                        className="flex-shrink-0 rounded-lg border border-white/18 bg-white/8 px-3 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-white/80"
                      >
                        Sell
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
