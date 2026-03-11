import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/Starbuck.glb';
useGLTF.preload(MODEL_URL);

// Cup transform — change these to adjust size, position, and rotation
const CUP_POSITION = [0, -1, 0];
const CUP_SCALE = 15;
const CUP_ROTATION = [0, -90.7, 0]; // [x, y, z] in radians (e.g. [0, Math.PI / 4, 0] = 45° around Y)

export function Cup() {
  const { scene } = useGLTF(MODEL_URL);
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

  return (
    <primitive
      object={cloned}
      position={CUP_POSITION}
      scale={CUP_SCALE}
      rotation={CUP_ROTATION}
      castShadow
      receiveShadow
    />
  );
}
