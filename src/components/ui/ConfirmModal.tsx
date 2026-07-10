import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-2.5 font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">{title}</div>
            <div className="mb-5 text-[13px] leading-relaxed text-white/75">{description}</div>
            <div className="flex gap-2.5">
              <button onClick={onCancel} className="flex-1 rounded-[13px] border-[1.5px] border-white/18 bg-white/8 py-3 font-['Baloo_2'] text-[13px] font-extrabold text-white/70">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-[13px] py-3 font-['Baloo_2'] text-[13px] font-extrabold text-[var(--color-gold-deep)]"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
