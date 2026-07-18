import { create } from 'zustand';
import type { ChatMessage } from '@/net/protocol';

const MAX_MESSAGES = 300;

export type ChatChannel = ChatMessage['channel'];

interface PendingInvite {
  fromUsername: string;
}

/** Only World/Party chat float a Ragnarok-style balloon over the sender's
 *  head on the map — Private stays private (no reason to broadcast it
 *  visually) and System isn't from a player at all. */
type BubbleChannel = 'world' | 'party';

export interface ChatBubble {
  body: string;
  channel: BubbleChannel;
  expiresAt: number;
}

/** How long a chat balloon lingers above a character's head before fading —
 *  matches the classic MMO "read it, then it's gone" balloon duration. */
const BUBBLE_DURATION_MS = 6000;

/** Pure relay of server-driven chat/party state — never persisted, mirrors
 *  hubStore.ts's style (this session's other "connected to a Socket.IO test
 *  server" store). Populated by src/net/chatSocket.ts's listeners. */
interface ChatState {
  messages: ChatMessage[];
  partyMembers: string[];
  pendingInvite: PendingInvite | null;
  activeTab: ChatChannel;
  privateTarget: string;
  unread: Record<ChatChannel, boolean>;
  /** Keyed by username — the map screen renders these above whichever
   *  sprite (self or another visible player) the username belongs to. */
  bubbles: Record<string, ChatBubble>;
  addMessage: (msg: ChatMessage) => void;
  setPartySnapshot: (members: string[]) => void;
  setPendingInvite: (invite: PendingInvite | null) => void;
  setActiveTab: (tab: ChatChannel) => void;
  setPrivateTarget: (target: string) => void;
  markRead: (channel: ChatChannel) => void;
  clear: () => void;
}

const NO_UNREAD: Record<ChatChannel, boolean> = { world: false, party: false, private: false, system: false };

function isBubbleChannel(channel: ChatChannel): channel is BubbleChannel {
  return channel === 'world' || channel === 'party';
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  partyMembers: [],
  pendingInvite: null,
  activeTab: 'world',
  privateTarget: '',
  unread: { ...NO_UNREAD },
  bubbles: {},

  addMessage: (msg) => {
    set((s) => ({
      messages: [...s.messages, msg].slice(-MAX_MESSAGES),
      unread: s.activeTab === msg.channel ? s.unread : { ...s.unread, [msg.channel]: true },
    }));
    if (isBubbleChannel(msg.channel)) {
      const expiresAt = Date.now() + BUBBLE_DURATION_MS;
      const channel = msg.channel;
      set((s) => ({ bubbles: { ...s.bubbles, [msg.from]: { body: msg.body, channel, expiresAt } } }));
      setTimeout(() => {
        // A newer message from the same sender may have already replaced
        // this bubble with a later expiry — only clear our own.
        if (get().bubbles[msg.from]?.expiresAt !== expiresAt) return;
        set((s) => {
          const next = { ...s.bubbles };
          delete next[msg.from];
          return { bubbles: next };
        });
      }, BUBBLE_DURATION_MS);
    }
  },
  setPartySnapshot: (members) => set({ partyMembers: members }),
  setPendingInvite: (invite) => set({ pendingInvite: invite }),
  setActiveTab: (tab) => set((s) => ({ activeTab: tab, unread: { ...s.unread, [tab]: false } })),
  setPrivateTarget: (target) => set({ privateTarget: target }),
  markRead: (channel) => set((s) => ({ unread: { ...s.unread, [channel]: false } })),
  clear: () => set({ messages: [], partyMembers: [], pendingInvite: null, unread: { ...NO_UNREAD }, bubbles: {} }),
}));
