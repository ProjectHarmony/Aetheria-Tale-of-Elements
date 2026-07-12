import type { MageState } from '@/types';
import type { StatKey } from '@/constants';
import { STAT_META, STAT_POINTS_PER_LEVEL } from '@/constants';
import type { MageDraft } from '@/systems/party';
import { gearStatBonus } from '@/systems/battle';
import { useHoldRepeat } from '@/hooks/useHoldRepeat';

interface StatsTabProps {
  mage: MageState;
  draft: MageDraft;
  statPointsLeft: number;
  onStage: (key: StatKey) => void;
  onUnstage: (key: StatKey) => void;
}

/** One stat row's +/- pair — each button gets its own hold-repeat instance
 *  since they call different actions and go disabled under different
 *  conditions (out of points to spend vs. nothing pending to refund). */
function StatRow({ statKey, mage, draft, statPointsLeft, onStage, onUnstage, gearBonus }: StatsTabProps & { statKey: StatKey; gearBonus: number }) {
  const meta = STAT_META[statKey];
  const pending = draft.stats[statKey];
  const minusDisabled = pending <= 0;
  const plusDisabled = statPointsLeft <= 0;

  const minusHold = useHoldRepeat({ onTick: () => onUnstage(statKey), disabled: minusDisabled });
  const plusHold = useHoldRepeat({ onTick: () => onStage(statKey), disabled: plusDisabled });

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="w-5 flex-shrink-0 text-center text-[15px]">{meta.icon}</span>
      <div className="w-[78px] flex-shrink-0">
        <div className="font-['Baloo_2'] text-[11.5px] font-bold text-[#fff8f0]">{meta.name}</div>
        {gearBonus > 0 && <div className="text-[8px] font-bold text-[#7ec8ff]">⚙️ +{gearBonus} gear</div>}
      </div>
      <span className="flex-1 text-[8.5px] leading-snug text-white/45">{meta.desc}</span>
      <span className="relative w-9 flex-shrink-0 text-center font-['Baloo_2'] text-[15px] font-extrabold text-[var(--color-gold)]">
        {mage.stats[statKey] + pending + gearBonus}
        {pending > 0 && <span className="absolute -right-1 -top-2 text-[8px] font-extrabold text-[var(--color-success)]">+{pending}</span>}
      </span>
      <button
        {...minusHold}
        disabled={minusDisabled}
        className="h-[27px] w-[27px] flex-shrink-0 touch-none select-none rounded-lg border border-white/16 bg-white/8 font-['Baloo_2'] text-base font-extrabold text-white/60 disabled:opacity-20"
      >
        −
      </button>
      <button
        {...plusHold}
        disabled={plusDisabled}
        className="h-[27px] w-[27px] flex-shrink-0 touch-none select-none rounded-lg font-['Baloo_2'] text-base font-extrabold text-[var(--color-gold-deep)] disabled:opacity-20"
        style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
      >
        +
      </button>
    </div>
  );
}

export function StatsTab({ mage, draft, statPointsLeft, onStage, onUnstage }: StatsTabProps) {
  const gear = gearStatBonus(mage);
  const hasGearBonus = (Object.keys(gear) as StatKey[]).some((k) => gear[k] > 0);

  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/70">
        Stats — allocate freely, then Confirm (permanent · Lv up in Adventure for +{STAT_POINTS_PER_LEVEL}/level)
        {hasGearBonus && <span className="text-[#7ec8ff]"> · ⚙️ blue = bonus from equipped gear/cards</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        {(Object.keys(STAT_META) as StatKey[]).map((key) => (
          <StatRow key={key} statKey={key} mage={mage} draft={draft} statPointsLeft={statPointsLeft} onStage={onStage} onUnstage={onUnstage} gearBonus={gear[key]} />
        ))}
      </div>
    </div>
  );
}
