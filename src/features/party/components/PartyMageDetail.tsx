import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Element } from '@/types';
import type { StatKey } from '@/constants';
import { ELEMENT_META, HERO_NAMES, MAX_EQUIPPED_ACTIVES, MAX_MAGE_LEVEL, SKILLS_BY_ID, SKILL_TREES, STAT_META, xpNeededForLevel } from '@/constants';
import { derivedStatsFor, equippedActives } from '@/systems/battle';
import { createEmptyDraft, draftHasPending, stageSkillRank, stageStatPoint, unstageSkillRank, unstageStatPoint } from '@/systems/party';
import { useGameStore } from '@/stores/gameStore';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MageSprite } from '@/components/ui/MageSprite';
import { StatsTab } from './StatsTab';
import { SkillsTab } from './SkillsTab';
import { EquipmentTab } from './EquipmentTab';

type SubTab = 'stats' | 'skills' | 'equipment';

export function PartyMageDetail({ el, onBack }: { el: Element; onBack: () => void }) {
  const party = useGameStore((s) => s.party);
  const applyMageDraft = useGameStore((s) => s.applyMageDraft);
  const setEquipped = useGameStore((s) => s.setEquipped);
  const respec = useGameStore((s) => s.respec);
  const getRespecTokens = useGameStore((s) => s.getRespecTokens);

  const [subTab, setSubTab] = useState<SubTab>('stats');
  const [draft, setDraft] = useState(createEmptyDraft());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [respecConfirmOpen, setRespecConfirmOpen] = useState(false);

  useEffect(() => setDraft(createEmptyDraft()), [el]);

  const mage = party?.mages[el];
  if (!mage) return null;

  const meta = ELEMENT_META[el];
  const xpNeed = xpNeededForLevel(mage.level);
  const xpPct = mage.level >= MAX_MAGE_LEVEL ? 100 : Math.round((100 * mage.xp) / xpNeed);
  const d = derivedStatsFor(el, mage);
  const statPointsLeft = mage.statPoints - draft.statPointsUsed;
  const skillPointsLeft = mage.skillPoints - draft.skillPointsUsed;
  const pending = draftHasPending(draft);
  const tokens = getRespecTokens();

  function confirmSummary() {
    const statNames = (Object.keys(draft.stats) as StatKey[]).filter((k) => draft.stats[k] > 0).map((k) => `${STAT_META[k].name} +${draft.stats[k]}`).join(', ');
    const skillNames = Object.keys(draft.ranks).filter((id) => (draft.ranks[id] ?? 0) > 0).map((id) => `${SKILLS_BY_ID[id]!.name} +${draft.ranks[id]}`).join(', ');
    return [statNames, skillNames].filter(Boolean).join(' · ');
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-[11px] font-bold text-[#2c1f3d]/80">← Mages</button>

      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-3">
        <div className="h-14 w-14 flex-shrink-0"><MageSprite el={el} /></div>
        <div>
          <div className="font-['Baloo_2'] text-lg font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</div>
          <div className="mt-0.5 text-[10px] font-bold text-white/70">
            Level {mage.level} / {MAX_MAGE_LEVEL}{mage.level < MAX_MAGE_LEVEL ? ` · ${mage.xp}/${xpNeed} XP` : ' · MAX'}
          </div>
          <div className="mt-1 h-1.5 w-[170px] overflow-hidden rounded-full bg-black/30">
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,var(--color-gold),#ffe9c2)' }} />
          </div>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5">
        {[
          { key: 'statPoints', label: 'Stat Points', val: statPointsLeft },
          { key: 'skillPoints', label: 'Skill Points', val: skillPointsLeft },
          { key: 'hp', label: 'Max HP', val: Math.round(d.maxHp) },
          { key: 'speed', label: 'Speed', val: Math.round(d.speed) },
        ].map((p) => (
          <div key={p.key} className="flex-1 rounded-xl border border-white/10 bg-black/20 py-1.5 text-center">
            <div className={`font-['Baloo_2'] text-[15px] font-extrabold ${p.val ? 'text-[var(--color-gold)]' : 'text-white/30'}`}>{p.val}</div>
            <div className="text-[8px] font-bold text-white/50">{p.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex gap-1">
        {(['stats', 'skills', 'equipment'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 rounded-xl py-2 text-[10.5px] font-bold uppercase tracking-wide ${subTab === t ? 'bg-[#241a30]/90 text-[#fff8f0]' : 'bg-[#1a1330]/70 text-white/55'}`}
            style={subTab === t ? { boxShadow: `inset 0 0 0 1.5px ${meta.color}` } : undefined}
          >
            {t === 'stats' ? '📊 Stats' : t === 'skills' ? '📜 Skills' : '🎽 Gear'}
          </button>
        ))}
      </div>

      {subTab === 'stats' && (
        <StatsTab
          mage={mage}
          draft={draft}
          statPointsLeft={statPointsLeft}
          onStage={(key) => setDraft((d) => stageStatPoint(d, key, statPointsLeft))}
          onUnstage={(key) => setDraft((d) => unstageStatPoint(d, key))}
        />
      )}
      {subTab === 'skills' && (
        <SkillsTab
          el={el}
          mage={mage}
          draft={draft}
          skillPointsLeft={skillPointsLeft}
          onStage={(skill) => setDraft((d) => stageSkillRank(d, mage, skill, skillPointsLeft))}
          onUnstage={(skill) => setDraft((d) => unstageSkillRank(d, mage, skill, SKILL_TREES[el]))}
          onToggleEquip={(id) => {
            const current = equippedActives(mage, el).map((s) => s.id);
            if (current.includes(id)) {
              if (current.length <= 1) return;
              setEquipped(el, current.filter((x) => x !== id));
            } else {
              if (current.length >= MAX_EQUIPPED_ACTIVES) return;
              setEquipped(el, [...current, id]);
            }
          }}
        />
      )}
      {subTab === 'equipment' && <EquipmentTab />}

      {pending && (subTab === 'stats' || subTab === 'skills') && (
        <div className="mt-3 flex items-center justify-between gap-2.5 rounded-2xl border-[1.5px] border-[rgba(126,232,184,0.45)] bg-[#12291f]/90 p-2.5">
          <div className="flex-1 text-[10px] font-bold leading-snug text-[var(--color-success)]">
            Pending: {draft.statPointsUsed ? `+${draft.statPointsUsed} Stat` : ''}{draft.statPointsUsed && draft.skillPointsUsed ? ' · ' : ''}{draft.skillPointsUsed ? `+${draft.skillPointsUsed} Skill Rank${draft.skillPointsUsed === 1 ? '' : 's'}` : ''}
          </div>
          <div className="flex flex-shrink-0 gap-1.5">
            <button onClick={() => setDraft(createEmptyDraft())} className="rounded-lg border border-white/18 bg-white/8 px-3 py-2 font-['Baloo_2'] text-[10.5px] font-extrabold text-white/60">
              Discard
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg px-3 py-2 font-['Baloo_2'] text-[10.5px] font-extrabold text-[#06281a]"
              style={{ background: 'linear-gradient(135deg,var(--color-success),#8df0b8)' }}
            >
              ✓ Confirm
            </button>
          </div>
        </div>
      )}

      {(subTab === 'stats' || subTab === 'skills') && (
        <div className="mt-3.5 border-t border-white/8 pt-3.5">
          <motion.button
            whileTap={tokens > 0 && mage.level > 1 ? { scale: 0.98 } : undefined}
            disabled={tokens <= 0 || mage.level <= 1}
            onClick={() => setRespecConfirmOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[rgba(201,174,255,0.5)] bg-[#241c38]/90 py-2.5 font-['Baloo_2'] text-[13px] font-bold text-[#e4d6ff] disabled:opacity-40"
          >
            🔄 Respec {HERO_NAMES[el]} <span className="text-[10px] font-semibold text-white/60">{tokens} Token{tokens === 1 ? '' : 's'} left</span>
          </motion.button>
          <div className="mt-1.5 text-center text-[9.5px] text-[#2c1f3d]/60">Fully resets stats & skills, refunding every point to reallocate.</div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Allocation?"
        description={`Permanently apply: ${confirmSummary()}. Only a Respec Token can undo this later.`}
        confirmLabel="Confirm"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          applyMageDraft(el, draft);
          setDraft(createEmptyDraft());
          setConfirmOpen(false);
        }}
      />
      <ConfirmModal
        open={respecConfirmOpen}
        title="Use a Respec Token?"
        description={`Fully reset ${HERO_NAMES[el]}'s stats AND skills, refunding every point spent so far to reallocate freely? This costs 1 Respec Token — ${tokens} remaining.`}
        confirmLabel="Respec"
        onCancel={() => setRespecConfirmOpen(false)}
        onConfirm={() => {
          respec(el);
          setDraft(createEmptyDraft());
          setRespecConfirmOpen(false);
        }}
      />
    </div>
  );
}
