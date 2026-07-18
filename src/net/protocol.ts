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

  CHAT_WORLD_SEND: 'chat:world:send',
  CHAT_PARTY_SEND: 'chat:party:send',
  CHAT_PRIVATE_SEND: 'chat:private:send',
  CHAT_MESSAGE: 'chat:message',

  PARTY_INVITE: 'party:invite',
  PARTY_INVITE_RECEIVED: 'party:inviteReceived',
  PARTY_ACCEPT: 'party:accept',
  PARTY_DECLINE: 'party:decline',
  PARTY_LEAVE: 'party:leave',
  PARTY_SNAPSHOT: 'party:snapshot',
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

/** One chat line — every channel funnels through the same client-facing
 *  `CHAT_MESSAGE` event, tagged here so the client can route/filter by tab
 *  instead of the server needing 4 separate incoming event names. */
export interface ChatMessage {
  id: string;
  channel: 'world' | 'party' | 'private' | 'system';
  from: string;
  /** Private only — the recipient username. */
  to?: string;
  body: string;
  ts: number;
}

export interface ChatSendPayload {
  body: string;
}

export interface ChatPrivateSendPayload {
  toUsername: string;
  body: string;
}

export interface PartyInvitePayload {
  toUsername: string;
}

export interface PartyInviteReceivedPayload {
  fromUsername: string;
}

export interface PartyRespondPayload {
  fromUsername: string;
}

/** The multiplayer player-group a socket currently belongs to — entirely
 *  separate from the `Party` type (a character's own single-mage build).
 *  `groupId: null` + empty `members` means "not currently in a party." */
export interface PartySnapshotPayload {
  groupId: string | null;
  members: string[];
}
