import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const LID_URL = '/models/lid.glb';
useGLTF.preload(LID_URL);

const CUP_ROTATION = [-0.2, -90.7, 0.1];
const LID_BASE_Y = -1;
const LIFT_OFFSET = 0.4;
const RIGHT_OFFSET = 0.28;
const OPEN_ROTATION_Y = -0.55;
const OPEN_TILT_Z = 0.45;
const LERP_SPEED = 4;

// When attached to cup (child): position/offsets in cup local space (parent scale = 13)
const INV_SCALE = 1 / 13;
const LID_BASE_Y_LOCAL = 0 * INV_SCALE; // 0.1 world units above cup center
const LIFT_OFFSET_LOCAL = LIFT_OFFSET * INV_SCALE;
const RIGHT_OFFSET_LOCAL = RIGHT_OFFSET * INV_SCALE;

export function Lid({ isPouring, rotationY = 0, scale = 13, attached = false }) {
  const { scene } = useGLTF(LID_URL);
  const openRef = useRef(0);
  const groupRef = useRef();

  const baseY = attached ? LID_BASE_Y_LOCAL : LID_BASE_Y;
  const liftOff = attached ? LIFT_OFFSET_LOCAL : LIFT_OFFSET;
  const rightOff = attached ? RIGHT_OFFSET_LOCAL : RIGHT_OFFSET;
  const lidScale = attached ? 1 : scale;

  useFrame((_, delta) => {
    const target = isPouring ? 1 : 0;
    openRef.current += (target - openRef.current) * Math.min(1, LERP_SPEED * delta);
    if (groupRef.current) {
      const t = openRef.current;
      groupRef.current.position.x = t * rightOff;
      groupRef.current.position.y = baseY + t * liftOff;
      if (attached) {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = t * OPEN_ROTATION_Y;
        groupRef.current.rotation.z = t * OPEN_TILT_Z;
      } else {
        groupRef.current.rotation.x = CUP_ROTATION[0];
        groupRef.current.rotation.y = CUP_ROTATION[1] + rotationY + t * OPEN_ROTATION_Y;
        groupRef.current.rotation.z = CUP_ROTATION[2] + t * OPEN_TILT_Z;
      }
    }
  });

  const cloned = useMemo(() => {
    const s = scene.clone();
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          const m = mat.clone();
          m.roughness = 1;
          m.metalness = 0;
          child.material = Array.isArray(child.material) ? [m] : m;
        }
      }
    });
    return s;
  }, [scene]);

  const rotation = attached ? [0, 0, 0] : [CUP_ROTATION[0], CUP_ROTATION[1] + rotationY, CUP_ROTATION[2]];

  return (
    <group ref={groupRef} position={[0, baseY, 0]} scale={lidScale} rotation={rotation}>
      <primitive object={cloned} castShadow receiveShadow />
    </group>
  );
}
