import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import './App.css';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { useFaceTracking } from './useFaceTracking';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { CupGlowParticles } from './CupGlowParticles';
import { SceneBackground } from './SceneBackground';
import { RoomFloor } from './RoomFloor';
import { SceneLights } from './SceneLights';
import { useHandCenterTrigger } from './useHandCenterTrigger';
import { LiquidPour } from './LiquidPour';
import { useFillCup } from './useFillCup';
import { FillCupButton } from './FillCupButton';
import { HandFollowShape } from './HandFollowShape';
import { CoffeeBeans, TOTAL_BEANS } from './CoffeeBeans';
import { HandDebugOverlay } from './HandDebugOverlay';

const BASE_SCALE = 0.88;
const REF_WIDTH = 1024;
const MIN_VIEWPORT_SCALE = 0.7;
const MAX_VIEWPORT_SCALE = 1.1;

function ResponsiveScene({ children }) {
  const { size } = useThree();
  const scale = useMemo(() => {
    const s = Math.max(MIN_VIEWPORT_SCALE, Math.min(MAX_VIEWPORT_SCALE, size.width / REF_WIDTH));
    return BASE_SCALE * s;
  }, [size.width]);
  return <group scale={[scale, scale, scale]}>{children}</group>;
}

function App() {
  const controlsRef = useRef();
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const addRotation = useCallback((delta) => setRotationY((r) => r + delta), []);
  const { isPouring, startFill } = useFillCup({
    onPourComplete: () => setSpinTrigger((t) => t + 1)
  });
  const faceTracking = useFaceTracking();

  const [collectedBeanCount, setCollectedBeanCount] = useState(0);
  const { handPositions, rawLandmarks, videoRef } = useHandCenterTrigger({ enabled: true });

  const pourUnlocked = collectedBeanCount >= TOTAL_BEANS;

  return (
    <>
    <HandDebugOverlay videoRef={videoRef} rawLandmarks={rawLandmarks} />
    <div id="canvas-container" className="canvas-wrapper">
      <Canvas shadows camera={{ position: [0, 0, 3], fov: 50 }}>
        <SceneBackground />

        <FaceControlledOrbit controlsRef={controlsRef} facePosition={faceTracking.facePosition} isReady={faceTracking.isReady} />

        {handPositions.map((pos, i) => (
          <HandFollowShape key={i} handPosition={pos} />
        ))}
        <ResponsiveScene>
          <RoomWallPictures />
          <CoffeeBeans handPositions={handPositions} collectedCount={collectedBeanCount} onCollect={() => setCollectedBeanCount((c) => Math.min(TOTAL_BEANS, c + 1))} />
          <FillCupButton startFill={startFill} isPouring={isPouring} visible disabled={!pourUnlocked} collected={collectedBeanCount} total={TOTAL_BEANS} handPositions={handPositions} />
          <LiquidPour isPouring={isPouring} />
          <Cup scale={13} rotationY={rotationY} swipeTrigger={spinTrigger} addRotation={addRotation} isPouring={isPouring} />
          <CupGlowParticles />
          <RoomFloor />
          <SceneLights />
        </ResponsiveScene>
      </Canvas>
    </div>
    </>
  );
}

export default App;
