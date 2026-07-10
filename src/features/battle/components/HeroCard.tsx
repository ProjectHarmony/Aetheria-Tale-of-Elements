import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Hero } from '@/types';
import type { TimedBattleEvent } from '@/stores/battleStore';
import { ELEMENT_META, STATUS_META } from '@/constants';
import { getHeroStatuses } from '@/systems/battle';
import { HealthBar } from '@/components/ui/HealthBar';
import { useFloatingEvents } from '../hooks/useFloatingEvents';
import { useHeroFx } from '../hooks/useHeroFx';
import { useAttackLunge } from '../hooks/useAttackLunge';
import { useHeroNodeRegistry } from '../context/HeroNodesContext';
import { MageSprite } from '@/components/ui/MageSprite';

interface HeroCardProps {
  hero: Hero;
  side: 'player' | 'enemy';
  isSelected: boolean;
  planLabel: string | null;
  isPass: boolean;
  orderRank: number | null;
  incomingCount: number;
  events: TimedBattleEvent[];
  onTap?: () => void;
  onUndo?: () => void;
  canUndo: boolean;
  disabled: boolean;
}

const FLOATER_COLOR: Record<string, string> = {
  damage: '#ffffff',
  crit: 'var(--color-gold)',
  counter: 'var(--color-danger)',
  heal: 'var(--color-success)',
  block: '#9fd0ff',
  miss: 'rgba(255,255,255,0.6)',
  dodge: 'rgba(255,255,255,0.6)',
};

export function HeroCard({ hero, side, isSelected, planLabel, isPass, orderRank, incomingCount, events, onTap, onUndo, canUndo, disabled }: HeroCardProps) {
  const meta = ELEMENT_META[hero.el];
  const { isHit, isActing, isAutoTargeted, statusPops } = useHeroFx(events, hero.id);
  const floaters = useFloatingEvents(events, hero.id);
  const statuses = getHeroStatuses(hero);
  const isBack = hero.row === 'back';
  const { register } = useHeroNodeRegistry();
  const lungeRef = useRef<HTMLDivElement>(null);
  useAttackLunge(events, hero.id, side, lungeRef);

  return (
    <motion.div
      ref={(node) => register(hero.id, node)}
      data-hero-id={hero.id}
      className={`relative flex flex-col items-center gap-1 w-[92px] lg:w-[128px] ${hero.alive && side === 'player' && !disabled ? 'cursor-pointer' : ''}`}
      animate={{
        // Same size for everyone — the front/back read comes entirely from
        // position now: front pushes toward the enemy column, back pulls
        // toward its own edge. No scale difference to fight with, so the
        // characters themselves stay visually consistent card to card.
        x: isBack ? (side === 'player' ? -18 : 18) : (side === 'player' ? 22 : -22),
        opacity: hero.alive ? 1 : 0.35,
        boxShadow: isAutoTargeted ? ['0 0 0 0 rgba(255,84,112,0.7)', '0 0 0 18px rgba(255,84,112,0)'] : '0 0 0 0 rgba(255,84,112,0)',
      }}
      transition={isAutoTargeted ? { boxShadow: { duration: 0.5, ease: 'easeOut' } } : undefined}
      style={{ borderRadius: 16 }}
      whileHover={
        hero.alive && side === 'player' && !disabled
          ? { scale: 1.06, x: isBack ? (side === 'player' ? -22 : 22) : (side === 'player' ? 26 : -26), y: -4 }
          : undefined
      }
      whileTap={hero.alive && side === 'player' && !disabled ? { scale: 0.96 } : undefined}
      onClick={() => { if (hero.alive && side === 'player' && !disabled) onTap?.(); }}
    >
      {/* acting glow ring (resolution) — pulsing ellipse under the sprite,
          distinct from the "selecting-self" outline below (planning) since
          the original treats "your turn to act" and "you're the one I'm
          currently planning for" as two different signals, not one. */}
      <AnimatePresence>
        {isActing && (
          <motion.div
            className="absolute bottom-5 left-1/2 h-4 w-14 -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.7), transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.1, 0.9] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* selecting-self outline (planning) — static glowing white border
          around the whole card, matches original's .hero.selecting-self::before
          (no transition in the original — it's a plain class toggle) */}
      {isSelected && (
        <div
          className="absolute z-[3] rounded-2xl border-2 border-white/80 opacity-80"
          style={{ inset: -7, boxShadow: '0 0 12px rgba(255,255,255,0.5)' }}
        />
      )}

      {/* plan / pass badge */}
      <AnimatePresence>
        {(planLabel || isPass) && (
          <motion.div
            className={`absolute -top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-white/20 bg-[#100a1a]/90 px-2 py-0.5 text-[8px] font-extrabold text-white ${isPass ? 'italic text-white/50' : ''}`}
            initial={{ opacity: 0, y: 4, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 4, x: '-50%' }}
          >
            {!isPass && <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />}
            {isPass ? 'Pass' : planLabel}
            {canUndo && (
              <span
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/15 font-extrabold"
                onClick={(e) => { e.stopPropagation(); onUndo?.(); }}
              >
                ↩
              </span>
            )}
          </motion.div>
        )}
        {!planLabel && !isPass && orderRank != null && (
          <motion.div
            key="order"
            className={`absolute -top-2.5 -right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border text-[8px] font-extrabold ${isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-gold-deep)]' : 'border-white/25 bg-white/10 text-white/55'}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            {orderRank}
          </motion.div>
        )}
        {side === 'enemy' && incomingCount > 0 && (
          <motion.div
            key="incoming"
            className="absolute -top-2.5 -left-1.5 z-10 rounded-full border border-white/30 bg-[var(--color-danger)]/90 px-1.5 py-0.5 text-[9px] font-extrabold text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            ⚔ {incomingCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* status chip row */}
      {statuses.length > 0 && (
        <div className="absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 gap-0.5">
          {statuses.map((s) => (
            <div
              key={s.kind}
              title={STATUS_META[s.kind].label}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] bg-[#140e20]/90 text-[8px]"
              style={{ borderColor: STATUS_META[s.kind].isDebuff ? 'rgba(255,84,112,0.7)' : 'rgba(255,200,80,0.6)' }}
            >
              {STATUS_META[s.kind].icon}
            </div>
          ))}
        </div>
      )}

      {/* ground contact shadow — a plain flattened dark ellipse right under
          the feet, independent of the (colored, gameplay-meaningful) front/
          back ring below, purely so each character reads as actually
          standing on the arena floor rather than floating over it. */}
      <div className="absolute bottom-2 left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-[50%] bg-black/35 blur-[2px] lg:h-3 lg:w-[52px]" />

      {/* row indicator (front shield ring / back veil) — front's ring is
          bigger, brighter, and animated (a slow breathing glow) so the tank
          line reads as the visual anchor of the formation at a glance;
          back's veil stays a quiet, static, low-contrast footprint. */}
      {hero.row === 'front' ? (
        <motion.div
          className="absolute bottom-5 left-1/2 h-[22px] w-[92px] -translate-x-1/2 rounded-full border-[3px] border-[rgba(160,205,255,0.7)] lg:h-7 lg:w-[126px]"
          animate={{ boxShadow: ['0 0 14px -1px rgba(120,180,255,0.55)', '0 0 22px 2px rgba(120,180,255,0.85)', '0 0 14px -1px rgba(120,180,255,0.55)'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <div className="absolute bottom-3.5 left-1/2 h-3 w-[50px] -translate-x-1/2 rounded-full lg:h-4 lg:w-[68px]" style={{ background: 'radial-gradient(ellipse, rgba(150,170,255,0.18), transparent 70%)' }} />
      )}

      {/* sprite — the GSAP lunge wrapper is a plain div so it never fights
          Framer Motion's own transform writes on the node just inside it */}
      <div ref={lungeRef} className="h-[74px] w-[64px] lg:h-[102px] lg:w-[88px]">
      <motion.div
        className="relative z-[2] flex h-full w-full items-center justify-center rounded-xl p-1.5"
        style={{ filter: hero.alive ? undefined : 'grayscale(1) brightness(0.4)' }}
        animate={isHit ? { filter: ['brightness(3) saturate(0)', 'brightness(1)'], x: [0, -4, 4, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <MageSprite el={hero.el} alive={hero.alive} />
        {/* floating combat text, scoped to this hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <AnimatePresence>
            {floaters.map((f) => (
              <motion.div
                key={f.id}
                className="absolute font-extrabold"
                style={{ color: FLOATER_COLOR[f.kind], fontSize: f.kind === 'crit' ? 21 : f.kind === 'miss' || f.kind === 'dodge' ? 13 : f.kind === 'block' ? 14 : 17, fontFamily: "'Baloo 2', sans-serif", textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                initial={{ opacity: 0, y: 0, scale: 0.7 }}
                animate={{ opacity: [0, 1, 0], y: [0, -14, -46], scale: [0.7, 1.15, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, times: [0, 0.15, 1] }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {statusPops.map((p) => (
              <motion.div
                key={p.id}
                className="absolute top-4 flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-extrabold"
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  background: STATUS_META[p.kind].isDebuff ? 'rgba(255,84,112,0.16)' : 'rgba(110,231,168,0.16)',
                  borderColor: STATUS_META[p.kind].isDebuff ? 'rgba(255,84,112,0.6)' : 'rgba(110,231,168,0.6)',
                  color: STATUS_META[p.kind].isDebuff ? '#ffc9d3' : '#c8f5dc',
                }}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: [6, -4, -14, -24], scale: [0.8, 1.08, 1, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, times: [0, 0.2, 0.75, 1] }}
              >
                <span>{STATUS_META[p.kind].icon}</span>
                <span>{STATUS_META[p.kind].label}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>

      {/* nameplate */}
      <div className="z-[2] min-w-[64px] rounded-lg border border-white/10 bg-[#100a1a]/80 px-1.5 pb-1 pt-0.5 lg:min-w-[92px] lg:px-2.5 lg:pb-1.5 lg:pt-1">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full lg:h-2 lg:w-2" style={{ background: meta.color }} />
          <span className="whitespace-nowrap font-['Baloo_2'] text-[9px] font-bold text-[#f5f1ff] lg:text-[12px]">{hero.name}</span>
          {hero.level && <span className="ml-0.5 rounded bg-[var(--color-gold)]/15 px-1 text-[7px] font-extrabold text-[var(--color-gold)] lg:text-[9px]">Lv{hero.level}</span>}
        </div>
        <div className={`mb-0.5 mt-0.5 w-fit rounded px-1 text-[6.5px] font-extrabold tracking-wide lg:text-[8px] ${hero.row === 'front' ? 'bg-[var(--color-gold)]/18 text-[var(--color-gold)]' : 'bg-white/8 text-white/40'}`}>
          {hero.row === 'front' ? '🛡️ FRONT' : '🎯 BACK'}
        </div>
        <HealthBar value={hero.hp} max={hero.maxHp} />
        <div className="mt-0.5 text-[7px] font-bold text-white/40 lg:text-[9px]">
          {Math.max(0, hero.hp)} / {hero.maxHp}
          {hero.block > 0 && <span className="ml-1 font-extrabold text-[#9fd0ff]">🛡{hero.block}</span>}
        </div>
      </div>
    </motion.div>
  );
}
