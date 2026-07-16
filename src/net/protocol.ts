import type { Inventory, Party } from '@/types';

/**
 * Shared socket event names + payload shapes — imported by BOTH server/index.ts
 * and the client's src/net/* modules, so the two sides can't silently drift on
 * what a message looks like. Socket.IO events are plain strings; these consts
 * just keep every emit()/on() call in the codebase spelling the same string.
 */

export const EVENTS = {
  AUTH_REGISTER: 'auth:register',
  AUTH_LOGIN: 'auth:login',
  SAVE_PUSH: 'save:push',

  HUB_JOIN: 'hub:join',
  HUB_LEAVE: 'hub:leave',
  HUB_MOVE: 'hub:move',
  HUB_SNAPSHOT: 'hub:snapshot',
  HUB_PLAYER_MOVED: 'hub:playerMoved',
  HUB_PLAYER_LEFT: 'hub:playerLeft',
} as const;

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthSuccess {
  ok: true;
  username: string;
  party: Party | null;
  inventory: Inventory;
  aeons: number;
}

export interface AuthFailure {
  ok: false;
  error: string;
}

export type AuthResponse = AuthSuccess | AuthFailure;

/** Client -> server: the whole current save, pushed on a debounce after any
 *  gameStore change (see src/net/accountSync.ts) — last-write-wins, no
 *  per-action protocol. Requires the client to already be authenticated on
 *  this socket (server tracks username per-socket after auth). */
export interface SavePushPayload {
  party: Party | null;
  inventory: Inventory;
  aeons: number;
}

/** A player's presence while standing in Crown Haven City. */
export interface HubPlayer {
  userId: string;
  x: number;
  y: number;
  /** First party pick's element, just for a colored dot — no full party leak. */
  elementPreview: string | null;
}

export interface HubMovePayload {
  x: number;
  y: number;
  elementPreview: string | null;
}

export interface HubSnapshotPayload {
  players: HubPlayer[];
}
