import type { Server } from 'socket.io';
import { EVENTS, type ChatMessage } from '@/net/protocol';

let seq = 0;

/** Sends a channel:'system' chat message to a specific list of socket ids
 *  (never a room broadcast) — used for invite confirmations, offline
 *  notices, and party join/leave/disband notices. Lives in its own tiny
 *  module so both chat.ts and party.ts can share it without importing from
 *  each other (chat.ts needs party.ts's group lookup for Party Chat; a
 *  shared helper here avoids that becoming a circular import). */
export function sendSystemMessage(io: Server, socketIds: string[], body: string): void {
  if (socketIds.length === 0) return;
  const msg: ChatMessage = { id: `sys-${Date.now()}-${seq++}`, channel: 'system', from: 'System', body, ts: Date.now() };
  socketIds.forEach((id) => io.to(id).emit(EVENTS.CHAT_MESSAGE, msg));
}
