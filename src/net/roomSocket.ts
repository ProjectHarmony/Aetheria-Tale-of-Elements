import type { Socket } from 'socket.io-client';
import { useRoomStore } from '@/stores/roomStore';
import { useChatStore } from '@/stores/chatStore';
import { EVENTS } from './protocol';
import type {
  ChatSendPayload,
  RoomActionResult,
  RoomCreatePayload,
  RoomJoinPayload,
  RoomListUpdatePayload,
  RoomSnapshotPayload,
} from './protocol';
import { emitWithAck, getSocket } from './socket';

let wiredSocket: Socket | null = null;

/** Attaches room listeners onto the given socket exactly once — called from
 *  accountSync.ts's seedFromServer right alongside wireChatSocket. */
export function wireRoomSocket(socket: Socket): void {
  if (wiredSocket === socket) return;
  wiredSocket = socket;
  const { setRoomList, setActiveRoom } = useRoomStore.getState();

  socket.on(EVENTS.ROOM_LIST_UPDATE, (payload: RoomListUpdatePayload) => setRoomList(payload.rooms));
  socket.on(EVENTS.ROOM_SNAPSHOT, (payload: RoomSnapshotPayload) => {
    if (!payload.roomId) { setActiveRoom(null); return; }
    // Entering a DIFFERENT room than whatever was active before (a fresh
    // create/join, not just an occupant-list update for the same room) —
    // the old room's chat history doesn't belong here, or it'd read as if
    // it were part of this new room's conversation.
    const prevRoomId = useRoomStore.getState().activeRoom?.roomId ?? null;
    if (payload.roomId !== prevRoomId) useChatStore.getState().clearChannel('room');
    setActiveRoom({ roomId: payload.roomId, title: payload.title, members: payload.members, maxSize: payload.maxSize });
  });
}

export function createRoom(title: string, maxSize: number, x: number, y: number, password?: string): Promise<RoomActionResult> {
  return emitWithAck<RoomCreatePayload, RoomActionResult>(EVENTS.ROOM_CREATE, { title, maxSize, x, y, password });
}

export function joinRoom(roomId: string, password?: string): Promise<RoomActionResult> {
  return emitWithAck<RoomJoinPayload, RoomActionResult>(EVENTS.ROOM_JOIN, { roomId, password });
}

export function leaveRoom(): void {
  getSocket()?.emit(EVENTS.ROOM_LEAVE);
}

export function sendRoomMessage(body: string): void {
  getSocket()?.emit(EVENTS.CHAT_ROOM_SEND, { body } satisfies ChatSendPayload);
}
