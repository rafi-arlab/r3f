import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useFaceTracking } from './useFaceTracking';

export function FaceControlledOrbit() {
  const controlsRef = useRef();
  const { facePosition, isReady } = useFaceTracking();

  useFrame(() => {
    if (!controlsRef.current || !isReady) return;

    // Map face position to orbit angles
    // x controls azimuthal angle (horizontal rotation)
    // y controls polar angle (vertical rotation)
    const targetAzimuth = facePosition.x * Math.PI * 0.5; // ±90 degrees
    const targetPolar = (Math.PI / 2) + (facePosition.y * Math.PI * 0.3); // ±54 degrees from center

    // Smoothly interpolate current angles toward target
    const dampingFactor = 0.25;
    
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
