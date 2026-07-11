import type { Element, MageState, Skill } from '@/types';
import { ELEMENT_META, SKILL_TREES, ultimateUnlocked } from '@/constants';
import { effectiveRanks, type MageDraft } from '@/systems/party';
import { SkillTreeNode } from './SkillTreeNode';

const BRANCH_BLURB: Record<string, string> = {
  Incineration: 'nuker', Cinderguard: 'fire tank', Flashfire: 'fire assassin',
  'Tides of Mercy': 'battle healer', Deepfrost: 'freeze & crit', 'Abyssal Bulwark': 'water tank',
  Bastion: 'earth tank', Landslide: 'juggernaut', Verdant: 'sustain',
  Slipstream: 'wind assassin', 'Mistral Veil': 'dodge tank', Stormcall: 'AoE tempo',
};

interface SkillsTabProps {
  el: Element;
  mage: MageState;
  draft: MageDraft;
  skillPointsLeft: number;
  onOpenSkill: (skillId: string) => void;
}

/** Pure display — the tap-a-skill detail sheet lives up in PartyMageDetail
 *  now, not here (see SkillTreeSheet.tsx: rendering it nested inside this
 *  component's own scrollable, content-height wrapper was the bug — its
 *  `absolute inset-0` anchored to THIS div's full (very tall) height instead
 *  of the visible screen, so the sheet opened off-screen below the fold for
 *  any skill near the top of the tree). */
export function SkillsTab({ el, mage, draft, skillPointsLeft, onOpenSkill }: SkillsTabProps) {
  const tree = SKILL_TREES[el];
  const ranks = effectiveRanks(mage, draft);

  const root = tree.filter((s) => s.tier === 1);
  const ultimate = tree.find((s) => s.tier === 5)!;
  const branches = [...new Set(tree.filter((s) => s.tier >= 2 && s.tier <= 4).map((s) => s.branch))];

  const isRaisable = (s: Skill) => s.prereqs.every((p) => (ranks[p.skillId] || 0) >= p.rank);

  function node(s: Skill) {
    const rank = ranks[s.id] || 0;
    const raisable = s.tier === 5 ? ultimateUnlocked(mage, el) || rank > 0 : isRaisable(s);
    return <SkillTreeNode key={s.id} skill={s} el={el} rank={rank} raisable={raisable} onTap={() => onOpenSkill(s.id)} />;
  }

  return (
    <div>
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#2c1f3d]/70">
        Skill Tree — {skillPointsLeft} point{skillPointsLeft === 1 ? '' : 's'} to spend
      </div>

      <div className="mb-2 flex flex-col items-center gap-1.5">
        <div className="text-[8px] font-extrabold uppercase tracking-wide text-white/40">Root</div>
        <div className="flex w-full flex-col gap-1.5">{root.map(node)}</div>
      </div>

      <div className="mx-auto mb-2 h-3 w-[1.5px] bg-white/15" />

      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {branches.map((branch) => {
          const skills = tree.filter((s) => s.branch === branch);
          return (
            <div key={branch} className="flex w-[168px] flex-shrink-0 flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-2.5">
              <div className="mb-0.5 text-center">
                <div className="font-['Baloo_2'] text-[11.5px] font-extrabold" style={{ color: ELEMENT_META[el].color }}>{branch}</div>
                <div className="text-[8px] font-semibold uppercase tracking-wide text-white/35">{BRANCH_BLURB[branch]}</div>
              </div>
              {[2, 3, 4].map((tier) => {
                const group = skills.filter((s) => s.tier === tier);
                if (group.length === 0) return null;
                return (
                  <div key={tier} className="flex flex-col gap-1">
                    <div className="text-center text-[7px] font-extrabold uppercase tracking-wide text-white/30">Tier {tier}</div>
                    {group.map(node)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mx-auto my-2 h-3 w-[1.5px] bg-white/15" />

      <div className="flex flex-col items-center gap-1.5">
        <div className="text-[8px] font-extrabold uppercase tracking-wide text-[var(--color-gold)]">✦ Ultimate</div>
        <div className="w-full">{node(ultimate)}</div>
      </div>
    </div>
  );
}
