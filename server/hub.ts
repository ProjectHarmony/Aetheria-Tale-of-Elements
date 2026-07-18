import type { Server, Socket } from 'socket.io';
import { EVENTS, type HubMovePayload, type HubPlayer, type HubSnapshotPayload } from '@/net/protocol';

/**
 * Hub presence — every socket currently standing in Crown Haven City joins
 * the 'hub' Socket.IO room; joining/moving/leaving just broadcasts within
 * that room. No relation to field/Adventure monster state at all (that
 * stays 100% client-local, untouched by this server — see the project plan).
 */
const hubPlayers = new Map<string, HubPlayer>();

export function registerHubHandlers(_io: Server, socket: Socket, getUsername: () => string | null): void {
  socket.on(EVENTS.HUB_JOIN, (payload: HubMovePayload) => {
    const userId = getUsername();
    if (!userId) {
      console.log(`[hub] join event ignored — socket ${socket.id} has no authenticated username`);
      return;
    }
    socket.join('hub');
    hubPlayers.set(socket.id, { userId, x: payload.x, y: payload.y, elementPreview: payload.elementPreview });
    const snapshot: HubSnapshotPayload = { players: Array.from(hubPlayers.values()).filter((p) => p.userId !== userId) };
    console.log(`[hub] "${userId}" joined — hub now has ${hubPlayers.size} player(s): ${Array.from(hubPlayers.values()).map((p) => p.userId).join(', ')}`);
    socket.emit(EVENTS.HUB_SNAPSHOT, snapshot);
    socket.to('hub').emit(EVENTS.HUB_PLAYER_MOVED, hubPlayers.get(socket.id));
  });

  socket.on(EVENTS.HUB_MOVE, (payload: HubMovePayload) => {
    const userId = getUsername();
    if (!userId || !hubPlayers.has(socket.id)) return;
    const player: HubPlayer = { userId, x: payload.x, y: payload.y, elementPreview: payload.elementPreview };
    hubPlayers.set(socket.id, player);
    socket.to('hub').emit(EVENTS.HUB_PLAYER_MOVED, player);
  });

  const leaveHub = () => {
    const player = hubPlayers.get(socket.id);
    if (!player) return;
    hubPlayers.delete(socket.id);
    socket.leave('hub');
    socket.to('hub').emit(EVENTS.HUB_PLAYER_LEFT, { userId: player.userId });
  };

  socket.on(EVENTS.HUB_LEAVE, leaveHub);
  socket.on('disconnect', leaveHub);
}
