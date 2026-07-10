import { AnimatePresence, motion } from 'framer-motion';

interface LogStripProps {
  message: string;
}

export function LogStrip({ message }: LogStripProps) {
  return (
    <div className="relative z-10 mx-3 mt-1.5 flex items-center gap-1.5 overflow-hidden rounded-[9px] border border-white/8 bg-[#0e0918]/70 px-2.5 py-1.5 text-[10px] font-medium text-white/55">
      <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-gold)]" />
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
