import type { SkillKind } from '@/types';

export type FilterKey = 'all' | Extract<SkillKind, 'attack' | 'buff' | 'ultimate'>;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attack', label: '⚔ Attack' },
  { key: 'buff', label: '🌀 Buff' },
  { key: 'ultimate', label: '✦ Ultimate' },
];

interface FilterChipsProps {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="relative z-10 flex gap-1.5 overflow-x-auto px-3 pt-2" style={{ scrollbarWidth: 'none' }}>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`flex-shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[9.5px] font-bold transition-colors ${
            active === f.key ? 'border-[var(--color-gold)] bg-[rgba(255,200,80,0.16)] text-[var(--color-gold)]' : 'border-white/12 bg-[#140e20]/70 text-white/55'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
