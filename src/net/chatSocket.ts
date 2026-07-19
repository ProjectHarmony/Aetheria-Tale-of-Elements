import type { Socket } from 'socket.io-client';
import { useChatStore } from '@/stores/chatStore';
import { useGameStore } from '@/stores/gameStore';
import { derivedStatsFor } from '@/systems/battle';
import { HERO_NAMES } from '@/constants';
import { EVENTS } from './protocol';
import type {
  ChatMessage,
  ChatPrivateSendPayload,
  ChatSendPayload,
  PartyInvitePayload,
  PartyInviteReceivedPayload,
  PartyMemberStatus,
  PartyRespondPayload,
  PartySnapshotPayload,
  PartyStatusPayload,
  PartyStatusSendPayload,
} from './protocol';
import { getSocket } from './socket';

let wiredSocket: Socket | null = null;
let statusSyncStarted = false;
/** Tracks which group's snapshots we've last seen — lets the listener below
 *  tell "still the same party, just an updated member/status list" apart
 *  from "a genuinely different party" (left one, later joined another),
 *  which is the case that needs the old party's chat history cleared. */
let lastPartyGroupId: string | null = null;

function ownStatus(): PartyMemberStatus | null {
  const { party } = useGameStore.getState();
  const el = party?.picks[0];
  if (!party || !el) return null;
  const mage = party.mages[el];
  if (!mage) return null;
  const d = derivedStatsFor(el, mage);
  const hp = Math.max(0, Math.min(d.maxHp, mage.currentHp ?? d.maxHp));
  return { name: party.characterName || HERO_NAMES[el], level: mage.level, hp, maxHp: Math.round(d.maxHp) };
}

function pushOwnStatus(): void {
  const status = ownStatus();
  if (status) sendPartyStatus(status);
}

/** Pushes the local player's own name/level/HP to the party room whenever it
 *  changes (level-up, HP change after a battle) — debounced like
 *  accountSync.ts's own save-sync subscription, and skipped entirely while
 *  not in a multiplayer party (nothing to broadcast to). */
function startPartyStatusSync(): void {
  if (statusSyncStarted) return;
  statusSyncStarted = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  useGameStore.subscribe((state, prev) => {
    if (state.party === prev.party) return;
    if (useChatStore.getState().partyMembers.length === 0) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(pushOwnStatus, 500);
  });
}

/** Attaches chat/party listeners onto the given socket exactly once — called
 *  from accountSync.ts's seedFromServer right alongside its own debounced
 *  save-sync wiring, guarded so re-logging-in on the same connection doesn't
 *  double-attach the same listeners. */
export function wireChatSocket(socket: Socket): void {
  if (wiredSocket === socket) return;
  wiredSocket = socket;
  const { addMessage, setPartySnapshot, setPartyMemberStatus, setPendingInvite } = useChatStore.getState();

  socket.on(EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => addMessage(msg));
  socket.on(EVENTS.PARTY_SNAPSHOT, (snapshot: PartySnapshotPayload) => {
    if (snapshot.groupId !== lastPartyGroupId) {
      useChatStore.getState().clearChannel('party');
      lastPartyGroupId = snapshot.groupId;
    }
    setPartySnapshot(snapshot.members, snapshot.statuses);
    // Just joined (or reconnected mid-party) — push our own status right
    // away instead of waiting for the next unrelated party/mage change to
    // trip the debounced sync below.
    if (snapshot.members.length > 0) pushOwnStatus();
  });
  socket.on(EVENTS.PARTY_STATUS, (payload: PartyStatusPayload) => setPartyMemberStatus(payload.username, payload));
  socket.on(EVENTS.PARTY_INVITE_RECEIVED, (payload: PartyInviteReceivedPayload) => setPendingInvite({ fromUsername: payload.fromUsername }));
  startPartyStatusSync();
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

export function sendPartyStatus(status: PartyStatusSendPayload): void {
  getSocket()?.emit(EVENTS.PARTY_STATUS_SEND, status);
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
