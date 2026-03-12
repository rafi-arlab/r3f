import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useFaceTracking } from './useFaceTracking';

export function FaceControlledOrbit({ controlsRef: externalControlsRef }) {
  const internalControlsRef = useRef();
  const controlsRef = externalControlsRef ?? internalControlsRef;
  const { facePosition, isReady } = useFaceTracking();

  useFrame(() => {
    if (!controlsRef.current || !isReady) return;

    const targetAzimuth = facePosition.x * Math.PI * 0.2;
    const targetPolar = (Math.PI / 2) + (facePosition.y * Math.PI * 0.05);

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
