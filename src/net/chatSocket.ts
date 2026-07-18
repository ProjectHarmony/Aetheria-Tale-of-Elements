import type { Socket } from 'socket.io-client';
import { useChatStore } from '@/stores/chatStore';
import { EVENTS } from './protocol';
import type {
  ChatMessage,
  ChatPrivateSendPayload,
  ChatSendPayload,
  PartyInvitePayload,
  PartyInviteReceivedPayload,
  PartyRespondPayload,
  PartySnapshotPayload,
} from './protocol';
import { getSocket } from './socket';

let wiredSocket: Socket | null = null;

/** Attaches chat/party listeners onto the given socket exactly once — called
 *  from accountSync.ts's seedFromServer right alongside its own debounced
 *  save-sync wiring, guarded so re-logging-in on the same connection doesn't
 *  double-attach the same listeners. */
export function wireChatSocket(socket: Socket): void {
  if (wiredSocket === socket) return;
  wiredSocket = socket;
  const { addMessage, setPartySnapshot, setPendingInvite } = useChatStore.getState();

  socket.on(EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => addMessage(msg));
  socket.on(EVENTS.PARTY_SNAPSHOT, (snapshot: PartySnapshotPayload) => setPartySnapshot(snapshot.members));
  socket.on(EVENTS.PARTY_INVITE_RECEIVED, (payload: PartyInviteReceivedPayload) => setPendingInvite({ fromUsername: payload.fromUsername }));
}

export function sendWorldMessage(body: string): void {
  getSocket()?.emit(EVENTS.CHAT_WORLD_SEND, { body } satisfies ChatSendPayload);
}

export function sendPartyMessage(body: string): void {
  getSocket()?.emit(EVENTS.CHAT_PARTY_SEND, { body } satisfies ChatSendPayload);
}

export function sendPrivateMessage(toUsername: string, body: string): void {
  getSocket()?.emit(EVENTS.CHAT_PRIVATE_SEND, { toUsername, body } satisfies ChatPrivateSendPayload);
}

export function invitePlayer(toUsername: string): void {
  getSocket()?.emit(EVENTS.PARTY_INVITE, { toUsername } satisfies PartyInvitePayload);
}

export function acceptPartyInvite(fromUsername: string): void {
  getSocket()?.emit(EVENTS.PARTY_ACCEPT, { fromUsername } satisfies PartyRespondPayload);
}

export function declinePartyInvite(fromUsername: string): void {
  getSocket()?.emit(EVENTS.PARTY_DECLINE, { fromUsername } satisfies PartyRespondPayload);
}

export function leaveParty(): void {
  getSocket()?.emit(EVENTS.PARTY_LEAVE);
}
