import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, BattleContext, Element, EquippedGear, GearSlot, Inventory, Party, Row } from '@/types';
import { CARD_SOCKET_SLOTS, ITEMS_BY_ID, SOUL_SOCKET_SLOT, STARTER_INVENTORY, STARTING_AEONS, STARTING_RESPEC_TOKENS } from '@/constants';
import type { FormationKey } from '@/constants/formations';
import { derivedStatsFor, newMageState } from '@/systems/battle';
import { applyDraft, computePlacementAfterMove, grantPartyXp, partyPvpUnlocked, respecMage, type LevelUp, type MageDraft } from '@/systems/party';

interface GameStore {
  accounts: Record<string, Account>;
  user: string | null;
  party: Party | null;
  battleContext: BattleContext | null;
  inventory: Inventory;
  /** Currency spent/earned at Crown Haven City's shop — see SHOP_BUY_ITEMS/AEON_TIER_REWARD. */
  aeons: number;

  register: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  login: (username: string, password: string) => { ok: true; hasParty: boolean } | { ok: false; error: string };
  logout: () => void;

  createParty: (picks: Element[], placements: Partial<Record<Element, Row>>, formationType: FormationKey) => void;
  respec: (el: Element) => boolean;
  getRespecTokens: () => number;
  isPvpUnlocked: () => boolean;
  grantXp: (amount: number) => LevelUp[];
  setBattleContext: (ctx: BattleContext | null) => void;
  /** Persists each mage's HP after an Adventure battle (Pokemon-style — no
   *  auto-heal between fights). Pass `{ el: hp }` for the real end-of-battle
   *  values on a win, or force every picked mage to 1 on a full party wipe. */
  syncPartyHp: (hpByEl: Partial<Record<Element, number>>) => void;

  setFormationType: (key: FormationKey) => void;
  moveMagePlacement: (el: Element, target: Row | null, targetOccupantEl?: Element) => void;
  applyMageDraft: (el: Element, draft: MageDraft) => void;
  setEquipped: (el: Element, equipped: string[]) => void;

  /** Backpack — an account-wide bag; only what's equipped/socketed lives on the mage itself. */
  addItem: (itemId: string, qty?: number) => void;
  removeItem: (itemId: string, qty?: number) => void;
  equipItem: (el: Element, itemId: string) => boolean;
  unequipItem: (el: Element, slot: GearSlot) => void;
  socketItem: (el: Element, slot: GearSlot, itemId: string) => boolean;
  unsocketItem: (el: Element, slot: GearSlot, socketedItemId: string) => void;

  /** Crown Haven City's shop — Buy spends Aeons for a purchasable item (see
   *  SHOP_BUY_ITEMS/ItemDef.buyPrice); Sell pays Aeons for a Loot item (see
   *  ItemDef.sellPrice). Both return false (no state change) if invalid. */
  addAeons: (amount: number) => void;
  buyItem: (itemId: string, qty?: number) => boolean;
  sellItem: (itemId: string, qty?: number) => boolean;
  /** Heals the party's lowest-HP% mage directly from the overworld (no
   *  battle/turn structure out here, unlike battleStore.useConsumable). */
  healFromMap: (itemId: string) => boolean;
  /** Regenerates every party mage by a flat HP amount, clamped to their own
   *  max — used by mapStore's Rest tick (see toggleRest), once per second. */
  regenParty: (amountPerMage: number) => void;
}

const DEFAULT_GEAR: Record<GearSlot, EquippedGear | null> = { head: null, robe: null, cape: null, weapon: null, acc1: null, acc2: null };

/** Backfills `gear` (added after some accounts already had a saved Party)
 *  on every mage that's missing it — every gear-reading component/action
 *  indexes straight into `mage.gear[slot]` with no optional chaining, so an
 *  old save without this field crashed the whole Party > Gear tab (blank
 *  screen, no error surfaced) the moment it tried to render. */
function normalizeParty(party: Party | null | undefined): Party | null {
  if (!party) return null;
  const mages = { ...party.mages };
  let changed = false;
  (Object.keys(mages) as Element[]).forEach((el) => {
    const m = mages[el];
    if (m && !m.gear) {
      mages[el] = { ...m, gear: { ...DEFAULT_GEAR } };
      changed = true;
    }
  });
  return changed ? { ...party, mages } : party;
}

/**
 * Local-only "memory" — persisted to localStorage via Zustand's own
 * middleware so refreshing the browser (or closing/reopening the PWA)
 * doesn't lose your account or party. This is NOT a real backend: it's
 * still one browser's local storage, still no server, still no real
 * account security — same trust model the original's in-memory prototype
 * had, just surviving a refresh. `battleContext` is deliberately excluded
 * (see partialize below) since it's a one-shot "what kind of battle did I
 * just launch" flag, meaningless to restore after a reload.
 */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      accounts: {},
      user: null,
      party: null,
      battleContext: null,
      inventory: {},
      aeons: 0,

      register: (username, password) => {
        const name = username.trim();
        if (!name || !password) return { ok: false, error: 'Enter a mage name and password.' };
        if (get().accounts[name]) return { ok: false, error: 'That mage name is taken. Try logging in.' };
        set((s) => ({
          accounts: { ...s.accounts, [name]: { password, respecTokens: STARTING_RESPEC_TOKENS } },
          user: name,
          party: null,
        }));
        return { ok: true };
      },

      login: (username, password) => {
        const name = username.trim();
        if (!name || !password) return { ok: false, error: 'Enter a mage name and password.' };
        const acc = get().accounts[name];
        if (!acc || acc.password !== password) return { ok: false, error: 'Wrong mage name or password.' };
        set({ user: name });
        return { ok: true, hasParty: !!get().party };
      },

      logout: () => set({ user: null }),

      createParty: (picks, placements, formationType) => {
        const mages: Party['mages'] = {};
        picks.forEach((el) => { mages[el] = newMageState(el); });
        set({ party: { picks, placements, mages, formationType }, inventory: { ...STARTER_INVENTORY }, aeons: STARTING_AEONS });
      },

      respec: (el) => {
        const { user, accounts, party } = get();
        if (!user || !party) return false;
        const acc = accounts[user];
        const mage = party.mages[el];
        if (!acc || !mage || (acc.respecTokens || 0) <= 0 || mage.level <= 1) return false;
        respecMage(mage, el);
        set((s) => ({
          accounts: { ...s.accounts, [user]: { ...acc, respecTokens: acc.respecTokens - 1 } },
          party: { ...party, mages: { ...party.mages, [el]: mage } },
        }));
        return true;
      },

      getRespecTokens: () => {
        const { user, accounts } = get();
        return user ? accounts[user]?.respecTokens ?? 0 : 0;
      },

      isPvpUnlocked: () => partyPvpUnlocked(get().party),

      grantXp: (amount) => {
        const { party } = get();
        if (!party) return [];
        const ups = grantPartyXp(party, amount);
        set({ party: { ...party } });
        return ups;
      },

      setBattleContext: (ctx) => set({ battleContext: ctx }),

      syncPartyHp: (hpByEl) => {
        const { party } = get();
        if (!party) return;
        const mages = { ...party.mages };
        (Object.keys(hpByEl) as Element[]).forEach((el) => {
          const mage = mages[el];
          const hp = hpByEl[el];
          if (mage && hp !== undefined) mages[el] = { ...mage, currentHp: Math.max(0, hp) };
        });
        set({ party: { ...party, mages } });
      },

      setFormationType: (key) => {
        const { party } = get();
        if (!party) return;
        // Switching shapes invalidates old slot positions — bench everyone,
        // matching roster creation's rule (see rosterStore.setFormation).
        set({ party: { ...party, formationType: key, placements: {} } });
      },

      moveMagePlacement: (el, target, targetOccupantEl) => {
        const { party } = get();
        if (!party) return;
        set({ party: { ...party, placements: computePlacementAfterMove(party.placements, el, target, targetOccupantEl) } });
      },

      applyMageDraft: (el, draft) => {
        const { party } = get();
        const mage = party?.mages[el];
        if (!party || !mage) return;
        applyDraft(mage, draft);
        set({ party: { ...party, mages: { ...party.mages, [el]: { ...mage } } } });
      },

      setEquipped: (el, equipped) => {
        const { party } = get();
        const mage = party?.mages[el];
        if (!party || !mage) return;
        set({ party: { ...party, mages: { ...party.mages, [el]: { ...mage, equipped } } } });
      },

      addItem: (itemId, qty = 1) => {
        set((s) => ({ inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + qty } }));
      },

      removeItem: (itemId, qty = 1) => {
        set((s) => {
          const next = Math.max(0, (s.inventory[itemId] ?? 0) - qty);
          const inventory = { ...s.inventory };
          if (next <= 0) delete inventory[itemId]; else inventory[itemId] = next;
          return { inventory };
        });
      },

      equipItem: (el, itemId) => {
        const { party, inventory } = get();
        const mage = party?.mages[el];
        const def = ITEMS_BY_ID[itemId];
        if (!party || !mage || !def || def.category !== 'equipment' || !def.slot) return false;
        if ((inventory[itemId] ?? 0) <= 0) return false;
        if (mage.level < (def.reqLevel ?? 0)) return false;

        const slot = def.slot;
        const previous = mage.gear[slot];
        const nextInventory = { ...inventory };
        nextInventory[itemId] = (nextInventory[itemId] ?? 0) - 1;
        if (nextInventory[itemId]! <= 0) delete nextInventory[itemId];
        // Swapping gear returns the old piece AND whatever was socketed into it to the bag.
        if (previous) {
          nextInventory[previous.itemId] = (nextInventory[previous.itemId] ?? 0) + 1;
          previous.socketedIds.forEach((id) => { nextInventory[id] = (nextInventory[id] ?? 0) + 1; });
        }
        const newGear: EquippedGear = { itemId, socketedIds: [] };
        set({
          inventory: nextInventory,
          party: { ...party, mages: { ...party.mages, [el]: { ...mage, gear: { ...mage.gear, [slot]: newGear } } } },
        });
        return true;
      },

      unequipItem: (el, slot) => {
        const { party, inventory } = get();
        const mage = party?.mages[el];
        const worn = mage?.gear?.[slot];
        if (!party || !mage || !worn) return;
        const nextInventory = { ...inventory };
        nextInventory[worn.itemId] = (nextInventory[worn.itemId] ?? 0) + 1;
        worn.socketedIds.forEach((id) => { nextInventory[id] = (nextInventory[id] ?? 0) + 1; });
        set({
          inventory: nextInventory,
          party: { ...party, mages: { ...party.mages, [el]: { ...mage, gear: { ...mage.gear, [slot]: null } } } },
        });
      },

      socketItem: (el, slot, itemId) => {
        const { party, inventory } = get();
        const mage = party?.mages[el];
        const def = ITEMS_BY_ID[itemId];
        const worn = mage?.gear?.[slot];
        if (!party || !mage || !worn || !def) return false;
        const capacity = ITEMS_BY_ID[worn.itemId]?.socketCount ?? 0;
        if (worn.socketedIds.length >= capacity) return false;
        // Cards only socket into Head/Robe/Cape; Soul Stones only into the Weapon — two separate entities, never interchangeable.
        const validPairing = (def.category === 'card' && CARD_SOCKET_SLOTS.includes(slot)) || (def.category === 'soul' && slot === SOUL_SOCKET_SLOT);
        if (!validPairing) return false;
        if ((inventory[itemId] ?? 0) <= 0) return false;
        if (mage.level < (def.reqLevel ?? 0)) return false;

        const nextInventory = { ...inventory };
        nextInventory[itemId] = (nextInventory[itemId] ?? 0) - 1;
        if (nextInventory[itemId]! <= 0) delete nextInventory[itemId];
        const newWorn: EquippedGear = { ...worn, socketedIds: [...worn.socketedIds, itemId] };
        set({
          inventory: nextInventory,
          party: { ...party, mages: { ...party.mages, [el]: { ...mage, gear: { ...mage.gear, [slot]: newWorn } } } },
        });
        return true;
      },

      unsocketItem: (el, slot, socketedItemId) => {
        const { party, inventory } = get();
        const mage = party?.mages[el];
        const worn = mage?.gear?.[slot];
        if (!party || !mage || !worn) return;
        const idx = worn.socketedIds.indexOf(socketedItemId);
        if (idx < 0) return;
        const newSocketed = [...worn.socketedIds];
        newSocketed.splice(idx, 1);
        set({
          inventory: { ...inventory, [socketedItemId]: (inventory[socketedItemId] ?? 0) + 1 },
          party: { ...party, mages: { ...party.mages, [el]: { ...mage, gear: { ...mage.gear, [slot]: { ...worn, socketedIds: newSocketed } } } } },
        });
      },

      addAeons: (amount) => set((s) => ({ aeons: Math.max(0, s.aeons + amount) })),

      buyItem: (itemId, qty = 1) => {
        const { aeons, inventory } = get();
        const def = ITEMS_BY_ID[itemId];
        if (!def || !def.buyPrice || qty <= 0) return false;
        const cost = def.buyPrice * qty;
        if (aeons < cost) return false;
        set({ aeons: aeons - cost, inventory: { ...inventory, [itemId]: (inventory[itemId] ?? 0) + qty } });
        return true;
      },

      sellItem: (itemId, qty = 1) => {
        const { aeons, inventory } = get();
        const def = ITEMS_BY_ID[itemId];
        if (!def || !def.sellPrice || qty <= 0) return false;
        const owned = inventory[itemId] ?? 0;
        if (owned < qty) return false;
        const nextInventory = { ...inventory };
        const remaining = owned - qty;
        if (remaining <= 0) delete nextInventory[itemId]; else nextInventory[itemId] = remaining;
        set({ aeons: aeons + def.sellPrice * qty, inventory: nextInventory });
        return true;
      },

      healFromMap: (itemId) => {
        const { party, inventory } = get();
        const def = ITEMS_BY_ID[itemId];
        if (!party || !def || def.category !== 'consumable' || !def.healAmount) return false;
        if ((inventory[itemId] ?? 0) <= 0) return false;

        let woundedEl: Element | null = null;
        let lowestPct = 1;
        for (const el of party.picks) {
          const mage = party.mages[el];
          if (!mage) continue;
          const maxHp = derivedStatsFor(el, mage).maxHp;
          const hp = Math.max(0, Math.min(maxHp, mage.currentHp ?? maxHp));
          const pct = maxHp > 0 ? hp / maxHp : 1;
          if (pct < lowestPct) { lowestPct = pct; woundedEl = el; }
        }
        if (woundedEl === null) return false; // everyone already full

        const mage = party.mages[woundedEl]!;
        const maxHp = derivedStatsFor(woundedEl, mage).maxHp;
        const hp = Math.max(0, Math.min(maxHp, mage.currentHp ?? maxHp));
        const nextInventory = { ...inventory };
        nextInventory[itemId] = (nextInventory[itemId] ?? 0) - 1;
        if (nextInventory[itemId]! <= 0) delete nextInventory[itemId];
        set({
          inventory: nextInventory,
          party: { ...party, mages: { ...party.mages, [woundedEl]: { ...mage, currentHp: Math.min(maxHp, hp + def.healAmount) } } },
        });
        return true;
      },

      regenParty: (amountPerMage) => {
        const { party } = get();
        if (!party || amountPerMage <= 0) return;
        const mages = { ...party.mages };
        let changed = false;
        party.picks.forEach((el) => {
          const mage = mages[el];
          if (!mage) return;
          const maxHp = derivedStatsFor(el, mage).maxHp;
          const hp = Math.max(0, Math.min(maxHp, mage.currentHp ?? maxHp));
          if (hp < maxHp) {
            mages[el] = { ...mage, currentHp: Math.min(maxHp, hp + amountPerMage) };
            changed = true;
          }
        });
        if (changed) set({ party: { ...party, mages } });
      },
    }),
    {
      name: 'two-elements-save',
      partialize: (state) => ({ accounts: state.accounts, user: state.user, party: state.party, inventory: state.inventory, aeons: state.aeons }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<GameStore>) };
        return { ...merged, party: normalizeParty(merged.party) };
      },
    },
  ),
);
