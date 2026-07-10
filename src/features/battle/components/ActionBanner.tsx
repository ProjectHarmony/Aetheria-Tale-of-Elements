import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { BattleState } from '@/types';
import type { TimedBattleEvent } from '@/stores/battleStore';
import { heroById } from '@/systems/battle';

interface Banner {
  id: number;
  big: string;
  small: string;
}

const BANNER_MS = 1100;

export function ActionBanner({ battle, events }: { battle: BattleState; events: TimedBattleEvent[] }) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const lastSeenId = useRef(0);

  useEffect(() => {
    const fresh = events.filter((e) => e.id > lastSeenId.current);
    if (fresh.length === 0) return;
    lastSeenId.current = events[events.length - 1]?.id ?? lastSeenId.current;

    for (const { id, event } of fresh) {
      if (event.type === 'cast' && event.isBuff) {
        setBanner({ id, big: event.cardName, small: event.cardDesc });
        setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), BANNER_MS);
      }
      if (event.type === 'death') {
        const hero = heroById(battle, event.targetId);
        setBanner({ id, big: 'Defeated!', small: `${hero?.name ?? 'A mage'} has fallen` });
        setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), BANNER_MS);
      }
      if (event.type === 'combo' && event.energyGranted) {
        setBanner({ id, big: 'Combo!', small: '+1 Energy granted' });
        setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), BANNER_MS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[46%] z-40 -translate-x-1/2 -translate-y-1/2 text-center">
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 16 }}
          >
            <div className="font-['Baloo_2'] text-[22px] font-extrabold uppercase tracking-wide text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
              {banner.big}
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-white/60">{banner.small}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
