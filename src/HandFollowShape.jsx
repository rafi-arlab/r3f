import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEPTH_NDC = 0.4; // 0 = at camera, 1 = far plane; keeps shape in front of scene

/**
 * Small subtle glowing ball that follows one hand position. handPosition is { x, y } normalized 0-1 (video coords).
 * inCenter: when true, shows green glow to indicate hand is in the center zone.
 */
export function HandFollowShape({ handPosition, inCenter = false }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const ndcRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!groupRef.current) return;
    if (!handPosition) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    const ndcX = 1 - handPosition.x * 2;
    const ndcY = 1 - handPosition.y * 2;
    ndcRef.current.set(ndcX, ndcY, DEPTH_NDC).unproject(camera);
    groupRef.current.position.copy(ndcRef.current);
  });

  const haloColor = inCenter ? '#90d4a0' : '#b8d4e8';
  const coreColor = inCenter ? '#c8f0d0' : '#e8f4fc';
  const haloOpacity = inCenter ? 0.42 : 0.25;

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={haloOpacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.014, 10, 10]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
