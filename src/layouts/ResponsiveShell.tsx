import type { ReactNode } from 'react';
import { ChatPanel } from '@/features/chat';

/**
 * Three-tier responsive shell (single DOM tree — children mount once, only
 * layout classes change with viewport, so stateful children like
 * BattleScreen never get double-mounted):
 *
 *  - <640px  (real phones): full-bleed, no bezel — maximize usable space.
 *  - 640–1024px (tablet / narrow desktop window): the original's phone-card
 *    mockup, centered — a deliberate nod to where this game came from.
 *  - >=1024px (desktop): a wide adaptive panel with room for BattleScreen's
 *    side-by-side desktop layout (see BattleScreen.tsx's `lg:` variants).
 */
export function ResponsiveShell({ children }: { children: ReactNode }) {
  return (
    <div className="pastel-sky flex h-svh w-full items-center justify-center overflow-hidden">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-black
                   sm:h-[800px] sm:max-h-[96svh] sm:w-[390px] sm:rounded-[40px] sm:p-2.5 sm:shadow-[0_40px_90px_-20px_rgba(0,0,0,0.5)]
                   lg:h-[780px] lg:max-h-[92svh] lg:w-full lg:max-w-[1180px] lg:rounded-[28px] lg:border lg:border-white/15 lg:p-0 lg:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute left-1/2 top-2.5 z-50 hidden h-[22px] w-[90px] -translate-x-1/2 rounded-b-[14px] bg-black sm:block lg:hidden" />
        <div className="pastel-sky relative flex h-full w-full flex-1 flex-col overflow-hidden sm:rounded-[32px] lg:rounded-[28px]">
          {children}
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
