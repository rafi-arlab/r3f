import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { IntroLogic } from './IntroLogic';
import { GateDoors } from './GateDoors';
import { CupGlowParticles } from './CupGlowParticles';
import { useHandDistance } from './useHandDistance';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);
  const [introTapped, setIntroTapped] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(true);

  const { rotationY } = useHandDistance({ enabled: introDone });

  useEffect(() => {
    if (!introDone) return;
    const t = setTimeout(() => setHintsVisible(false), 6000);
    return () => clearTimeout(t);
  }, [introDone]);

  return (
    <div id="canvas-container" className="canvas-wrapper" onClick={() => !introDone && setIntroTapped(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && !introDone && setIntroTapped(true)}>
      {/* Hints overlay */}
      <div className="hints" aria-live="polite">
        {!introTapped && (
          <p className="hint hint--tap">Tap to begin</p>
        )}
        {introTapped && !introDone && (
          <p className="hint hint--ready">Getting ready…</p>
        )}
        {introDone && (
          <p className={`hint hint--controls ${hintsVisible ? '' : 'hint--faded'}`}>
            Move your face to look around · Swipe to rotate the cup
          </p>
        )}
      </div>
      <Canvas shadows>
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

        {/* Room walls (all four with texture) */}
        <RoomWallPictures />

        <Cup scale={13} rotationY={rotationY} />
        <CupGlowParticles />

        {/* Gate doors — closed at start, swing open on tap */}
        <GateDoors open={introTapped} />

        <mesh name="floor" position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[4, 0.1, 4]} />
          <meshStandardMaterial color={0xffffff} />
        </mesh>

        <ambientLight intensity={1.2} />
        <spotLight
          intensity={12}
          position={[0, 0, 3]}
          penumbra={0.8}
          castShadow
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      </Canvas>
    </div>
  );
}

export default App;
