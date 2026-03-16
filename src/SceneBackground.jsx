import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const BACKGROUND_COLOR = '#faf3e8';

export function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(BACKGROUND_COLOR);
    return () => {
      scene.background = null;
    };
  }, [scene]);
  return null;
}
