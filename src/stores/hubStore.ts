import { create } from 'zustand';
import type { HubPlayer } from '@/net/protocol';

/** Other connected players currently visible in Crown Haven City — pure
 *  presence data relayed by the test server (see server/hub.ts). Never
 *  persisted, never touches field/Adventure state; only ever populated
 *  while the local player is also on the hub map (see MapPage.tsx). */
interface HubStore {
  otherPlayers: Record<string, HubPlayer>;
  setSnapshot: (players: HubPlayer[]) => void;
  upsertPlayer: (player: HubPlayer) => void;
  removePlayer: (userId: string) => void;
  clear: () => void;
}

export const useHubStore = create<HubStore>((set) => ({
  otherPlayers: {},
  setSnapshot: (players) => set({ otherPlayers: Object.fromEntries(players.map((p) => [p.userId, p])) }),
  upsertPlayer: (player) => set((s) => ({ otherPlayers: { ...s.otherPlayers, [player.userId]: player } })),
  removePlayer: (userId) => set((s) => {
    const next = { ...s.otherPlayers };
    delete next[userId];
    return { otherPlayers: next };
  }),
  clear: () => set({ otherPlayers: {} }),
}));
