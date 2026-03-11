import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const INTRO_WAIT = 3;
const INTRO_ZOOM_DURATION = 2;
const ZOOM_FACTOR = 0.65;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function IntroLogic({ controlsRef, onDone }) {
  const { camera } = useThree();
  const startPos = useRef(null);
  const startTarget = useRef(null);
  const endPos = useRef(null);
  const doneFired = useRef(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const controls = controlsRef?.current;

    if (!controls?.target) return;
    controls.enabled = false;

    if (startPos.current === null) {
      startPos.current = camera.position.clone();
      startTarget.current = controls.target.clone();
      const dir = startPos.current.clone().sub(startTarget.current);
      endPos.current = startTarget.current.clone().add(dir.multiplyScalar(ZOOM_FACTOR));
    }

    if (t < INTRO_WAIT) {
      camera.position.copy(startPos.current);
      controls.target.copy(startTarget.current);
      controls.update?.();
      return;
    }

    const zoomT = (t - INTRO_WAIT) / INTRO_ZOOM_DURATION;
    if (zoomT >= 1) {
      camera.position.copy(endPos.current);
      controls.target.copy(startTarget.current);
      controls.update?.();
      if (!doneFired.current) {
        doneFired.current = true;
        onDone();
      }
      return;
    }

    const s = smoothstep(zoomT);
    camera.position.lerpVectors(startPos.current, endPos.current, s);
    controls.target.copy(startTarget.current);
    controls.update?.();
  });

  return null;
}
