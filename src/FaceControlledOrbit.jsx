import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Tilt view higher (lower polar = camera more from above). Add more to raise the default angle.
const POLAR_OFFSET = 0.1;

/**
 * Sync orbit internal spherical angles from current camera position and target.
 * The zoom sets position/target directly, so orbit's angles are stale and would cause a jump.
 */
function syncOrbitAnglesFromCamera(controls, camera) {
  const delta = new THREE.Vector3()
    .copy(camera.position)
    .sub(controls.target);
  const radius = delta.length();
  if (radius < 1e-6) return;
  const azimuth = Math.atan2(delta.x, delta.z);
  const polar = Math.acos(THREE.MathUtils.clamp(delta.y / radius, -1, 1));
  controls.setAzimuthalAngle(azimuth);
  controls.setPolarAngle(polar);
}

export function FaceControlledOrbit({ controlsRef: externalControlsRef, facePosition, isReady }) {
  const internalControlsRef = useRef();
  const controlsRef = externalControlsRef ?? internalControlsRef;
  const { camera } = useThree();
  const hasSyncedRef = useRef(false);

  useFrame(() => {
    if (!controlsRef.current || !isReady) return;

    // First frame after intro: orbit angles are from pre-zoom; sync from actual camera/target so no jump
    if (!hasSyncedRef.current) {
      syncOrbitAnglesFromCamera(controlsRef.current, camera);
      hasSyncedRef.current = true;
    }

    const targetAzimuth = facePosition.x * Math.PI * 0.2;
    const targetPolar = (Math.PI / 2) + (facePosition.y * Math.PI * 0.05) - POLAR_OFFSET;
    const dampingFactor = 0.8;

    controlsRef.current.setAzimuthalAngle(
      controlsRef.current.getAzimuthalAngle() +
      (targetAzimuth - controlsRef.current.getAzimuthalAngle()) * dampingFactor
    );
    controlsRef.current.setPolarAngle(
      controlsRef.current.getPolarAngle() +
      (targetPolar - controlsRef.current.getPolarAngle()) * dampingFactor
    );
    controlsRef.current.update();
  });

  return <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} />;
}
