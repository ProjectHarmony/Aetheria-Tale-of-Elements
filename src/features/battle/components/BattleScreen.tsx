import { Suspense, useState } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { RENDERER_REGISTRY, RENDER_MODE } from '@/systems/rendering';
import { HelpModal } from '@/components/shared/HelpModal';
import { TopBar } from './TopBar';
import { EnemyIntelStrip } from './EnemyIntelStrip';
import { ResourceRow } from './ResourceRow';
import { LogStrip } from './LogStrip';
import { BattleLogPanel } from './BattleLogPanel';
import { PlanPrompt } from './PlanPrompt';
import { HandSection } from './HandSection';
import { CtaBar } from './CtaBar';
import { ActionBanner } from './ActionBanner';
import { EndOverlay } from './EndOverlay';

interface BattleScreenProps {
  restartLabel?: string;
  xpSummary?: string;
  onRestart?: () => void;
}

export function BattleScreen({ restartLabel = '🔄 New Battle', xpSummary, onRestart }: BattleScreenProps) {
  const battle = useBattleStore((s) => s.battle);
  const events = useBattleStore((s) => s.events);
  const selectHero = useBattleStore((s) => s.selectHero);
  const selectCard = useBattleStore((s) => s.selectCard);
  const confirmCard = useBattleStore((s) => s.confirmCard);
  const cancelCard = useBattleStore((s) => s.cancelCard);
  const pass = useBattleStore((s) => s.pass);
  const attack = useBattleStore((s) => s.attack);
  const undo = useBattleStore((s) => s.undo);
  const startDemoBattle = useBattleStore((s) => s.startDemoBattle);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!battle) return null;

  const Battlefield = RENDERER_REGISTRY[RENDER_MODE];

  return (
    <div className="battle-layout relative">
      <div className="bl-topbar">
        <TopBar battle={battle} onOpenHelp={() => setHelpOpen(true)} />
      </div>

      <div className="bl-field">
        <EnemyIntelStrip battle={battle} />
        <Suspense fallback={<div className="flex-1" />}>
          <Battlefield battle={battle} events={events} onTapHero={selectHero} onUndo={undo} />
        </Suspense>
      </div>

      <div className="bl-sidebar">
        <ResourceRow battle={battle} />
        <div className="lg:hidden">
          <LogStrip message={battle.log} />
        </div>
        <PlanPrompt battle={battle} />
        <BattleLogPanel events={events} />
      </div>

      <div className="bl-hand">
        <HandSection battle={battle} onSelectCard={selectCard} />
        <CtaBar battle={battle} onPass={pass} onAttack={attack} onConfirmCard={confirmCard} onCancelCard={cancelCard} />
      </div>

      <ActionBanner battle={battle} events={events} />
      <EndOverlay battle={battle} restartLabel={restartLabel} xpSummary={xpSummary} onRestart={onRestart ?? startDemoBattle} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
