import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const GATE_Z = 1.5;
const DOOR_WIDTH = 2;
const DOOR_HEIGHT = 4;
const DOOR_DEPTH = 0.15;
const OPEN_DURATION = 1.2;
// Hinge on outer edge (at the wall). Doors swing onto the walls, not into the center.
const LEFT_OPEN_ANGLE = -Math.PI / 2;
const RIGHT_OPEN_ANGLE = Math.PI / 2;
const ROOM_HALF_WIDTH = 2;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function GateDoors({ open }) {
  const leftRef = useRef();
  const rightRef = useRef();
  const openStartTime = useRef(null);

  useFrame((state) => {
    if (!open || !leftRef.current || !rightRef.current) return;
    if (openStartTime.current === null) openStartTime.current = state.clock.elapsedTime;
    const t = (state.clock.elapsedTime - openStartTime.current) / OPEN_DURATION;
    const s = smoothstep(t);
    const leftAngle = LEFT_OPEN_ANGLE * s;
    const rightAngle = RIGHT_OPEN_ANGLE * s;
    leftRef.current.rotation.y = leftAngle;
    rightRef.current.rotation.y = rightAngle;
  });

  return (
    <>
      {/* Left door: hinge at left wall (x=-2). Door extends from wall toward center. Opens onto left wall. */}
      <group ref={leftRef} position={[-ROOM_HALF_WIDTH, 0, GATE_Z]}>
        <mesh position={[DOOR_WIDTH / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, DOOR_DEPTH]} />
          <meshStandardMaterial color={0x3d2b1f} />
        </mesh>
      </group>
      {/* Right door: hinge at right wall (x=2). Door extends from center toward wall. Opens onto right wall. */}
      <group ref={rightRef} position={[ROOM_HALF_WIDTH, 0, GATE_Z]}>
        <mesh position={[-DOOR_WIDTH / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, DOOR_DEPTH]} />
          <meshStandardMaterial color={0x3d2b1f} />
        </mesh>
      </group>
    </>
  );
}
