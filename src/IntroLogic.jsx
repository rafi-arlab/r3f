import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const DELAY_AFTER_TAP = 0.6;
const INTRO_ZOOM_DURATION = 1;
const ZOOM_FACTOR = 0.5

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function IntroLogic({ controlsRef, tapped, onDone }) {
  const { camera } = useThree();
  const startPos = useRef(null);
  const startTarget = useRef(null);
  const endPos = useRef(null);
  const doneFired = useRef(false);
  const tapTimeRef = useRef(null);

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

    if (tapped && tapTimeRef.current === null) {
      tapTimeRef.current = t;
    }
    const zoomStartTime = tapTimeRef.current !== null ? tapTimeRef.current + DELAY_AFTER_TAP : Infinity;

    if (t < zoomStartTime) {
      camera.position.copy(startPos.current);
      controls.target.copy(startTarget.current);
      controls.update?.();
      return;
    }

    const zoomT = (t - zoomStartTime) / INTRO_ZOOM_DURATION;
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
