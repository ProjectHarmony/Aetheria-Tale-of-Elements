import type { Server, Socket } from 'socket.io';
import {
  EVENTS,
  type PartyInvitePayload,
  type PartyInviteReceivedPayload,
  type PartyMemberStatus,
  type PartyRespondPayload,
  type PartySnapshotPayload,
  type PartyStatusPayload,
  type PartyStatusSendPayload,
} from '@/net/protocol';
import { socketIdsFor, isOnline } from './presence';
import { sendSystemMessage } from './systemMessage';

/**
 * The multiplayer player-group ("Party") — entirely separate from the
 * `Party` type used for a character's own single-mage build (src/types/party.ts),
 * no relation. Deliberately minimal: no leader/kick hierarchy, invites are
 * one-pending-per-recipient (a newer invite just replaces an older unanswered
 * one), and a group auto-disbands the moment it drops to 1 member — a lone
 * member isn't meaningfully "in a party." Membership is mirrored onto a
 * Socket.IO room (`party:<id>`) per member's socket(s), the same scalable
 * broadcast pattern hub.ts already uses for its 'hub' room, so Party Chat
 * (chat.ts) is a plain room emit rather than iterating every online player.
 */

interface Group {
  id: string;
  members: Set<string>;
}

export const MAX_PARTY_SIZE = 4;

const groups = new Map<string, Group>();
const groupIdByUsername = new Map<string, string>();
/** One outstanding invite per recipient — keyed by the invited username. */
const pendingInvites = new Map<string, string>();
/** Last-known name/level/HP per username — shown in the field Party List
 *  (see MapPage.tsx). Kept independent of group membership so a status that
 *  arrives moments before PARTY_ACCEPT finishes isn't lost, and so a fresh
 *  snapshot to a newly-joined member is never missing a stat any existing
 *  member has already reported. */
const statusByUsername = new Map<string, PartyMemberStatus>();
let groupSeq = 0;

export function roomFor(groupId: string): string {
  return `party:${groupId}`;
}

export function getGroupId(username: string): string | null {
  return groupIdByUsername.get(username) ?? null;
}

function memberSocketIds(group: Group): string[] {
  return Array.from(group.members).flatMap(socketIdsFor);
}

function emitSnapshot(io: Server, socketIds: string[], payload: PartySnapshotPayload): void {
  socketIds.forEach((id) => io.to(id).emit(EVENTS.PARTY_SNAPSHOT, payload));
}

function statusesFor(members: Iterable<string>): Record<string, PartyMemberStatus> {
  const statuses: Record<string, PartyMemberStatus> = {};
  for (const m of members) {
    const s = statusByUsername.get(m);
    if (s) statuses[m] = s;
  }
  return statuses;
}

function broadcastSnapshot(io: Server, groupId: string): void {
  const group = groups.get(groupId);
  if (!group) return;
  emitSnapshot(io, memberSocketIds(group), { groupId, members: Array.from(group.members), statuses: statusesFor(group.members) });
}

function joinRoomForMember(io: Server, groupId: string, username: string): void {
  socketIdsFor(username).forEach((id) => io.sockets.sockets.get(id)?.join(roomFor(groupId)));
}

function leaveRoomForMember(io: Server, groupId: string, username: string): void {
  socketIdsFor(username).forEach((id) => io.sockets.sockets.get(id)?.leave(roomFor(groupId)));
}

/** Removes one member (leave, decline-by-disconnect, etc.) — auto-disbands
 *  the group entirely once membership drops to 1, releasing whoever's left
 *  back to "not in a party" rather than leaving a stale 1-person group around. */
function removeMember(io: Server, username: string | null): void {
  if (!username) return;
  const groupId = groupIdByUsername.get(username);
  if (!groupId) return;
  const group = groups.get(groupId);
  groupIdByUsername.delete(username);
  leaveRoomForMember(io, groupId, username);
  // Tell the leaver's own client(s) they're out too — every other snapshot
  // below only reaches whoever's still IN the group, which by definition
  // excludes the person who just left. A no-op on a disconnect-triggered
  // removal (that socket's already gone from presence by then).
  emitSnapshot(io, socketIdsFor(username), { groupId: null, members: [], statuses: {} });
  if (!group) return;
  group.members.delete(username);

  if (group.members.size <= 1) {
    const remaining = Array.from(group.members);
    remaining.forEach((m) => {
      groupIdByUsername.delete(m);
      leaveRoomForMember(io, groupId, m);
    });
    const remainingSocketIds = remaining.flatMap(socketIdsFor);
    sendSystemMessage(io, remainingSocketIds, `${username} left the party. Your party has disbanded.`);
    emitSnapshot(io, remainingSocketIds, { groupId: null, members: [], statuses: {} });
    groups.delete(groupId);
  } else {
    sendSystemMessage(io, memberSocketIds(group), `${username} left the party.`);
    broadcastSnapshot(io, groupId);
  }
}

export function registerPartyHandlers(io: Server, socket: Socket, getUsername: () => string | null): void {
  socket.on(EVENTS.PARTY_INVITE, (payload: PartyInvitePayload) => {
    const username = getUsername();
    if (!username || !payload.toUsername || payload.toUsername === username) return;
    const toUsername = payload.toUsername.trim();

    if (!isOnline(toUsername)) { sendSystemMessage(io, socketIdsFor(username), `${toUsername} is not online.`); return; }
    if (groupIdByUsername.has(toUsername)) { sendSystemMessage(io, socketIdsFor(username), `${toUsername} is already in a party.`); return; }
    const ownGroupId = groupIdByUsername.get(username);
    if (ownGroupId && (groups.get(ownGroupId)?.members.size ?? 0) >= MAX_PARTY_SIZE) {
      sendSystemMessage(io, socketIdsFor(username), 'Your party is full.');
      return;
    }

    pendingInvites.set(toUsername, username);
    const received: PartyInviteReceivedPayload = { fromUsername: username };
    socketIdsFor(toUsername).forEach((id) => io.to(id).emit(EVENTS.PARTY_INVITE_RECEIVED, received));
    sendSystemMessage(io, socketIdsFor(username), `Invite sent to ${toUsername}.`);
  });

  socket.on(EVENTS.PARTY_ACCEPT, (payload: PartyRespondPayload) => {
    const username = getUsername();
    if (!username) return;
    if (pendingInvites.get(username) !== payload.fromUsername) return;
    pendingInvites.delete(username);
    const fromUsername = payload.fromUsername;

    const existingGroupId = groupIdByUsername.get(fromUsername) ?? groupIdByUsername.get(username) ?? null;
    let groupId: string;
    if (existingGroupId) {
      const group = groups.get(existingGroupId)!;
      if (group.members.size >= MAX_PARTY_SIZE) { sendSystemMessage(io, socketIdsFor(username), 'That party is full.'); return; }
      group.members.add(fromUsername);
      group.members.add(username);
      groupId = existingGroupId;
    } else {
      groupId = `grp_${Date.now()}_${groupSeq++}`;
      groups.set(groupId, { id: groupId, members: new Set([fromUsername, username]) });
    }
    groupIdByUsername.set(fromUsername, groupId);
    groupIdByUsername.set(username, groupId);
    joinRoomForMember(io, groupId, fromUsername);
    joinRoomForMember(io, groupId, username);

    broadcastSnapshot(io, groupId);
    sendSystemMessage(io, memberSocketIds(groups.get(groupId)!), `${username} joined the party.`);
  });

  socket.on(EVENTS.PARTY_DECLINE, (payload: PartyRespondPayload) => {
    const username = getUsername();
    if (!username) return;
    if (pendingInvites.get(username) !== payload.fromUsername) return;
    pendingInvites.delete(username);
    sendSystemMessage(io, socketIdsFor(payload.fromUsername), `${username} declined your party invite.`);
  });

  socket.on(EVENTS.PARTY_LEAVE, () => removeMember(io, getUsername()));
  socket.on('disconnect', () => removeMember(io, getUsername()));

  socket.on(EVENTS.PARTY_STATUS_SEND, (payload: PartyStatusSendPayload) => {
    const username = getUsername();
    if (!username) return;
    statusByUsername.set(username, payload);
    const groupId = groupIdByUsername.get(username);
    if (!groupId) return;
    const group = groups.get(groupId);
    if (!group) return;
    const msg: PartyStatusPayload = { username, ...payload };
    memberSocketIds(group).forEach((id) => io.to(id).emit(EVENTS.PARTY_STATUS, msg));
  });
}
