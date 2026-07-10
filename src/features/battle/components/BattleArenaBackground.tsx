/**
 * A real illustrated arena instead of a flat gradient blob — sky, distant
 * hills, and a proper ground plane, matching the layered-scenery look of a
 * classic side-view battle stage (sky → horizon → ground, with a couple of
 * silhouetted landmarks for depth). Pure CSS/SVG, no image assets, so it
 * stays in the same "code-drawn" art style as MageSprite.
 */
export function BattleArenaBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* sky */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #f3d9f7 0%, #ffe3ea 38%, #ffedd6 62%, #fff6e0 78%)' }}
      />
      {/* sun/glow */}
      <div
        className="absolute h-24 w-24 rounded-full lg:h-32 lg:w-32"
        style={{ top: '6%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,235,190,0.9), transparent 70%)' }}
      />
      {/* distant hills — three soft overlapping mounds along the horizon */}
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[26%] h-[22%] w-full">
        <path d="M0 100 Q 60 40 130 70 T 260 60 T 400 75 V100 Z" fill="#d9b9e8" opacity="0.55" />
        <path d="M0 100 Q 90 60 180 85 T 400 80 V100 Z" fill="#c7a8dd" opacity="0.5" />
      </svg>
      {/* rock silhouettes, upper corners, for depth — echoes the reference's framing rocks */}
      <svg viewBox="0 0 60 60" className="absolute left-1 top-1 h-10 w-10 opacity-30 lg:h-14 lg:w-14">
        <path d="M5 55 L15 15 L30 30 L40 10 L55 55 Z" fill="#8a6a9c" />
      </svg>
      <svg viewBox="0 0 60 60" className="absolute right-1 top-1 h-10 w-10 opacity-30 lg:h-14 lg:w-14">
        <path d="M5 55 L20 20 L32 35 L45 12 L55 55 Z" fill="#8a6a9c" />
      </svg>
      {/* ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{ background: 'linear-gradient(180deg, #f2d9ad 0%, #e8c690 45%, #d9b378 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-[30%] h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 20%, rgba(255,255,255,0.6) 80%, transparent)' }}
      />
    </div>
  );
}
