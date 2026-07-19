import type { Server, Socket } from 'socket.io';
import bcrypt from 'bcryptjs';
import {
  EVENTS,
  type ChatMessage,
  type ChatRoomSummary,
  type ChatSendPayload,
  type RoomActionResult,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type RoomListUpdatePayload,
  type RoomSnapshotPayload,
} from '@/net/protocol';
import { socketIdsFor } from './presence';
import { sendSystemMessage } from './systemMessage';

/**
 * Ragnarok-style player-created chat room — anchored to wherever the creator
 * was standing in Crown Haven City at creation time (a static marker, same
 * as the classic room icon; it doesn't track the owner's later movement).
 * Deliberately minimal, same precedent as party.ts: no owner hand-off, no
 * kick — a room just lives as long as it has at least 1 member. A player can
 * only ever be in one room at a time (their own or one they joined).
 */

interface ChatRoomInternal {
  id: string;
  title: string;
  ownerUsername: string;
  maxSize: number;
  passwordHash: string | null;
  members: Set<string>;
  x: number;
  y: number;
}

export const MIN_ROOM_SIZE = 2;
export const MAX_ROOM_SIZE = 10;
const MAX_TITLE_LENGTH = 40;

const rooms = new Map<string, ChatRoomInternal>();
const roomIdByUsername = new Map<string, string>();
let roomSeq = 0;
let msgSeq = 0;

function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

function toSummary(room: ChatRoomInternal): ChatRoomSummary {
  return {
    id: room.id,
    title: room.title,
    ownerUsername: room.ownerUsername,
    occupants: room.members.size,
    maxSize: room.maxSize,
    hasPassword: room.passwordHash !== null,
    x: room.x,
    y: room.y,
  };
}

function broadcastRoomList(io: Server): void {
  const payload: RoomListUpdatePayload = { rooms: Array.from(rooms.values()).map(toSummary) };
  io.to('hub').emit(EVENTS.ROOM_LIST_UPDATE, payload);
}

function memberSocketIds(room: ChatRoomInternal): string[] {
  return Array.from(room.members).flatMap(socketIdsFor);
}

function emitSnapshot(io: Server, room: ChatRoomInternal): void {
  const payload: RoomSnapshotPayload = { roomId: room.id, title: room.title, members: Array.from(room.members), maxSize: room.maxSize };
  memberSocketIds(room).forEach((id) => io.to(id).emit(EVENTS.ROOM_SNAPSHOT, payload));
}

function joinSocketRoom(io: Server, roomId: string, username: string): void {
  socketIdsFor(username).forEach((id) => io.sockets.sockets.get(id)?.join(roomChannel(roomId)));
}

function leaveSocketRoom(io: Server, roomId: string, username: string): void {
  socketIdsFor(username).forEach((id) => io.sockets.sockets.get(id)?.leave(roomChannel(roomId)));
}

/** Removes one member (leave, disconnect) — deletes the room entirely once
 *  it drops to 0 members, releasing the marker for everyone. */
function removeMember(io: Server, username: string | null): void {
  if (!username) return;
  const roomId = roomIdByUsername.get(username);
  if (!roomId) return;
  const room = rooms.get(roomId);
  roomIdByUsername.delete(username);
  leaveSocketRoom(io, roomId, username);
  // Tell the leaver's own client(s) they're out too — the snapshot below
  // only reaches whoever's still IN the room. No-op on a disconnect-
  // triggered removal (that socket's already gone from presence by then).
  const emptySnapshot: RoomSnapshotPayload = { roomId: null, title: '', members: [], maxSize: 0 };
  socketIdsFor(username).forEach((id) => io.to(id).emit(EVENTS.ROOM_SNAPSHOT, emptySnapshot));
  if (!room) return;
  room.members.delete(username);

  if (room.members.size === 0) {
    rooms.delete(roomId);
    broadcastRoomList(io);
    return;
  }
  sendSystemMessage(io, memberSocketIds(room), `${username} left the room.`);
  emitSnapshot(io, room);
  broadcastRoomList(io);
}

export function registerRoomHandlers(io: Server, socket: Socket, getUsername: () => string | null): void {
  socket.on(EVENTS.ROOM_CREATE, async (payload: RoomCreatePayload, ack: (res: RoomActionResult) => void) => {
    const username = getUsername();
    if (!username) { ack({ ok: false, error: 'error' }); return; }
    if (roomIdByUsername.has(username)) { ack({ ok: false, error: 'already-in-a-room' }); return; }
    const title = payload.title?.trim().slice(0, MAX_TITLE_LENGTH);
    if (!title) { ack({ ok: false, error: 'invalid-title' }); return; }
    const maxSize = Math.min(MAX_ROOM_SIZE, Math.max(MIN_ROOM_SIZE, Math.round(payload.maxSize)));

    const password = payload.password?.trim();
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const id = `room_${Date.now()}_${roomSeq++}`;
    const room: ChatRoomInternal = { id, title, ownerUsername: username, maxSize, passwordHash, members: new Set([username]), x: payload.x, y: payload.y };
    rooms.set(id, room);
    roomIdByUsername.set(username, id);
    joinSocketRoom(io, id, username);

    emitSnapshot(io, room);
    broadcastRoomList(io);
    ack({ ok: true });
  });

  socket.on(EVENTS.ROOM_JOIN, async (payload: RoomJoinPayload, ack: (res: RoomActionResult) => void) => {
    const username = getUsername();
    if (!username) { ack({ ok: false, error: 'error' }); return; }
    if (roomIdByUsername.has(username)) { ack({ ok: false, error: 'already-in-a-room' }); return; }
    const room = rooms.get(payload.roomId);
    if (!room) { ack({ ok: false, error: 'not-found' }); return; }
    if (room.members.size >= room.maxSize) { ack({ ok: false, error: 'full' }); return; }
    if (room.passwordHash) {
      const matches = await bcrypt.compare(payload.password ?? '', room.passwordHash);
      if (!matches) { ack({ ok: false, error: 'wrong-password' }); return; }
    }

    room.members.add(username);
    roomIdByUsername.set(username, room.id);
    joinSocketRoom(io, room.id, username);

    sendSystemMessage(io, memberSocketIds(room), `${username} joined the room.`);
    emitSnapshot(io, room);
    broadcastRoomList(io);
    ack({ ok: true });
  });

  socket.on(EVENTS.ROOM_LEAVE, () => removeMember(io, getUsername()));
  socket.on('disconnect', () => removeMember(io, getUsername()));

  socket.on(EVENTS.CHAT_ROOM_SEND, (payload: ChatSendPayload) => {
    const username = getUsername();
    const body = payload.body?.trim().slice(0, 300);
    if (!username || !body) return;
    const roomId = roomIdByUsername.get(username);
    if (!roomId) { sendSystemMessage(io, socketIdsFor(username), "You're not in a room."); return; }
    const msg: ChatMessage = { id: `msg-${Date.now()}-${msgSeq++}`, channel: 'room', from: username, body, ts: Date.now() };
    io.to(roomChannel(roomId)).emit(EVENTS.CHAT_MESSAGE, msg);
  });
}
