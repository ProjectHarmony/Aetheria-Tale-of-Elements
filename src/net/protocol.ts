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
  PARTY_STATUS_SEND: 'party:status:send',
  PARTY_STATUS: 'party:status',

  CHAT_ROOM_SEND: 'chat:room:send',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_SNAPSHOT: 'room:snapshot',
  ROOM_LIST_UPDATE: 'room:listUpdate',
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
  channel: 'world' | 'party' | 'private' | 'system' | 'room';
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

/** A party member's own character stats, as shown in the field Party List
 *  (see MapPage.tsx) — deliberately just the 3 fields Ragnarok's own party
 *  window shows: name, level, HP. Not the full character build. */
export interface PartyMemberStatus {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

/** The multiplayer player-group a socket currently belongs to — entirely
 *  separate from the `Party` type (a character's own single-mage build).
 *  `groupId: null` + empty `members` means "not currently in a party." */
export interface PartySnapshotPayload {
  groupId: string | null;
  members: string[];
  /** Every member's last-known status the server has cached — keyed by
   *  username, so a member who joined before you sent your own first
   *  update is still fully populated the instant you receive the snapshot. */
  statuses: Record<string, PartyMemberStatus>;
}

export type PartyStatusSendPayload = PartyMemberStatus;

export interface PartyStatusPayload extends PartyMemberStatus {
  username: string;
}

/** A Ragnarok-style player-created chat room, anchored to wherever its
 *  creator was standing in Crown Haven City when they made it (the marker
 *  doesn't follow them afterward — matches the classic static room icon).
 *  This is the PUBLIC listing shape broadcast to everyone in the hub — never
 *  carries the password itself, only whether one is required. */
export interface ChatRoomSummary {
  id: string;
  title: string;
  ownerUsername: string;
  occupants: number;
  maxSize: number;
  hasPassword: boolean;
  x: number;
  y: number;
}

export interface RoomCreatePayload {
  title: string;
  maxSize: number;
  /** Omitted or empty = public room, anyone can join without a prompt. */
  password?: string;
  /** The creator's current Crown Haven position — the room marker is
   *  anchored here permanently, same as HubMovePayload's x/y. */
  x: number;
  y: number;
}

export interface RoomJoinPayload {
  roomId: string;
  password?: string;
}

/** Shared ack shape for both ROOM_CREATE and ROOM_JOIN — create can fail for
 *  largely the same reasons join can (already in a room; bad input). */
export type RoomActionResult =
  | { ok: true }
  | { ok: false; error: 'wrong-password' | 'full' | 'not-found' | 'already-in-a-room' | 'invalid-title' | 'error' };

/** The full member-list view of the room you're currently in — as opposed
 *  to `ChatRoomSummary`, which is just the map-marker listing for rooms
 *  you haven't joined yet. */
export interface RoomSnapshotPayload {
  roomId: string | null;
  title: string;
  members: string[];
  maxSize: number;
}

export interface RoomListUpdatePayload {
  rooms: ChatRoomSummary[];
}
