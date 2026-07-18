/**
 * Account-wide online registry — "is this username connected at all," as
 * opposed to hub.ts's presence (which only tracks who's visually standing in
 * Crown Haven City). Chat and party invites need this broader registry since
 * a Private Message or a party invite should reach someone out on the map or
 * mid-battle just as well as someone in the hub. A username can map to
 * multiple socket ids (e.g. two open tabs on a shared test account).
 */
const socketsByUsername = new Map<string, Set<string>>();

export function markOnline(username: string, socketId: string): void {
  const set = socketsByUsername.get(username) ?? new Set<string>();
  set.add(socketId);
  socketsByUsername.set(username, set);
}

export function markOffline(username: string, socketId: string): void {
  const set = socketsByUsername.get(username);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) socketsByUsername.delete(username);
}

export function socketIdsFor(username: string): string[] {
  return Array.from(socketsByUsername.get(username) ?? []);
}

export function isOnline(username: string): boolean {
  return socketsByUsername.has(username);
}
