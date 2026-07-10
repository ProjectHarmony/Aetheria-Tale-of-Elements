import type { MageState } from '@/types';
import type { StatKey } from '@/constants';
import { STAT_META, STAT_POINTS_PER_LEVEL } from '@/constants';
import type { MageDraft } from '@/systems/party';

interface StatsTabProps {
  mage: MageState;
  draft: MageDraft;
  statPointsLeft: number;
  onStage: (key: StatKey) => void;
  onUnstage: (key: StatKey) => void;
}

export function StatsTab({ mage, draft, statPointsLeft, onStage, onUnstage }: StatsTabProps) {
  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/70">
        Stats — allocate freely, then Confirm (permanent · Lv up in Adventure for +{STAT_POINTS_PER_LEVEL}/level)
      </div>
      <div className="flex flex-col gap-1.5">
        {(Object.keys(STAT_META) as StatKey[]).map((key) => {
          const meta = STAT_META[key];
          const pending = draft.stats[key];
          return (
            <div key={key} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="w-5 flex-shrink-0 text-center text-[15px]">{meta.icon}</span>
              <span className="w-[78px] flex-shrink-0 font-['Baloo_2'] text-[11.5px] font-bold text-[#fff8f0]">{meta.name}</span>
              <span className="flex-1 text-[8.5px] leading-snug text-white/45">{meta.desc}</span>
              <span className="relative w-6 flex-shrink-0 text-center font-['Baloo_2'] text-[15px] font-extrabold text-[var(--color-gold)]">
                {mage.stats[key] + pending}
                {pending > 0 && <span className="absolute -right-1 -top-2 text-[8px] font-extrabold text-[var(--color-success)]">+{pending}</span>}
              </span>
              <button
                onClick={() => onUnstage(key)}
                disabled={pending <= 0}
                className="h-[27px] w-[27px] flex-shrink-0 rounded-lg border border-white/16 bg-white/8 font-['Baloo_2'] text-base font-extrabold text-white/60 disabled:opacity-20"
              >
                −
              </button>
              <button
                onClick={() => onStage(key)}
                disabled={statPointsLeft <= 0}
                className="h-[27px] w-[27px] flex-shrink-0 rounded-lg font-['Baloo_2'] text-base font-extrabold text-[var(--color-gold-deep)] disabled:opacity-20"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
