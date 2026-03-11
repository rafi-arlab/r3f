import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/Starbuck.glb';
useGLTF.preload(MODEL_URL);

export function Cup() {
  const { scene } = useGLTF(MODEL_URL);
  const cloned = useMemo(() => {
    const s = scene.clone();
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return s;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={[0, -0.5, 0]}
      scale={10}
      castShadow
      receiveShadow
    />
  );
}
