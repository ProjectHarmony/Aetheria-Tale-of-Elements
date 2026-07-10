import type { Element, Skill } from '@/types';
import { ELEMENT_META } from '@/constants';
import { SkillIcon } from '@/components/ui/SkillIcon';

interface SkillTreeNodeProps {
  skill: Skill;
  el: Element;
  rank: number;
  raisable: boolean;
  onTap: () => void;
}

export function SkillTreeNode({ skill, el, rank, raisable, onTap }: SkillTreeNodeProps) {
  const meta = ELEMENT_META[el];
  const owned = rank > 0;
  const locked = !owned && !raisable;

  return (
    <button
      onClick={onTap}
      className="flex w-full items-center gap-2 rounded-xl border-[1.5px] px-2 py-1.5 text-left"
      style={{
        borderColor: owned ? meta.color : locked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)',
        background: owned ? `${meta.color}22` : 'rgba(0,0,0,0.25)',
        opacity: locked ? 0.45 : 1,
      }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: owned ? `linear-gradient(135deg, ${meta.color}55, ${meta.color}) ` : 'rgba(255,255,255,0.08)', color: owned ? '#241a30' : '#fff8f0' }}
      >
        <SkillIcon skill={skill} size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-['Baloo_2'] text-[10.5px] font-bold text-[#fff8f0]">{skill.name}</div>
      </div>
      <div className="flex-shrink-0 font-['Baloo_2'] text-[9px] font-extrabold" style={{ color: owned ? 'var(--color-gold)' : 'rgba(255,255,255,0.35)' }}>
        {locked ? '🔒' : `${rank}/${skill.maxRank}`}
      </div>
    </button>
  );
}
