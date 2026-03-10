import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {OrbitControls, GizmoHelper, GizmoViewcube, GizmoViewport, KeyboardControls, SpotLight} from '@react-three/drei';
import { useControls } from 'leva';
import { FaceControlledOrbit } from './FaceControlledOrbit';
import { GradientShaderMaterial } from './GradientShader';
import { ExplodingModel } from './ExplodingModel';
import { KeyboardMovement } from './KeyboardMovement';

const keyboardMap = [
  { name: 'forward', keys: ['KeyW'] },
  { name: 'backward', keys: ['KeyS'] },
  { name: 'left', keys: ['KeyA'] },
  { name: 'right', keys: ['KeyD'] }
];

function App() {
  const controlsRef = useRef();

  const { useFaceTracking } = useControls('Camera', {
    useFaceTracking: {
      value: false,
      label: 'Face Tracking'
    }
  });

  return (
    <div id='canvas-container'>
  <KeyboardControls map={keyboardMap}>
  <Canvas shadows>
    <GizmoHelper alignment='bottom-right' margin={[80, 80]}>
      <GizmoViewport/>
    </GizmoHelper>
    <gridHelper args={[20, 20, 0xff22aa, 0x55ccff]} />
    {useFaceTracking ? <FaceControlledOrbit controlsRef={controlsRef} /> : <OrbitControls ref={controlsRef} />}
    <KeyboardMovement controlsRef={controlsRef} />
    <ExplodingModel />
    
    {/* Simple box with gradient shader - try changing the colors! */}
    <mesh position={[5, 0.5, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <GradientShaderMaterial colorA="#ff22aa" colorB="#55ccff" />
    </mesh>
    
    <mesh position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[10, 0.1, 10]} />
      <meshStandardMaterial color={0xffffff} />
    </mesh>
    <spotLight
      intensity={40}
      position={[0, 0, 3]}
      penumbra={0.5}
      castShadow
      shadow-bias={-0.0002}
      shadow-normalBias={0.02}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    />
<ambientLight intensity={0.5} />
  </Canvas>
  </KeyboardControls>
    </div>
  );
}

export default App;