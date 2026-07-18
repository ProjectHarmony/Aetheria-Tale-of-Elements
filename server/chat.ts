import type { Server, Socket } from 'socket.io';
import { EVENTS, type ChatMessage, type ChatPrivateSendPayload, type ChatSendPayload } from '@/net/protocol';
import { socketIdsFor } from './presence';
import { getGroupId, roomFor } from './party';
import { sendSystemMessage } from './systemMessage';

/** Every authenticated socket auto-joins this room (see index.ts) so World
 *  Chat is a plain room broadcast, same scalable pattern as hub.ts's 'hub'
 *  room and party.ts's per-group rooms — never an iterate-every-socket loop. */
export const WORLD_ROOM = 'world';

const MAX_MESSAGE_LENGTH = 300;
let seq = 0;

function makeMessage(channel: ChatMessage['channel'], from: string, body: string, to?: string): ChatMessage {
  return { id: `msg-${Date.now()}-${seq++}`, channel, from, to, body, ts: Date.now() };
}

/** Trims and length-caps a chat body; returns null if there's nothing to send. */
function sanitize(body: string): string | null {
  const trimmed = body.trim().slice(0, MAX_MESSAGE_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function registerChatHandlers(io: Server, socket: Socket, getUsername: () => string | null): void {
  socket.on(EVENTS.CHAT_WORLD_SEND, (payload: ChatSendPayload) => {
    const username = getUsername();
    const body = sanitize(payload.body ?? '');
    if (!username || !body) return;
    io.to(WORLD_ROOM).emit(EVENTS.CHAT_MESSAGE, makeMessage('world', username, body));
  });

  socket.on(EVENTS.CHAT_PARTY_SEND, (payload: ChatSendPayload) => {
    const username = getUsername();
    const body = sanitize(payload.body ?? '');
    if (!username || !body) return;
    const groupId = getGroupId(username);
    if (!groupId) { sendSystemMessage(io, socketIdsFor(username), "You're not in a party."); return; }
    io.to(roomFor(groupId)).emit(EVENTS.CHAT_MESSAGE, makeMessage('party', username, body));
  });

  socket.on(EVENTS.CHAT_PRIVATE_SEND, (payload: ChatPrivateSendPayload) => {
    const username = getUsername();
    const body = sanitize(payload.body ?? '');
    if (!username || !body || !payload.toUsername) return;
    const toUsername = payload.toUsername.trim();
    const targetSocketIds = socketIdsFor(toUsername);
    if (targetSocketIds.length === 0) {
      sendSystemMessage(io, socketIdsFor(username), `${toUsername} is offline.`);
      return;
    }
    const msg = makeMessage('private', username, body, toUsername);
    // Delivered to both sides' sockets — the sender's own tabs need it too so
    // their own sent message shows up in their Private log (not just the
    // recipient's), since there's no separate "sent items" echo elsewhere.
    [...targetSocketIds, ...socketIdsFor(username)].forEach((id) => io.to(id).emit(EVENTS.CHAT_MESSAGE, msg));
  });
}
