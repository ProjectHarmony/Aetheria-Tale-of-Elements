import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { getServerUrl, setServerUrl } from '@/net/socket';
import { loginOverServer, registerOverServer } from '@/net/accountSync';

type Mode = 'register' | 'login';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrlField] = useState(() => getServerUrl());
  const [showServerField, setShowServerField] = useState(() => !!getServerUrl());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = useGameStore((s) => s.register);
  const login = useGameStore((s) => s.login);
  const navigate = useNavigate();

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function submit() {
    setError('');
    setServerUrl(serverUrl);

    // A Server URL means this account/save is shared across the test server
    // (see the project's 5-person test-server plan) instead of this one
    // browser's own localStorage — leave it blank for the original fully-
    // local, single-device experience.
    if (serverUrl.trim()) {
      setBusy(true);
      try {
        if (mode === 'register') {
          const res = await registerOverServer(username, password);
          if (!res.ok) return setError(res.error);
        } else {
          const res = await loginOverServer(username, password);
          if (!res.ok) return setError(res.error);
        }
        navigate('/server-select');
      } catch {
        setError('Could not reach that server — check the URL and that it\'s running.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'register') {
      const res = register(username, password);
      if (!res.ok) return setError(res.error);
    } else {
      const res = login(username, password);
      if (!res.ok) return setError(res.error);
    }
    navigate('/server-select');
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 overflow-y-auto px-7 py-8">
      <motion.div className="flex gap-2 text-[38px]" animate={{ y: [0, -7, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
        <span>🔥</span>
        <span>🌊</span>
        <span>🌱</span>
        <span>🌪️</span>
      </motion.div>
      <div className="text-center">
        <div className="font-['Baloo_2'] text-[26px] font-extrabold text-[#2c1f3d]">Two Elements</div>
        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#2c1f3d]/70">Realm of Aetheria</div>
      </div>

      <div className="w-full max-w-[320px] rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 backdrop-blur-md">
        <div className="mb-3.5 flex gap-1.5">
          {(['register', 'login'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-full py-2 font-['Baloo_2'] text-[13px] font-bold transition-colors ${
                mode === m ? 'border border-[rgba(255,217,142,0.5)] bg-[rgba(255,217,142,0.14)] text-[var(--color-gold)]' : 'border border-transparent bg-white/5 text-white/50'
              }`}
            >
              {m === 'register' ? 'Register' : 'Log In'}
            </button>
          ))}
        </div>

        <div className="mb-2.5">
          <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Mage Name</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            autoComplete="off"
            placeholder="e.g. Stormcaller"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-[#fff8f0] outline-none focus:border-[rgba(255,217,142,0.55)]"
          />
        </div>
        <div className="mb-2">
          <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            maxLength={32}
            placeholder="••••••••"
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-[#fff8f0] outline-none focus:border-[rgba(255,217,142,0.55)]"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowServerField((v) => !v)}
          className="mb-2 w-full text-center text-[9px] font-bold uppercase tracking-wide text-white/40 underline decoration-dotted"
        >
          {showServerField ? 'Hide' : 'Playing on a friend\'s test server?'}
        </button>
        <AnimatePresence>
          {showServerField && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2.5 overflow-hidden">
              <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Server URL</label>
              <input
                value={serverUrl}
                onChange={(e) => setServerUrlField(e.target.value)}
                autoComplete="off"
                placeholder="http://192.168.x.x:4000"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-[#fff8f0] outline-none focus:border-[rgba(255,217,142,0.55)]"
              />
              <p className="mt-1 text-[8.5px] leading-snug text-white/35">Leave blank to play fully offline on this device, like normal. Paste the "Network" URL your host's server printed to share an account across devices.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2 text-center text-[11px] font-semibold text-[var(--color-danger)]">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={submit}
          disabled={busy}
          className="animate-gradient mt-1 w-full rounded-[13px] py-3 font-['Baloo_2'] text-[13px] font-extrabold uppercase tracking-wide text-[var(--color-gold-deep)] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg, var(--color-fire), var(--color-gold), var(--color-water))' }}
        >
          {busy ? 'Connecting…' : mode === 'register' ? 'Create Account' : 'Log In'}
        </motion.button>

        <p className="mt-3 text-center text-[9px] leading-relaxed text-white/35">
          Prototype build — accounts live in memory only and reset on refresh.
          <br />
          Real accounts arrive with the server backend.
        </p>
      </div>
    </div>
  );
}
