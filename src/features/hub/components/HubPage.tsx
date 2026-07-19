import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ELEMENT_META, HERO_NAMES, MAX_MAGE_LEVEL, xpNeededForLevel } from '@/constants';
import { derivedStatsFor } from '@/systems/battle';
import { HelpModal } from '@/components/shared/HelpModal';
import { MageSprite } from '@/components/ui/MageSprite';

interface HubOptionProps {
  icon: string;
  name: string;
  desc: string;
  locked?: boolean;
  onClick: () => void;
}

function HubOption({ icon, name, desc, locked, onClick }: HubOptionProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.975 }}
      whileHover={{ scale: 1.015 }}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3.5 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 backdrop-blur-md ${locked ? 'opacity-70' : ''}`}
    >
      <span className="flex-shrink-0 text-3xl" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))' }}>{icon}</span>
      <div>
        <div className="font-['Baloo_2'] text-[15px] font-extrabold text-[#fff8f0]">{name}</div>
        <div className="mt-0.5 text-[10px] font-semibold leading-snug text-white/55">{desc}</div>
      </div>
    </motion.div>
  );
}

export function HubPage() {
  const user = useGameStore((s) => s.user);
  const party = useGameStore((s) => s.party);
  const logout = useGameStore((s) => s.logout);
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  if (!party) return null;
  const el = party.picks[0];
  const mage = el ? party.mages[el] : undefined;

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-5 py-6">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-3 backdrop-blur-md">
        <div>
          <div className="font-['Baloo_2'] text-xl font-extrabold text-[#fff8f0]" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>{user}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Realm of Aetheria</div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setHelpOpen(true)}
            className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white"
          >
            ? How to Play
          </button>
          <button
            onClick={() => navigate('/character-select')}
            className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white"
          >
            🔄 Switch Character
          </button>
          <button
            onClick={() => { logout(); navigate('/auth'); }}
            className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white"
          >
            Log out
          </button>
        </div>
      </div>

      {el && mage && (() => {
        const meta = ELEMENT_META[el];
        const xpPct = mage.level >= MAX_MAGE_LEVEL ? 100 : Math.round((100 * mage.xp) / xpNeededForLevel(mage.level));
        const maxHp = derivedStatsFor(el, mage).maxHp;
        const hp = Math.max(0, Math.min(maxHp, mage.currentHp ?? maxHp));
        const hpPct = maxHp > 0 ? Math.round((100 * hp) / maxHp) : 0;
        const hpLow = hpPct <= 25;
        return (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border bg-[var(--panel-bg)] px-4 py-3 backdrop-blur-md" style={{ borderColor: `${meta.color}66` }}>
            <div className="h-14 w-14 flex-shrink-0"><MageSprite el={el} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate font-['Baloo_2'] text-[14px] font-extrabold" style={{ color: meta.color }}>{party.characterName || HERO_NAMES[el]}</div>
                <div className="flex-shrink-0 text-[9px] font-bold uppercase text-white/40">Lv {mage.level}</div>
              </div>
              <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,var(--color-gold),#ffe9c2)' }} />
              </div>
              <div className={`mt-1 text-[8.5px] font-extrabold ${hpLow ? 'text-[var(--color-danger)]' : 'text-white/45'}`}>{hp}/{maxHp} HP</div>
              <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full" style={{ width: `${hpPct}%`, background: hpLow ? 'var(--color-danger)' : 'linear-gradient(90deg,var(--color-success),#8df0b8)' }} />
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex flex-1 flex-col gap-3">
        <HubOption icon="🧙" name="Manage Character" desc="Stats, skills & gear" onClick={() => navigate('/party')} />
        <HubOption icon="🗺️" name="Adventure" desc="Explore Aetheria — fight monsters roaming the wilds" onClick={() => navigate('/map')} />
      </div>

      <div className="pt-4 text-center text-[9px] font-semibold text-[#2c1f3d]/70">Two Elements — Beta Prototype</div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
