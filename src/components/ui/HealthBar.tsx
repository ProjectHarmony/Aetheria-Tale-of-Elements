import { motion } from 'framer-motion';

interface HealthBarProps {
  value: number;
  max: number;
}

export function HealthBar({ value, max }: HealthBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const low = pct <= 30;

  return (
    <div className="h-[5px] w-full overflow-hidden rounded-sm border border-white/10 bg-black/40">
      <motion.div
        className="h-full rounded-sm"
        style={{
          background: low
            ? 'linear-gradient(90deg,var(--color-danger),#ff8a9c)'
            : 'linear-gradient(90deg,var(--color-success),#8df0b8)',
        }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.3, 0.8, 0.4, 1] }}
      />
    </div>
  );
}
