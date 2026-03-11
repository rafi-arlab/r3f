import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useControls } from 'leva';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { Cup } from './Cup';
import { RoomWallPictures } from './RoomWallPictures';
import { IntroLogic } from './IntroLogic';

function App() {
  const controlsRef = useRef();
  const [introDone, setIntroDone] = useState(false);

  const { useFaceTracking } = useControls('Camera', {
    useFaceTracking: {
      value: false,
      label: 'Face Tracking'
    }
  });

  return (
    <div id="canvas-container">
      <Canvas shadows>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>

        {useFaceTracking ? (
          <FaceControlledOrbit controlsRef={controlsRef} />
        ) : (
          <>
            <OrbitControls ref={controlsRef} enabled={introDone} />
            {!introDone && <IntroLogic controlsRef={controlsRef} onDone={() => setIntroDone(true)} />}
          </>
        )}

        {/* Room walls (all four with texture) */}
        <RoomWallPictures />

        <Cup />

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
