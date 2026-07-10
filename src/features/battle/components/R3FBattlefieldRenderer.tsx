import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BattlefieldRendererProps } from '@/systems/rendering/types';
import type { Element } from '@/types';

// Three.js Color can't resolve CSS custom properties, so the placeholder
// gets its own flat hex map — the real renderer will use material/texture
// assets instead of solid colors anyway.
const ELEMENT_HEX: Record<Element, string> = { fire: '#ff6b4a', water: '#4ecdc4', earth: '#a8c66c', wind: '#c9a8ff' };

/**
 * PLACEHOLDER — proves the render-layer seam works end to end (Canvas
 * mounts, R3F/Drei render, satisfies the exact same BattlefieldRendererProps
 * contract as DomBattlefieldRenderer), it is NOT production art. Each hero
 * is a colored box standing in for a rigged GLTF character + skeletal
 * animation clips (idle/walk/attack/skill/hurt/death), which don't exist
 * in this project yet. Swap the <Box> below for a real
 * <ElementCharacterModel hero={h} /> once assets exist and this becomes the
 * real 3D renderer — nothing outside this file needs to change, per
 * systems/rendering/types.ts.
 */
export function R3FBattlefieldRenderer({ battle, onTapHero }: BattlefieldRendererProps) {
  const allHeroes = [...battle.enemies, ...battle.players];

  return (
    <div className="relative flex-1 overflow-hidden">
      <Canvas camera={{ position: [0, 3, 6], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1} castShadow />
        {allHeroes.map((h, i) => {
          const isEnemy = battle.enemies.includes(h);
          const x = (i % 3) * 1.4 - 1.4;
          const z = isEnemy ? -1.5 : 1.5;
          return (
            <mesh
              key={h.id}
              position={[x, h.alive ? 0.5 : 0.15, z]}
              onClick={() => onTapHero(h.id)}
              castShadow
            >
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshStandardMaterial color={h.alive ? ELEMENT_HEX[h.el] : '#333333'} />
            </mesh>
          );
        })}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1d5536" />
        </mesh>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
