import { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { useFaceTracking } from './useFaceTracking';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { IntroLogic } from './IntroLogic';
import { GateDoors } from './GateDoors';
import { CupGlowParticles } from './CupGlowParticles';
import { CoffeeShopBackground } from './CoffeeShopBackground';
import { SceneBackground } from './SceneBackground';
import { RoomFloor } from './RoomFloor';
import { SceneLights } from './SceneLights';
import { useHandCenterTrigger } from './useHandCenterTrigger';
import { LiquidPour } from './LiquidPour';
import { useFillCup } from './useFillCup';
import { FillCupButton } from './FillCupButton';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);
  const [introTapped, setIntroTapped] = useState(false);
  const { isPouring, startFill } = useFillCup();
  const faceTracking = useFaceTracking();

  const [swipeTrigger, setSwipeTrigger] = useState(0);
  const { rotationY, addRotation } = useHandCenterTrigger({
    enabled: introDone,
    onSwipe: () => setSwipeTrigger((t) => t + 1)
  });

  return (
    <div id="canvas-container" className="canvas-wrapper" onClick={() => !introDone && setIntroTapped(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && !introDone && setIntroTapped(true)}>
      <Canvas shadows>
        <SceneBackground />
        <Suspense fallback={null}>
          <CoffeeShopBackground visible={!introDone} />
        </Suspense>

        {introDone ? (
          <FaceControlledOrbit controlsRef={controlsRef} facePosition={faceTracking.facePosition} isReady={faceTracking.isReady} />
        ) : (
          <>
            <OrbitControls ref={controlsRef} enabled={false} />
            <IntroLogic controlsRef={controlsRef} tapped={introTapped} onDone={() => setIntroDone(true)} />
          </>
        )}

        <group scale={0.88}>
          <RoomWallPictures />
          <FillCupButton startFill={startFill} isPouring={isPouring} visible={introDone} />
          <LiquidPour isPouring={isPouring} />
          <Cup scale={13} rotationY={rotationY} swipeTrigger={swipeTrigger} addRotation={addRotation} isPouring={isPouring} />
          <CupGlowParticles />
          <GateDoors open={introTapped} />
          <RoomFloor />
          <SceneLights />
        </group>
      </Canvas>
    </div>
  );
}

export default App;
