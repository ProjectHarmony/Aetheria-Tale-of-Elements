import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MapDef } from '@/types';
import { ITEMS_BY_ID, SHOP_BUY_ITEMS } from '@/constants';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useHoldRepeat } from '@/hooks/useHoldRepeat';

interface MapItemsSheetProps {
  open: boolean;
  map: MapDef;
  onClose: () => void;
}

type SubTab = 'items' | 'buy' | 'sell';

/** A qty +/- pair for a Buy/Sell row — reuses the same hold-to-repeat
 *  pattern as StatsTab.tsx's StatRow, so picking a stack of 10 potions
 *  doesn't need 10 separate taps. `onChange` takes a signed delta (not an
 *  absolute value) so the caller can apply it via a functional state update
 *  — several ticks firing before React re-renders (holding the button, or
 *  two clicks landing in the same batched update) would otherwise all read
 *  the same stale `qty` prop and collapse into a single +1 instead of
 *  accumulating. */
function QtyStepper({ qty, max, onChange }: { qty: number; max: number; onChange: (delta: number) => void }) {
  const minusHold = useHoldRepeat({ onTick: () => onChange(-1), disabled: qty <= 1 });
  const plusHold = useHoldRepeat({ onTick: () => onChange(1), disabled: qty >= max });
  return (
    <div className="flex flex-shrink-0 items-center gap-1">
      <button {...minusHold} disabled={qty <= 1} className="h-6 w-6 touch-none select-none rounded-md border border-white/16 bg-white/8 font-['Baloo_2'] text-sm font-extrabold text-white/60 disabled:opacity-20">
        −
      </button>
      <span className="w-5 flex-shrink-0 text-center font-['Baloo_2'] text-[12px] font-extrabold text-[#fff8f0]">{qty}</span>
      <button {...plusHold} disabled={qty >= max} className="h-6 w-6 touch-none select-none rounded-md border border-white/16 bg-white/8 font-['Baloo_2'] text-sm font-extrabold text-white/60 disabled:opacity-20">
        +
      </button>
    </div>
  );
}

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
  const [buyQty, setBuyQty] = useState<Record<string, number>>({});
  const [sellQty, setSellQty] = useState<Record<string, number>>({});
  const [confirmBuyId, setConfirmBuyId] = useState<string | null>(null);
  const [confirmSellId, setConfirmSellId] = useState<string | null>(null);
  const [selectedEquipIds, setSelectedEquipIds] = useState<Set<string>>(new Set());
  const [confirmEquipBatch, setConfirmEquipBatch] = useState(false);

  const consumables = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'consumable' && e.qty > 0);

  const equipmentToSell = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'equipment' && !!e.def.sellPrice && e.qty > 0);

  const lootToSell = Object.entries(inventory)
    .map(([id, qty]) => ({ def: ITEMS_BY_ID[id], qty }))
    .filter((e): e is { def: NonNullable<typeof e.def>; qty: number } => !!e.def && e.def.category === 'loot' && !!e.def.sellPrice && e.qty > 0);

  function handleClose() {
    setTab('items');
    setConfirmBuyId(null);
    setConfirmSellId(null);
    setSelectedEquipIds(new Set());
    setConfirmEquipBatch(false);
    onClose();
  }

  function toggleEquipSelected(id: string) {
    setSelectedEquipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const buyDef = confirmBuyId ? ITEMS_BY_ID[confirmBuyId] : undefined;
  const buyChosenQty = confirmBuyId ? (buyQty[confirmBuyId] ?? 1) : 1;
  const sellDef = confirmSellId ? ITEMS_BY_ID[confirmSellId] : undefined;
  const sellChosenQty = confirmSellId ? (sellQty[confirmSellId] ?? 1) : 1;

  const selectedEquip = equipmentToSell.filter((e) => selectedEquipIds.has(e.def.id));
  const equipBatchTotal = selectedEquip.reduce((sum, e) => sum + (e.def.sellPrice ?? 0) * e.qty, 0);

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
                  const price = def.buyPrice ?? Infinity;
                  const canAfford = aeons >= price;
                  const maxQty = Math.min(99, Math.max(1, Math.floor(aeons / price)));
                  const qty = Math.min(buyQty[id] ?? 1, maxQty);
                  return (
                    <div key={id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} {owned > 0 && <span className="text-white/40">×{owned}</span>}</div>
                        <div className="text-[10px] text-white/50">💰 {def.buyPrice} Aeons</div>
                      </div>
                      {canAfford && (
                        <QtyStepper
                          qty={qty}
                          max={maxQty}
                          onChange={(delta) => setBuyQty((s) => ({ ...s, [id]: Math.min(maxQty, Math.max(1, (s[id] ?? 1) + delta)) }))}
                        />
                      )}
                      <button
                        onClick={() => setConfirmBuyId(id)}
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
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-white/45">
                    <span>🎽 Equipment</span>
                    {selectedEquipIds.size > 0 && <span className="text-[var(--color-gold)]">{selectedEquipIds.size} selected</span>}
                  </div>
                  {equipmentToSell.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-black/15 p-3 text-center text-[10.5px] text-white/35">No sellable Equipment in your Backpack.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {equipmentToSell.map(({ def, qty }) => {
                        const checked = selectedEquipIds.has(def.id);
                        return (
                          <button
                            key={def.id}
                            type="button"
                            onClick={() => toggleEquipSelected(def.id)}
                            className={`flex items-center gap-3 rounded-xl border p-2.5 text-left ${checked ? 'border-[var(--color-gold)]/60 bg-[var(--color-gold)]/10' : 'border-white/10 bg-black/20'}`}
                          >
                            <span
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-[1.5px] text-[11px] font-extrabold ${
                                checked ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-gold-deep)]' : 'border-white/25 bg-black/25 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} {qty > 1 && <span className="text-white/40">×{qty}</span>}</div>
                              <div className="text-[10px] text-white/50">💰 {def.sellPrice} Aeons{qty > 1 ? ' each' : ''}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/45">📦 Etc</div>
                  {lootToSell.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-black/15 p-3 text-center text-[10.5px] text-white/35">No sellable loot in your Backpack.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {lootToSell.map(({ def, qty }) => {
                        const chosen = Math.min(sellQty[def.id] ?? 1, qty);
                        return (
                          <div key={def.id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 p-2.5">
                            <span className="flex-shrink-0 text-2xl">{def.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">{def.name} <span className="text-white/40">×{qty}</span></div>
                              <div className="text-[10px] text-white/50">💰 {def.sellPrice} Aeons each</div>
                            </div>
                            <QtyStepper
                              qty={chosen}
                              max={qty}
                              onChange={(delta) => setSellQty((s) => ({ ...s, [def.id]: Math.min(qty, Math.max(1, (s[def.id] ?? 1) + delta)) }))}
                            />
                            <button
                              onClick={() => setConfirmSellId(def.id)}
                              className="flex-shrink-0 rounded-lg border border-white/18 bg-white/8 px-3 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-white/80"
                            >
                              Sell
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {tab === 'sell' && selectedEquipIds.size > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-4 bottom-4 z-[410] flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-gold)]/50 bg-[#1a1330] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            >
              <span className="font-['Baloo_2'] text-[12px] font-bold text-[#fff8f0]">
                Sell Selected ({selectedEquipIds.size}) — 💰{equipBatchTotal}
              </span>
              <button
                onClick={() => setConfirmEquipBatch(true)}
                className="flex-shrink-0 rounded-lg px-3.5 py-2 font-['Baloo_2'] text-[11px] font-extrabold text-[var(--color-gold-deep)]"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                Sell
              </button>
            </motion.div>
          )}

          <ConfirmModal
            open={!!buyDef}
            title="Buy Item?"
            description={buyDef ? `Buy ${buyChosenQty}x ${buyDef.name} for 💰 ${(buyDef.buyPrice ?? 0) * buyChosenQty} Aeons?` : ''}
            confirmLabel="Buy"
            onCancel={() => setConfirmBuyId(null)}
            onConfirm={() => { if (confirmBuyId) buyItem(confirmBuyId, buyChosenQty); setConfirmBuyId(null); }}
          />
          <ConfirmModal
            open={!!sellDef}
            title="Sell Item?"
            description={sellDef ? `Sell ${sellChosenQty}x ${sellDef.name} for 💰 ${(sellDef.sellPrice ?? 0) * sellChosenQty} Aeons?` : ''}
            confirmLabel="Sell"
            onCancel={() => setConfirmSellId(null)}
            onConfirm={() => { if (confirmSellId) sellItem(confirmSellId, sellChosenQty); setConfirmSellId(null); }}
          />
          <ConfirmModal
            open={confirmEquipBatch}
            title="Sell Selected Equipment?"
            description={`Sell ${selectedEquip.length} item${selectedEquip.length === 1 ? '' : 's'} (${selectedEquip.map((e) => `${e.qty > 1 ? `${e.qty}x ` : ''}${e.def.name}`).join(', ')}) for 💰 ${equipBatchTotal} Aeons?`}
            confirmLabel="Sell All"
            onCancel={() => setConfirmEquipBatch(false)}
            onConfirm={() => {
              selectedEquip.forEach((e) => sellItem(e.def.id, e.qty));
              setSelectedEquipIds(new Set());
              setConfirmEquipBatch(false);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
