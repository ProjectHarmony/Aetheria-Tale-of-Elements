import { createServer } from 'node:http';
import os from 'node:os';
import { Server } from 'socket.io';
import { EVENTS, type AuthRequest, type AuthResponse, type SavePushPayload } from '@/net/protocol';
import { loadAccounts, loginAccount, registerAccount, saveAccountData } from './accounts';
import { registerHubHandlers } from './hub';
import { registerChatHandlers, WORLD_ROOM } from './chat';
import { registerPartyHandlers } from './party';
import { markOffline, markOnline } from './presence';

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  await loadAccounts();

  const httpServer = createServer();
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log(`[connect] socket ${socket.id} connected from ${socket.handshake.address}`);
    // Each socket tracks which account (if any) it authenticated as — the
    // whole-blob save sync and hub presence both need this, and neither
    // trusts a client-supplied username on later events, only this.
    let authedUsername: string | null = null;

    socket.on(EVENTS.AUTH_REGISTER, async (payload: AuthRequest, ack: (res: AuthResponse) => void) => {
      const result = await registerAccount(payload.username, payload.password);
      if (!result.ok) { console.log(`[auth] register failed for "${payload.username}": ${result.error}`); return ack(result); }
      authedUsername = payload.username.trim();
      console.log(`[auth] "${authedUsername}" registered on socket ${socket.id}`);
      socket.join(WORLD_ROOM);
      markOnline(authedUsername, socket.id);
      ack({ ok: true, username: authedUsername, party: null, inventory: {}, aeons: 0 });
    });

    socket.on(EVENTS.AUTH_LOGIN, async (payload: AuthRequest, ack: (res: AuthResponse) => void) => {
      const result = await loginAccount(payload.username, payload.password);
      if (!result.ok) { console.log(`[auth] login failed for "${payload.username}": ${result.error}`); return ack(result); }
      authedUsername = payload.username.trim();
      console.log(`[auth] "${authedUsername}" logged in on socket ${socket.id}`);
      socket.join(WORLD_ROOM);
      markOnline(authedUsername, socket.id);
      const { party, inventory, aeons } = result.account;
      ack({ ok: true, username: authedUsername, party, inventory, aeons });
    });

    socket.on(EVENTS.SAVE_PUSH, (payload: SavePushPayload) => {
      if (!authedUsername) return;
      saveAccountData(authedUsername, payload);
    });

    socket.on('disconnect', () => { if (authedUsername) markOffline(authedUsername, socket.id); });

    registerHubHandlers(io, socket, () => authedUsername);
    registerChatHandlers(io, socket, () => authedUsername);
    registerPartyHandlers(io, socket, () => authedUsername);
  });

  httpServer.listen(PORT, () => {
    const nets = os.networkInterfaces();
    const addresses = Object.values(nets)
      .flat()
      .filter((n): n is NonNullable<typeof n> => !!n && n.family === 'IPv4' && !n.internal)
      .map((n) => n.address);

    console.log(`\nAetheria test server listening on port ${PORT}`);
    console.log(`  Local:   http://localhost:${PORT}`);
    addresses.forEach((addr) => console.log(`  Network: http://${addr}:${PORT}`));
    console.log('\nHand the "Network" URL to your other testers — paste it into the Server URL field on the login screen.\n');
  });
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
