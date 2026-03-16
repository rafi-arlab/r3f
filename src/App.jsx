import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';

function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color('#faf3e8');
    return () => { scene.background = null; };
  }, [scene]);
  return null;
}
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { IntroLogic } from './IntroLogic';
import { GateDoors } from './GateDoors';
import { CupGlowParticles } from './CupGlowParticles';
import { CoffeeShopBackground } from './CoffeeShopBackground';
import { useHandDistance } from './useHandDistance';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);
  const [introTapped, setIntroTapped] = useState(false);

  const [swipeTrigger, setSwipeTrigger] = useState(0);
  const { rotationY, addRotation } = useHandDistance({
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
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>

        {introDone ? (
          <FaceControlledOrbit controlsRef={controlsRef} />
        ) : (
          <>
            <OrbitControls ref={controlsRef} enabled={false} />
            <IntroLogic controlsRef={controlsRef} tapped={introTapped} onDone={() => setIntroDone(true)} />
          </>
        )}

        <group scale={0.88}>
          <RoomWallPictures />
          <Cup scale={13} rotationY={rotationY} swipeTrigger={swipeTrigger} addRotation={addRotation} />
          <CupGlowParticles />
          <GateDoors open={introTapped} />
          <mesh name="floor" position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[4, 0.1, 4]} />
          <meshStandardMaterial color="#3d2914" roughness={0.9} metalness={0} />
        </mesh>
        <group position={[0, -1.08, -0.08]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.14, 1]} />
            <meshStandardMaterial color="#00704a" roughness={0.85} metalness={0} />
          </mesh>
          <mesh position={[0, 0.071, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.35, 0.06, 0.85]} />
            <meshStandardMaterial color="#f5f0e6" roughness={0.9} metalness={0} />
          </mesh>
        </group>
        <ambientLight intensity={0.7} />
        <spotLight
          intensity={6}
          position={[0, 1.2, 2.5]}
          angle={0.6}
          penumbra={0.8}
          castShadow
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-2.5, 0.3, 2]} intensity={2} />
        <directionalLight position={[2.5, 0.3, 2]} intensity={2} />
        <pointLight position={[0, 2.5, 0.5]} intensity={1.5} distance={8} />
        </group>
      </Canvas>
    </div>
  );
}

export default App;
