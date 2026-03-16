import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/Starbuck.glb';
useGLTF.preload(MODEL_URL);

const CUP_POSITION = [0, -1, 0];
const CUP_ROTATION = [-0.2, -90.7, 0.1];

const DEFAULT_SCALE = 10;

// Jump animation: shrink -> jump up + scale up + 360° -> land
const DURATION_SHRINK = 0.2;
const DURATION_JUMP = 0.5;
const DURATION_LAND = 0.5;
const JUMP_TOTAL = DURATION_SHRINK + DURATION_JUMP + DURATION_LAND;
const JUMP_HEIGHT = 1.0;
const SHRINK_SCALE = 9;
const TWO_PI = Math.PI * 2;

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

export function Cup({ scale: scaleProp, rotationY: rotationYProp = 0, swipeTrigger = 0, addRotation }) {
  const scale = scaleProp ?? DEFAULT_SCALE;
  const rotationY = rotationYProp ?? 0;
  const [animating, setAnimating] = useState(false);
  const animTimeRef = useRef(0);
  const addRotationRef = useRef(addRotation);
  addRotationRef.current = addRotation;
  const { scene } = useGLTF(MODEL_URL);

  useEffect(() => {
    if (swipeTrigger > 0) {
      setAnimating(true);
      animTimeRef.current = 0;
    }
  }, [swipeTrigger]);

  const groupRef = useRef();

  useFrame((_state, delta) => {
    if (!animating || !groupRef.current) return;
    animTimeRef.current += delta;
    const t = animTimeRef.current;

    if (t >= JUMP_TOTAL) {
      groupRef.current.position.y = CUP_POSITION[1];
      groupRef.current.scale.setScalar(scale);
      addRotationRef.current?.(TWO_PI);
      setAnimating(false);
      return;
    }

    let animY = 0, animScale = scale, animRot = 0;
    if (t < DURATION_SHRINK) {
      const u = t / DURATION_SHRINK;
      animScale = scale + (SHRINK_SCALE - scale) * u;
    } else if (t < DURATION_SHRINK + DURATION_JUMP) {
      const u = (t - DURATION_SHRINK) / DURATION_JUMP;
      animY = JUMP_HEIGHT * easeOutQuad(u);
      animScale = SHRINK_SCALE + (scale - SHRINK_SCALE) * u;
      animRot = TWO_PI * u;
    } else {
      const u = (t - DURATION_SHRINK - DURATION_JUMP) / DURATION_LAND;
      animY = JUMP_HEIGHT * (1 - u);
      animRot = TWO_PI;
    }
    groupRef.current.position.y = CUP_POSITION[1] + animY;
    groupRef.current.scale.setScalar(animScale);
    groupRef.current.rotation.y = CUP_ROTATION[1] + rotationY + animRot;
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

  const rotation = [CUP_ROTATION[0], CUP_ROTATION[1] + rotationY, CUP_ROTATION[2]];

  return (
    <group ref={groupRef} position={CUP_POSITION} scale={scale} rotation={rotation}>
      <primitive object={cloned} castShadow receiveShadow />
    </group>
  );
}
