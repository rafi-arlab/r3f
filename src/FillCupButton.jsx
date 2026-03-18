import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const BUTTON_WIDTH = 0.82;
const BUTTON_HEIGHT = 0.18;
const BUTTON_DEPTH = 0.12;
const HOVER_NDC_RADIUS = 0.09;

/**
 * 3D button: fills left-to-right with progress; text label on top. Active when full.
 * Supports hand hover (highlight) + pinch (press).
 */
export function FillCupButton({ startFill, isPouring, visible, disabled = false, collected = 0, total = 1, handPositions = [] }) {
  const groupRef = useRef();
  const baseMeshRef = useRef();
  const { camera } = useThree();
  const worldPos = useRef(new THREE.Vector3());
  const ndcPos = useRef(new THREE.Vector3());
  const didPinchRef = useRef(false);

  useFrame(() => {
    if (!groupRef.current || !baseMeshRef.current || !visible) return;

    groupRef.current.updateWorldMatrix(true, false);
    worldPos.current.setFromMatrixPosition(groupRef.current.matrixWorld);
    ndcPos.current.copy(worldPos.current).project(camera);
    const bx = ndcPos.current.x;
    const by = ndcPos.current.y;

    const handNdc = handPositions.map((p) => ({
      x: 1 - p.x * 2,
      y: 1 - p.y * 2,
      pinching: p.pinching ?? false
    }));

    let hovered = false;
    let pinched = false;
    for (const h of handNdc) {
      if (Math.hypot(bx - h.x, by - h.y) < HOVER_NDC_RADIUS) {
        hovered = true;
        if (h.pinching) pinched = true;
      }
    }

    const mat = baseMeshRef.current.material;
    const canAct = !disabled && !isPouring;
    if (hovered && canAct) {
      mat.emissive.setHex(0x8b7355);
      mat.emissiveIntensity = 0.5;
    } else {
      mat.emissive.setHex(0x1a1208);
      mat.emissiveIntensity = 1;
    }

    if (pinched && canAct && !didPinchRef.current) {
      didPinchRef.current = true;
      startFill();
    }
    if (!pinched) didPinchRef.current = false;
  });

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
    <group ref={groupRef} position={[1.25, -0.85, 0.2]}>
      <mesh
        ref={baseMeshRef}
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
          color="#3d2914"
          roughness={0.85}
          metalness={0}
          emissive="#1a1208"
        />
      </mesh>
      <group position={[(-0.5 + fillProgress * 0.5) * BUTTON_WIDTH, 0, BUTTON_DEPTH * 0.51]}>
        <mesh scale={[fillProgress, 1, 1]}>
          <boxGeometry args={[BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DEPTH * 0.02]} />
        <meshStandardMaterial
          color={isPouring ? '#5a4230' : '#6b5540'}
          roughness={0.85}
          metalness={0}
          emissive={isPouring ? '#2a1f12' : '#1a1208'}
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
