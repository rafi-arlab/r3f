import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {OrbitControls, GizmoHelper, GizmoViewcube, GizmoViewport, SpotLight} from '@react-three/drei';
import { useControls } from 'leva';
import { FaceControlledOrbit } from './FaceControlledOrbit';

function AnimatedBox() {
  const boxRef = useRef();
  const rotationSpeedRef = useRef(0);

  const { rotationSpeed, bounceSpeed } = useControls({
    rotationSpeed: {
      value: 0.01,
      min: 0.0,
      max: 0.1,
      step: 0.001,
    },
    bounceSpeed: {
      value: 0.5,
      min: 0.0,
      max: 3.0,
      step: 0.1,
    },
  });

  useFrame((state) => {
    if (!boxRef.current) return;
    boxRef.current.rotation.x += rotationSpeed;
    boxRef.current.rotation.y += rotationSpeed;
    boxRef.current.rotation.z += rotationSpeed;
    boxRef.current.position.y = Math.sin(state.clock.elapsedTime * bounceSpeed) * 0.8;
  });

  const handleClick = () => {
    console.log("hi")
  };

  return (
<mesh position={[0, 0, 0]} ref={boxRef} onClick={handleClick} castShadow>
    <boxGeometry/>
    <meshToonMaterial color={0x00bfff}/>
</mesh>
  );
}

function App() {
  const { useFaceTracking } = useControls('Camera', {
    useFaceTracking: {
      value: false,
      label: 'Face Tracking'
    }
  });

  return (
    <div id='canvas-container'>
  <Canvas shadows>
    // Gizmo Wrapper
    <GizmoHelper alignment='bottom-right' margin={[80, 80]}>
      <GizmoViewport/>
    </GizmoHelper>
    <gridHelper args={[20, 20, 0xff22aa, 0x55ccff]} />
    {useFaceTracking ? <FaceControlledOrbit /> : <OrbitControls />}
    <AnimatedBox />
    <mesh position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[10, 0.1, 10]} />
      <meshStandardMaterial color={0xffffff} />
    </mesh>
    <spotLight
      intensity={20}
      position={[0, 0, 3]}
      penumbra={0.5}
      castShadow
    />

  </Canvas>
    </div>
  );
}

export default App;