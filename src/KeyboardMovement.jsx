import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Vector3 } from 'three';

export function KeyboardMovement({ controlsRef }) {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const moveDelta = useRef(new Vector3());
  const speed = 5;

  useFrame((_, delta) => {
    const { forward: moveForward, backward, left, right: moveRight } = getKeys();
    if (!moveForward && !backward && !left && !moveRight) return;

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

    moveDelta.current.normalize().multiplyScalar(speed * delta);
    camera.position.add(moveDelta.current);

    if (controlsRef.current?.target) {
      controlsRef.current.target.add(moveDelta.current);
      controlsRef.current.update();
    }
  });

  return null;
}
