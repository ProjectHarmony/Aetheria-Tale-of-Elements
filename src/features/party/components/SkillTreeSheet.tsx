import { AnimatePresence, motion } from 'framer-motion';
import type { MageDraft } from '@/systems/party';
import { effectiveRanks } from '@/systems/party';
import type { Element, MageState, Skill } from '@/types';
import { ELEMENT_META, MAX_EQUIPPED_ACTIVES, SKILLS_BY_ID, skillDamage } from '@/constants';
import { SkillIcon } from '@/components/ui/SkillIcon';

interface SkillTreeSheetProps {
  skill: Skill | null;
  el: Element;
  mage: MageState;
  draft: MageDraft;
  skillPointsLeft: number;
  needsEquipChoice: boolean;
  equipped: string[];
  onClose: () => void;
  onStage: (skill: Skill) => void;
  onUnstage: (skill: Skill) => void;
  onToggleEquip: (id: string) => void;
}

const KIND_LABEL: Record<Skill['kind'], string> = { attack: 'Attack', passive: 'Passive', buff: 'Buff', ultimate: 'Ultimate' };

export function SkillTreeSheet({ skill, el, mage, draft, skillPointsLeft, needsEquipChoice, equipped, onClose, onStage, onUnstage, onToggleEquip }: SkillTreeSheetProps) {
  const meta = ELEMENT_META[el];
  const open = !!skill;

  const currentRank = skill ? mage.ranks[skill.id] || 0 : 0;
  const pendingRank = skill ? draft.ranks[skill.id] || 0 : 0;
  const rank = currentRank + pendingRank;
  const ranks = skill ? effectiveRanks(mage, draft) : {};
  const canRaise = !!skill && skillPointsLeft > 0 && rank < skill.maxRank && skill.prereqs.every((p) => (ranks[p.skillId] || 0) >= p.rank);
  const canLower = pendingRank > 0;
  const isEquippable = skill?.kind === 'attack' && needsEquipChoice && rank > 0;
  const isOn = skill ? equipped.includes(skill.id) : false;

  const dmgTxt = skill?.dmg ? `${skillDamage(skill, Math.max(rank, 1))} DMG${skill.aoe || skill.effect?.aoeMode ? ' · ALL' : ''}` : null;

  return (
    <AnimatePresence>
      {open && skill && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}88)`, color: '#fff8f0' }}
              >
                <SkillIcon skill={skill} size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">{skill.name}</div>
                <div className="text-[10px] font-semibold text-white/50">
                  {skill.branch} · Tier {skill.tier} · {KIND_LABEL[skill.kind]}
                  {skill.cost ? ` · ${skill.cost}⚡` : ''}{dmgTxt ? ` · ${dmgTxt}` : ''}
                </div>
              </div>
              <button onClick={onClose} className="flex-shrink-0 text-xl text-white/40">✕</button>
            </div>

            <div className="mb-3 text-[13px] leading-relaxed text-white/85">{skill.desc}</div>

            {skill.prereqs.length > 0 && (
              <div className="mb-3 text-[11px] leading-relaxed text-white/55">
                <span className="font-bold text-white/70">Requires: </span>
                {skill.prereqs.map((p, i) => {
                  const met = (ranks[p.skillId] || 0) >= p.rank;
                  const name = SKILLS_BY_ID[p.skillId]?.name ?? p.skillId;
                  return (
                    <span key={p.skillId} className={met ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                      {i > 0 ? ' + ' : ''}{name} Lv{p.rank}{met ? ' ✓' : ' ✗'}
                    </span>
                  );
                })}
              </div>
            )}
            {skill.tier === 5 && (
              <div className="mb-3 text-[11px] leading-relaxed text-white/55">
                <span className="font-bold text-white/70">Requires: </span>
                Mage Level 15 + 1 rank in any Tier-4 skill
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => onUnstage(skill)}
                disabled={!canLower}
                className="h-9 w-9 flex-shrink-0 rounded-xl border border-white/18 bg-white/8 font-['Baloo_2'] text-lg font-extrabold text-white disabled:opacity-25"
              >
                −
              </button>
              <div className="flex-1 text-center font-['Baloo_2'] text-lg font-extrabold" style={{ color: rank > 0 ? 'var(--color-gold)' : 'rgba(255,255,255,0.4)' }}>
                {rank} / {skill.maxRank}
              </div>
              <button
                onClick={() => onStage(skill)}
                disabled={!canRaise}
                className="h-9 w-9 flex-shrink-0 rounded-xl font-['Baloo_2'] text-lg font-extrabold text-[var(--color-gold-deep)] disabled:opacity-25"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                +
              </button>
            </div>

            {isEquippable && (
              <button
                onClick={() => onToggleEquip(skill.id)}
                className={`mt-3 w-full rounded-xl border py-2.5 font-['Baloo_2'] text-[12px] font-extrabold ${isOn ? 'border-[rgba(126,232,184,0.5)] bg-[rgba(126,232,184,0.15)] text-[var(--color-success)]' : 'border-white/18 bg-white/6 text-white/60'}`}
              >
                {isOn ? `✓ Equipped for Battle` : `Equip for Battle (max ${MAX_EQUIPPED_ACTIVES})`}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
