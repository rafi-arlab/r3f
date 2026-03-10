import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Vector3 } from 'three';

const BLUR_SMOOTH = 6; // how fast blur ramps up/down

export function KeyboardMovement({ controlsRef, sprintBlurRef }) {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const moveDelta = useRef(new Vector3());
  const speed = 5;
  const sprintSpeed = 12;
  const blurValue = useRef(0);

  useFrame((_, delta) => {
    const { forward: moveForward, backward, left, right: moveRight, sprint } = getKeys();
    const anyMove = moveForward || backward || left || moveRight;

    // Smooth sprint blur intensity: 1 when moving + sprint held, 0 otherwise
    const targetBlur = anyMove && sprint ? 1 : 0;
    blurValue.current += (targetBlur - blurValue.current) * Math.min(1, delta * BLUR_SMOOTH);
    if (sprintBlurRef) sprintBlurRef.current = blurValue.current;

    if (!anyMove) return;

    const moveSpeed = sprint ? sprintSpeed : speed;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    if (forward.current.lengthSq() > 0) {
      forward.current.normalize();
    }

    right.current.crossVectors(forward.current, camera.up).normalize();

    moveDelta.current.set(0, 0, 0);
    if (moveForward) moveDelta.current.add(forward.current);
    if (backward) moveDelta.current.sub(forward.current);
    if (moveRight) moveDelta.current.add(right.current);
    if (left) moveDelta.current.sub(right.current);

    if (moveDelta.current.lengthSq() === 0) return;

    moveDelta.current.normalize().multiplyScalar(moveSpeed * delta);
    camera.position.add(moveDelta.current);

    if (controlsRef.current?.target) {
      controlsRef.current.target.add(moveDelta.current);
      controlsRef.current.update();
    }
  });

  return null;
}
