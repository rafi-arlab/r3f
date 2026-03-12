import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/Starbuck.glb';
useGLTF.preload(MODEL_URL);

// Cup transform — change these to adjust position and rotation; scale can be driven by hand distance
const CUP_POSITION = [0, -1, 0];
const CUP_ROTATION = [-0.2, -90.7, 0.1]; // [x, y, z] in radians (e.g. [0, Math.PI / 4, 0] = 45° around Y)

/** Default scale when hand distance is not available */
const DEFAULT_SCALE = 10;

export function Cup({ scale: scaleProp, rotationY: rotationYProp = 0 }) {
  const scale = scaleProp ?? DEFAULT_SCALE;
  const rotationY = rotationYProp ?? 0;
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

  const rotation = [CUP_ROTATION[0], CUP_ROTATION[1] + rotationY, CUP_ROTATION[2]];

  return (
    <primitive
      object={cloned}
      position={CUP_POSITION}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}
