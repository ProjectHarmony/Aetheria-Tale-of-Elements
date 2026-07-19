import { create } from 'zustand';
import type { ChatRoomSummary } from '@/net/protocol';

interface ActiveRoom {
  roomId: string;
  title: string;
  members: string[];
  maxSize: number;
}

/** Pure relay of server-driven room state — never persisted, same "connected
 *  to the Socket.IO test server" style as hubStore.ts/chatStore.ts. `rooms`
 *  is the hub-wide marker listing (every open room, whether you're in it or
 *  not); `activeRoom` is populated only once you've created or joined one. */
interface RoomState {
  rooms: ChatRoomSummary[];
  activeRoom: ActiveRoom | null;
  setRoomList: (rooms: ChatRoomSummary[]) => void;
  setActiveRoom: (room: ActiveRoom | null) => void;
  clear: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  setRoomList: (rooms) => set({ rooms }),
  setActiveRoom: (room) => set({ activeRoom: room }),
  clear: () => set({ rooms: [], activeRoom: null }),
}));
