import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { PartyMageDetail } from './PartyMageDetail';

export function PartyPage() {
  const party = useGameStore((s) => s.party);
  const navigate = useNavigate();

  const el = party?.picks[0];
  if (!party || !el) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <button onClick={() => navigate('/hub')} className="rounded-xl border border-white/14 bg-[var(--panel-bg)] px-3 py-1.5 font-['Baloo_2'] text-[11px] font-bold text-[#fff8f0]">
          ← Hub
        </button>
        <div className="font-['Baloo_2'] text-base font-extrabold text-[#2c1f3d]">Character</div>
        <div className="w-[52px]" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <PartyMageDetail el={el} />
      </div>
    </div>
  );
}
