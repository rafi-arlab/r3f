import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useControls } from 'leva';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { Cup } from './Cup';

function App() {
  const controlsRef = useRef();

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
          <OrbitControls ref={controlsRef} />
        )}

        {/* Room around the cup */}
        <group position={[0, 0, -1]} name="room">
          <mesh name="left wall" position={[-2, 0, -1.25]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 4, 8]} />
            <meshStandardMaterial color={0x2d4a2d} />
          </mesh>
          <mesh name="right wall" position={[2, 0, -1.25]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 4, 8]} />
            <meshStandardMaterial color={0x2d4a2d} />
          </mesh>
          <mesh name="bottom wall" position={[0, -2, -1.25]} castShadow receiveShadow>
            <boxGeometry args={[4, 0.1, 8]} />
            <meshStandardMaterial color={0xd4c4a8} />
          </mesh>
          <mesh name="top wall" position={[0, 2, -1.25]} castShadow receiveShadow>
            <boxGeometry args={[4, 0.1, 8]} />
            <meshStandardMaterial color={0xd4c4a8} />
          </mesh>
        </group>

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
