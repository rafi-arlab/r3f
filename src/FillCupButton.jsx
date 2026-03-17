import { Html } from '@react-three/drei';

const BUTTON_WIDTH = 0.82;
const BUTTON_HEIGHT = 0.18;
const BUTTON_DEPTH = 0.12;

/**
 * 3D button: fills left-to-right with progress; text label on top. Active when full.
 */
export function FillCupButton({ startFill, isPouring, visible, disabled = false, collected = 0, total = 1 }) {
  if (!visible) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || isPouring) return;
    startFill();
  };

  const progress = total > 0 ? Math.min(1, collected / total) : 0;
  const fillProgress = isPouring ? 1 : progress;
  const canClick = !disabled && !isPouring;

  const label = isPouring ? 'Pouring…' : disabled ? 'Collect beans first' : 'Press to fill';

  return (
    <group position={[1.25, -0.85, 0.2]}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = isPouring || disabled ? 'default' : 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DEPTH]} />
        <meshStandardMaterial
          color="#1e3329"
          roughness={0.85}
          metalness={0}
          emissive="#0a1510"
        />
      </mesh>
      <group position={[(-0.5 + fillProgress * 0.5) * BUTTON_WIDTH, 0, BUTTON_DEPTH * 0.51]}>
        <mesh scale={[fillProgress, 1, 1]}>
          <boxGeometry args={[BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DEPTH * 0.02]} />
        <meshStandardMaterial
          color={isPouring ? '#005a3a' : '#00704a'}
          roughness={0.85}
          metalness={0}
          emissive={isPouring ? '#002a1a' : '#001a0e'}
        />
        </mesh>
      </group>
      <Html position={[0, 0, BUTTON_DEPTH * 0.6]} center transform distanceFactor={2.5} style={{ pointerEvents: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', userSelect: 'none', whiteSpace: 'nowrap' }}>
        <div role="button" tabIndex={0} onClick={handleClick} onKeyDown={(e) => e.key === 'Enter' && handleClick(e)} style={{ cursor: canClick ? 'pointer' : 'default' }}>
          {label}
        </div>
      </Html>
    </group>
  );
}
