import { useRosterStore } from '@/stores/rosterStore';

/** Placeholder swatch palette — stored as plain hex strings on the Party
 *  (see gameStore.createParty's appearance param). No real character art
 *  exists yet (MageSprite is a faceless/hairless mascot design), so these
 *  don't visually change anything today; they just capture the player's
 *  choice for whenever real portrait/sprite art lands. */
const HAIR_SWATCHES = ['#2b1a12', '#5c3a21', '#8a5a2e', '#c99a4a', '#e8d6a8', '#d94f4f', '#4a4a52', '#f2f2f2'];
const EYE_SWATCHES = ['#3a2b1f', '#2f6b3f', '#2f5f8f', '#8a5fbf', '#c9863f', '#4a4a52', '#1a1a1f', '#7fb8c9'];

function SwatchRow({ swatches, value, onPick }: { swatches: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className="h-9 w-9 rounded-full border-2 transition-transform"
          style={{ background: c, borderColor: value === c ? 'var(--color-gold)' : 'rgba(255,255,255,0.2)', transform: value === c ? 'scale(1.12)' : 'scale(1)' }}
          aria-label={`Choose ${c}`}
        />
      ))}
    </div>
  );
}

export function AppearanceStep() {
  const characterName = useRosterStore((s) => s.characterName);
  const hairColor = useRosterStore((s) => s.hairColor);
  const eyeColor = useRosterStore((s) => s.eyeColor);
  const setCharacterName = useRosterStore((s) => s.setCharacterName);
  const setHairColor = useRosterStore((s) => s.setHairColor);
  const setEyeColor = useRosterStore((s) => s.setEyeColor);

  return (
    <div>
      <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Create your character</div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3.5">
        <label className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Character's Name</label>
        <input
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          maxLength={20}
          autoComplete="off"
          placeholder="e.g. Astrid"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm text-[#fff8f0] outline-none focus:border-[rgba(255,217,142,0.55)]"
        />
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3.5">
        <label className="mb-2 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Hair Color</label>
        <SwatchRow swatches={HAIR_SWATCHES} value={hairColor} onPick={setHairColor} />
      </div>

      <div className="mb-2 rounded-2xl border border-white/10 bg-black/20 p-3.5">
        <label className="mb-2 block text-[9.5px] font-bold uppercase tracking-wide text-white/45">Eye Color</label>
        <SwatchRow swatches={EYE_SWATCHES} value={eyeColor} onPick={setEyeColor} />
      </div>

      <div className="mt-2 text-center text-[9px] leading-relaxed text-white/35">
        🎨 Character art is still in production — these choices are saved now and will show once portraits arrive.
      </div>
    </div>
  );
}
