import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

/** One real server — no other-world infrastructure exists yet ("assume
 *  there's one, I will provide hosting"). Picking it just records a
 *  cosmetic choice (gameStore.selectedServer) and continues on to Character
 *  Select, where an existing character resumes or a new one gets created. */
const SERVER = { id: 'aetheria-1', name: 'Aetheria — World 1', sub: 'Recommended · Low population' };

export function ServerSelectPage() {
  const setSelectedServer = useGameStore((s) => s.setSelectedServer);
  const navigate = useNavigate();

  function pick() {
    setSelectedServer(SERVER.id);
    navigate('/character-select');
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pb-2 pt-6 text-center">
        <div className="font-['Baloo_2'] text-lg font-extrabold text-[#2c1f3d]">Two Elements</div>
        <div className="mt-1.5 inline-block rounded-full border border-white/14 bg-[var(--panel-bg)] px-3.5 py-1 text-[10.5px] font-bold text-[var(--color-gold)]">
          Choose a Server
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={pick}
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-white/12 bg-[var(--panel-bg)] p-4 text-left backdrop-blur-md"
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--color-success)]" />
            <div className="min-w-0 flex-1">
              <div className="font-['Baloo_2'] text-[13px] font-extrabold text-[#fff8f0]">{SERVER.name}</div>
              <div className="mt-0.5 text-[9.5px] font-semibold text-white/45">{SERVER.sub}</div>
            </div>
            <span className="flex-shrink-0 font-['Baloo_2'] text-[10.5px] font-extrabold text-[var(--color-gold)]">Connect →</span>
          </motion.button>
        </div>

        <p className="mt-4 text-center text-[9px] leading-relaxed text-white/35">
          Prototype build — one server, self-hosted for testing. More worlds arrive with the real launch infrastructure.
        </p>
      </div>
    </div>
  );
}
