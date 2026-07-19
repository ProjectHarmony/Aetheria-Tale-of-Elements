import { io, type Socket } from 'socket.io-client';

/**
 * Lazy Socket.IO connection to the user's own test server (see server/index.ts).
 * Entirely optional — if no Server URL has ever been set, `getSocket()` stays
 * null and every feature that depends on it (account sync, hub presence) just
 * no-ops, leaving the game exactly as fully-local/offline as it is today.
 */
const SERVER_URL_KEY = 'aetheria-server-url';

let socket: Socket | null = null;
let connectedUrl: string | null = null;

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) ?? '';
}

export function setServerUrl(url: string): void {
  const trimmed = url.trim();
  if (trimmed) localStorage.setItem(SERVER_URL_KEY, trimmed);
  else localStorage.removeItem(SERVER_URL_KEY);
}

/** Connects (or reuses an existing connection) to the given URL — returns
 *  null if the URL is blank, so callers can treat "no server configured" as
 *  a normal, silent no-op rather than an error. */
export function connectToServer(url: string): Socket | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (socket && connectedUrl === trimmed) return socket;
  if (socket) socket.disconnect();
  socket = io(trimmed, { autoConnect: true, reconnection: true });
  connectedUrl = trimmed;
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

/** Promise-wrapped emit-with-acknowledgement — Socket.IO's ack callback as a
 *  promise, plus a timeout. Without one, an unreachable server (wrong URL,
 *  server not running) leaves the emit buffered forever waiting for an ack
 *  that will never come — the promise never settles, so callers like
 *  AuthPage's submit() get stuck on "Connecting…" with no error shown. */
export function emitWithAck<TReq, TRes>(event: string, payload: TReq, timeoutMs = 6000): Promise<TRes> {
  return new Promise((resolve, reject) => {
    if (!socket) { reject(new Error('Not connected to a server.')); return; }
    socket.timeout(timeoutMs).emit(event, payload, (err: Error | null, res: TRes) => {
      if (err) { reject(err); return; }
      resolve(res);
    });
  });
}
