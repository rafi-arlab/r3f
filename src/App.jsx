import { useRef, useState, Suspense, useEffect, useCallback } from 'react';
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
import { HandFollowShape } from './HandFollowShape';
import { CoffeeBeans, TOTAL_BEANS } from './CoffeeBeans';
import { BeanProgressBar } from './BeanProgressBar';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);
  const [introTapped, setIntroTapped] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const addRotation = useCallback((delta) => setRotationY((r) => r + delta), []);
  const { isPouring, startFill } = useFillCup({
    onPourComplete: () => setSpinTrigger((t) => t + 1)
  });
  const faceTracking = useFaceTracking();

  const [collectedBeanCount, setCollectedBeanCount] = useState(0);
  const prevIntroDoneRef = useRef(false);
  const { handPositions } = useHandCenterTrigger({ enabled: true });

  useEffect(() => {
    if (introDone && !prevIntroDoneRef.current) setCollectedBeanCount(0);
    prevIntroDoneRef.current = introDone;
  }, [introDone]);

  const pourUnlocked = collectedBeanCount >= TOTAL_BEANS;

  return (
    <div id="canvas-container" className="canvas-wrapper" onClick={() => !introDone && setIntroTapped(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && !introDone && setIntroTapped(true)}>
      <BeanProgressBar
        visible={introDone}
        collected={collectedBeanCount}
        total={TOTAL_BEANS}
      />
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

        {handPositions.map((pos, i) => (
          <HandFollowShape key={i} handPosition={pos} />
        ))}
        <group scale={0.88}>
          <RoomWallPictures />
          <CoffeeBeans handPositions={handPositions} collectedCount={collectedBeanCount} onCollect={() => setCollectedBeanCount((c) => Math.min(TOTAL_BEANS, c + 1))} />
          <FillCupButton startFill={startFill} isPouring={isPouring} visible={introDone} disabled={!pourUnlocked} collected={collectedBeanCount} total={TOTAL_BEANS} />
          <LiquidPour isPouring={isPouring} />
          <Cup scale={13} rotationY={rotationY} swipeTrigger={spinTrigger} addRotation={addRotation} isPouring={isPouring} />
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
