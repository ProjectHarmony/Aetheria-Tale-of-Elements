import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Element } from '@/types';
import { PartyOverview } from './PartyOverview';
import { PartyMageDetail } from './PartyMageDetail';
import { PartyFormationEditor } from './PartyFormationEditor';

type View = 'overview' | 'mage' | 'formation';

export function PartyPage() {
  const [view, setView] = useState<View>('overview');
  const [selectedMage, setSelectedMage] = useState<Element | null>(null);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <button onClick={() => navigate('/hub')} className="rounded-xl border border-white/14 bg-[var(--panel-bg)] px-3 py-1.5 font-['Baloo_2'] text-[11px] font-bold text-[#fff8f0]">
          ← Hub
        </button>
        <div className="font-['Baloo_2'] text-base font-extrabold text-[#2c1f3d]">Party</div>
        <div className="w-[52px]" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {view === 'overview' && (
          <PartyOverview
            onSelectMage={(el) => { setSelectedMage(el as Element); setView('mage'); }}
            onFormation={() => setView('formation')}
          />
        )}
        {view === 'mage' && selectedMage && <PartyMageDetail el={selectedMage} onBack={() => setView('overview')} />}
        {view === 'formation' && <PartyFormationEditor onBack={() => setView('overview')} />}
      </div>
    </div>
  );
}
