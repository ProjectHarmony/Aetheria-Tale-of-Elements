import type { Party } from './party';

/** In-memory only, matches the original prototype — resets on refresh.
 *  A real backend replaces this object wholesale later; nothing else in
 *  the app should assume accounts are persisted beyond the session. */
export interface Account {
  password: string;
  respecTokens: number;
}

export type BattleContext = 'pvp' | 'adventure';

export interface GameState {
  accounts: Record<string, Account>;
  user: string | null;
  party: Party | null;
  battleContext: BattleContext | null;
}
