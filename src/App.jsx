import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { IntroLogic } from './IntroLogic';
import { GateDoors } from './GateDoors';
import { useHandDistance } from './useHandDistance';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);
  const [introTapped, setIntroTapped] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(true);

  const { pinchSize, rotationY } = useHandDistance({ enabled: introDone });

  // Fade out the "look around / rotate / pinch" hint after a few seconds
  useEffect(() => {
    if (!introDone) return;
    const t = setTimeout(() => setHintsVisible(false), 6000);
    return () => clearTimeout(t);
  }, [introDone]);

  // Map pinch (thumb–index distance, normalized) to cup scale between 5 and 15
  const cupScale = (() => {
    const MIN_SCALE = 5;
    const MAX_SCALE = 15;
    const PINCH_MIN = 0.02;
    const PINCH_MAX = 0.18;
    if (pinchSize == null) return 10;
    const t = (pinchSize - PINCH_MIN) / (PINCH_MAX - PINCH_MIN);
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, MIN_SCALE + t * (MAX_SCALE - MIN_SCALE)));
  })();

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
            Move your face to look around · Swipe to rotate the cup · Pinch to resize
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

        <Cup scale={cupScale} rotationY={rotationY} />

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
