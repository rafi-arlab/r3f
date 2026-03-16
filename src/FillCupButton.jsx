import { Html } from '@react-three/drei';

/**
 * 3D button in the scene: a box above the cup that matches the room (plinth) design.
 * Tap/click the box to start filling the cup.
 */
export function FillCupButton({ startFill, isPouring, visible }) {
  if (!visible) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isPouring) startFill();
  };

  return (
    <group position={[1.25, -0.85, 0.2]}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = isPouring ? 'default' : 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[0.7, 0.14, 0.12]} />
        <meshStandardMaterial
          color={isPouring ? '#005a3a' : '#00704a'}
          roughness={0.85}
          metalness={0}
          emissive={isPouring ? '#002a1a' : '#000000'}
        />
      </mesh>
      <Html
        position={[0, 0, 0]}
        center
        transform
        distanceFactor={2.5}
        style={{
          pointerEvents: 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          userSelect: 'none',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
          style={{ cursor: isPouring ? 'default' : 'pointer' }}
        >
          {isPouring ? 'Pouring…' : 'Press to fill'}
        </div>
      </Html>
    </group>
  );
}
