import { useGameStore } from '@/stores/gameStore';
import { STARTING_RESPEC_TOKENS } from '@/constants';
import { EVENTS } from './protocol';
import type { AuthRequest, AuthResponse, SavePushPayload } from './protocol';
import { connectToServer, emitWithAck, getServerUrl } from './socket';
import { wireChatSocket } from './chatSocket';

/**
 * Server-mode auth + save sync — only ever engaged when a Server URL has
 * been entered on the login screen (see AuthPage.tsx). Seeds gameStore's
 * `user`/`party`/`inventory`/`aeons` from the server's response, then keeps
 * a debounced subscription pushing the whole blob back on every change —
 * "last write wins," simple by design for a 5-person test rig (see the
 * project plan's rationale). `accounts[username]` is still populated
 * locally purely so unrelated local-only logic (e.g. respec token checks)
 * doesn't crash reading it; respec tokens themselves are NOT synced across
 * devices in this pass.
 */

let syncStarted = false;

function startDebouncedSync(): void {
  if (syncStarted) return;
  syncStarted = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  useGameStore.subscribe((state, prev) => {
    if (state.party === prev.party && state.inventory === prev.inventory && state.aeons === prev.aeons) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const socket = connectToServer(getServerUrl());
      if (!socket) return;
      const { party, inventory, aeons } = useGameStore.getState();
      const payload: SavePushPayload = { party, inventory, aeons };
      socket.emit(EVENTS.SAVE_PUSH, payload);
    }, 1000);
  });
}

function seedFromServer(res: Extract<AuthResponse, { ok: true }>): void {
  useGameStore.setState((s) => ({
    user: res.username,
    party: res.party,
    inventory: res.inventory,
    aeons: res.aeons,
    accounts: { ...s.accounts, [res.username]: s.accounts[res.username] ?? { password: '', respecTokens: STARTING_RESPEC_TOKENS } },
  }));
  startDebouncedSync();
  const socket = connectToServer(getServerUrl());
  if (socket) wireChatSocket(socket);
}

export function isServerConfigured(): boolean {
  return !!getServerUrl();
}

export async function registerOverServer(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const socket = connectToServer(getServerUrl());
  if (!socket) return { ok: false, error: 'No server configured.' };
  const req: AuthRequest = { username, password };
  const res = await emitWithAck<AuthRequest, AuthResponse>(EVENTS.AUTH_REGISTER, req);
  if (!res.ok) return res;
  seedFromServer(res);
  return { ok: true };
}

export async function loginOverServer(username: string, password: string): Promise<{ ok: true; hasParty: boolean } | { ok: false; error: string }> {
  const socket = connectToServer(getServerUrl());
  if (!socket) return { ok: false, error: 'No server configured.' };
  const req: AuthRequest = { username, password };
  const res = await emitWithAck<AuthRequest, AuthResponse>(EVENTS.AUTH_LOGIN, req);
  if (!res.ok) return res;
  seedFromServer(res);
  return { ok: true, hasParty: !!res.party };
}
