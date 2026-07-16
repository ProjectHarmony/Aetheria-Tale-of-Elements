import { useHubStore } from '@/stores/hubStore';
import { EVENTS, type HubMovePayload, type HubPlayer, type HubSnapshotPayload } from './protocol';
import { getSocket } from './socket';

/** Wires the hub-presence socket events into hubStore — set up once,
 *  lazily, the first time MapPage actually needs it (no-ops entirely if no
 *  server is connected, since getSocket() is null in that case). */
let listenersWired = false;
function wireListeners(): void {
  if (listenersWired) return;
  const socket = getSocket();
  if (!socket) return;
  listenersWired = true;
  socket.on(EVENTS.HUB_SNAPSHOT, (payload: HubSnapshotPayload) => useHubStore.getState().setSnapshot(payload.players));
  socket.on(EVENTS.HUB_PLAYER_MOVED, (player: HubPlayer) => useHubStore.getState().upsertPlayer(player));
  socket.on(EVENTS.HUB_PLAYER_LEFT, (payload: { userId: string }) => useHubStore.getState().removePlayer(payload.userId));
}

export function joinHub(x: number, y: number, elementPreview: string | null): void {
  const socket = getSocket();
  if (!socket) return;
  wireListeners();
  const payload: HubMovePayload = { x, y, elementPreview };
  socket.emit(EVENTS.HUB_JOIN, payload);
}

export function moveHub(x: number, y: number, elementPreview: string | null): void {
  const socket = getSocket();
  if (!socket) return;
  const payload: HubMovePayload = { x, y, elementPreview };
  socket.emit(EVENTS.HUB_MOVE, payload);
}

export function leaveHub(): void {
  const socket = getSocket();
  useHubStore.getState().clear();
  if (!socket) return;
  socket.emit(EVENTS.HUB_LEAVE);
}
