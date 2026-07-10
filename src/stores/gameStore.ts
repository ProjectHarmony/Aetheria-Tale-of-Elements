import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, BattleContext, Element, Party, Row } from '@/types';
import { STARTING_RESPEC_TOKENS } from '@/constants';
import type { FormationKey } from '@/constants/formations';
import { newMageState } from '@/systems/battle';
import { applyDraft, computePlacementAfterMove, grantPartyXp, partyPvpUnlocked, respecMage, type LevelUp, type MageDraft } from '@/systems/party';

interface GameStore {
  accounts: Record<string, Account>;
  user: string | null;
  party: Party | null;
  battleContext: BattleContext | null;

  register: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  login: (username: string, password: string) => { ok: true; hasParty: boolean } | { ok: false; error: string };
  logout: () => void;

  createParty: (picks: Element[], placements: Partial<Record<Element, Row>>, formationType: FormationKey) => void;
  respec: (el: Element) => boolean;
  getRespecTokens: () => number;
  isPvpUnlocked: () => boolean;
  grantXp: (amount: number) => LevelUp[];
  setBattleContext: (ctx: BattleContext | null) => void;

  setFormationType: (key: FormationKey) => void;
  moveMagePlacement: (el: Element, target: Row | null, targetOccupantEl?: Element) => void;
  applyMageDraft: (el: Element, draft: MageDraft) => void;
  setEquipped: (el: Element, equipped: string[]) => void;
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
        set({ party: { picks, placements, mages, formationType } });
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
    }),
    {
      name: 'two-elements-save',
      partialize: (state) => ({ accounts: state.accounts, user: state.user, party: state.party }),
    },
  ),
);
