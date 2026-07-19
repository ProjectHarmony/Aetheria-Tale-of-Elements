import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useChatStore, type ChatChannel } from '@/stores/chatStore';
import { useRoomStore } from '@/stores/roomStore';
import { isServerConfigured } from '@/net/accountSync';
import { isTypingTarget } from '@/utils/dom';
import {
  acceptPartyInvite,
  declinePartyInvite,
  invitePlayer,
  leaveParty,
  sendPartyMessage,
  sendPrivateMessage,
  sendWorldMessage,
} from '@/net/chatSocket';
import { leaveRoom, sendRoomMessage } from '@/net/roomSocket';

const TAB_META: Record<ChatChannel, { label: string; icon: string }> = {
  world: { label: 'World', icon: '🌐' },
  party: { label: 'Party', icon: '🧑‍🤝‍🧑' },
  private: { label: 'Private', icon: '✉️' },
  system: { label: 'System', icon: '📣' },
  room: { label: 'Room', icon: '🗨️' },
};

/** Floating chat bubble + panel — mounted once inside ResponsiveShell so
 *  it's available on every page a logged-in character can reach, without
 *  wiring it into each page individually. Self-guards to nothing when
 *  there's no user or no test server configured (same "invisible no-op"
 *  precedent accountSync.ts already establishes for offline play). */
export function ChatPanel() {
  const user = useGameStore((s) => s.user);
  const messages = useChatStore((s) => s.messages);
  const partyMembers = useChatStore((s) => s.partyMembers);
  const pendingInvite = useChatStore((s) => s.pendingInvite);
  const activeTab = useChatStore((s) => s.activeTab);
  const privateTarget = useChatStore((s) => s.privateTarget);
  const unread = useChatStore((s) => s.unread);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const setPrivateTarget = useChatStore((s) => s.setPrivateTarget);
  const setPendingInvite = useChatStore((s) => s.setPendingInvite);
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const open = useChatStore((s) => s.isOpen);
  const setOpen = useChatStore((s) => s.setOpen);
  const toggleOpen = useChatStore((s) => s.toggleOpen);

  const [draft, setDraft] = useState('');
  const [inviteTarget, setInviteTarget] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter (main row or numpad — both report key: 'Enter') opens the chat
  // panel and focuses the message box, same as most MMOs' chat shortcut;
  // Escape closes it again, from anywhere (not just while the input itself
  // is focused). Enter is skipped while already typing into some other
  // field (name entry, item search, etc.) so it doesn't hijack unrelated
  // forms — Escape isn't, since backing out of a form with Escape is normal
  // too and closing the chat underneath it is harmless either way.
  useEffect(() => {
    if (!user || !isServerConfigured()) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Enter' || isTypingTarget(document.activeElement)) return;
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [user, setOpen]);

  if (!user || !isServerConfigured()) return null;

  const inParty = partyMembers.length > 0;
  const inRoom = !!activeRoom;
  const hasUnread = Object.values(unread).some(Boolean);
  const visible = messages.filter((m) => m.channel === activeTab);
  const inputDisabled = (activeTab === 'party' && !inParty) || (activeTab === 'room' && !inRoom);

  function send() {
    const body = draft.trim();
    if (!body) return;
    if (activeTab === 'world') sendWorldMessage(body);
    else if (activeTab === 'party') { if (!inParty) return; sendPartyMessage(body); }
    else if (activeTab === 'private') { if (!privateTarget.trim()) return; sendPrivateMessage(privateTarget.trim(), body); }
    else if (activeTab === 'room') { if (!inRoom) return; sendRoomMessage(body); }
    else return;
    setDraft('');
  }

  return (
    <>
      <button
        onClick={() => toggleOpen()}
        className="absolute bottom-3 right-3 z-[300] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#241a30]/85 text-lg backdrop-blur-md"
      >
        💬
        {hasUnread && !open && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-3 z-[300] flex h-[min(380px,65svh)] w-[min(270px,88vw)] flex-col overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[#1a1330]/95 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <div className="font-['Baloo_2'] text-[12px] font-extrabold text-[#fff8f0]">💬 Chat</div>
              <button onClick={() => setOpen(false)} className="text-white/40">✕</button>
            </div>

            <div className="flex gap-1 border-b border-white/10 p-1.5">
              {(Object.keys(TAB_META) as ChatChannel[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  title={TAB_META[tab].label}
                  className={`relative flex-1 rounded-lg py-1 text-[11px] font-bold ${activeTab === tab ? 'bg-[#241a30] text-[#fff8f0]' : 'text-white/45'}`}
                >
                  {TAB_META[tab].icon}
                  {unread[tab] && <span className="absolute right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />}
                </button>
              ))}
            </div>

            {pendingInvite && (
              <div className="flex items-center justify-between gap-1.5 border-b border-white/10 bg-[var(--color-gold)]/10 px-2.5 py-2 text-[9.5px]">
                <span className="flex-1 font-semibold leading-snug text-[#fff8f0]">{pendingInvite.fromUsername} invited you to their party.</span>
                <button
                  onClick={() => { acceptPartyInvite(pendingInvite.fromUsername); setPendingInvite(null); }}
                  className="flex-shrink-0 rounded-md bg-[var(--color-success)] px-2 py-1 font-extrabold text-[#06281a]"
                >
                  ✓
                </button>
                <button
                  onClick={() => { declinePartyInvite(pendingInvite.fromUsername); setPendingInvite(null); }}
                  className="flex-shrink-0 rounded-md border border-white/20 px-2 py-1 font-extrabold text-white/60"
                >
                  ✕
                </button>
              </div>
            )}

            {activeTab === 'party' && !inParty && (
              <div className="flex items-center gap-1.5 border-b border-white/10 p-2">
                <input
                  value={inviteTarget}
                  onChange={(e) => setInviteTarget(e.target.value)}
                  placeholder="Invite by name…"
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/25 px-2 py-1 text-[10px] text-white outline-none"
                />
                <button
                  onClick={() => { if (inviteTarget.trim()) { invitePlayer(inviteTarget.trim()); setInviteTarget(''); } }}
                  className="flex-shrink-0 rounded-md bg-[var(--color-gold)] px-2 py-1 text-[9.5px] font-extrabold text-[var(--color-gold-deep)]"
                >
                  Invite
                </button>
              </div>
            )}
            {activeTab === 'party' && inParty && (
              <div className="flex items-center justify-between gap-1.5 border-b border-white/10 px-2 py-1.5 text-[9.5px] text-white/50">
                <span className="min-w-0 flex-1 truncate">Party: {partyMembers.join(', ')}</span>
                <button onClick={() => leaveParty()} className="flex-shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 font-bold text-white/60">
                  Leave
                </button>
              </div>
            )}
            {activeTab === 'private' && (
              <div className="border-b border-white/10 p-2">
                <input
                  value={privateTarget}
                  onChange={(e) => setPrivateTarget(e.target.value)}
                  placeholder="To: username…"
                  className="w-full rounded-md border border-white/15 bg-black/25 px-2 py-1 text-[10px] text-white outline-none"
                />
              </div>
            )}
            {activeTab === 'room' && !inRoom && (
              <div className="border-b border-white/10 px-2.5 py-2 text-[9.5px] leading-snug text-white/45">
                Look for a 🗨️ room marker in Crown Haven, or tap "Create Room" there to start your own.
              </div>
            )}
            {activeTab === 'room' && activeRoom && (
              <div className="flex items-center justify-between gap-1.5 border-b border-white/10 px-2 py-1.5 text-[9.5px] text-white/50">
                <span className="min-w-0 flex-1 truncate">
                  {activeRoom.title} ({activeRoom.members.length}/{activeRoom.maxSize}): {activeRoom.members.join(', ')}
                </span>
                <button onClick={() => leaveRoom()} className="flex-shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 font-bold text-white/60">
                  Leave
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2.5 py-2">
              {visible.length === 0 ? (
                <div className="pt-6 text-center text-[9.5px] text-white/30">
                  {activeTab === 'party' && !inParty
                    ? "You're not in a party."
                    : activeTab === 'room' && !inRoom
                      ? "You're not in a room."
                      : 'No messages yet.'}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {visible.map((m) => (
                    <div key={m.id} className="text-[10px] leading-snug">
                      {m.channel === 'system' ? (
                        <span className="text-white/40">{m.body}</span>
                      ) : (
                        <>
                          <span className="font-bold" style={{ color: m.from === user ? 'var(--color-gold)' : '#9ecbff' }}>
                            {m.from === user ? 'You' : m.from}
                          </span>
                          {m.channel === 'private' && m.to && <span className="text-white/35"> → {m.to === user ? 'you' : m.to}</span>}
                          <span className="text-white/40">: </span>
                          <span className="text-white/85">{m.body}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeTab !== 'system' && (
              <div className="flex items-center gap-1.5 border-t border-white/10 p-2">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  placeholder={inputDisabled ? (activeTab === 'room' ? 'Join a room to chat…' : 'Join a party to chat…') : 'Message…'}
                  disabled={inputDisabled}
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/25 px-2 py-1.5 text-[10px] text-white outline-none disabled:opacity-40"
                />
                <button
                  onClick={send}
                  disabled={inputDisabled}
                  className="flex-shrink-0 rounded-md px-2.5 py-1.5 text-[9.5px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
                >
                  Send
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
