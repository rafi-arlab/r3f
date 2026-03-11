import { Suspense } from 'react';
import { useTexture } from '@react-three/drei';

// Change this to your image path (file in public/ → use "/filename.jpg")
const IMAGE_PATH = '/Pattern overlay2.png';
const IMAGE_PATH_2 = '/Pattern overlay.png';


const ROOM_GROUP_POSITION = [0, 0, 1.5];
const WALL_CENTER_Z = -1.25;

function WallsWithTexture() {
  const texture = useTexture(IMAGE_PATH);
  const texture2 = useTexture(IMAGE_PATH_2);
  const wallMaterial = <meshStandardMaterial color="#ffffff" map={texture} />;
  const wallMaterial2 = <meshStandardMaterial color="#ffffff" map={texture2} />;

  return (
    <group position={ROOM_GROUP_POSITION} name="room">
      <mesh name="left wall" position={[-2, 0, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        {wallMaterial}
      </mesh>
      <mesh name="right wall" position={[2, 0, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        {wallMaterial}
      </mesh>
      <mesh name="bottom wall" position={[0, -2.05, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.1, 3]} />
        {wallMaterial2}
      </mesh>
      <mesh name="top wall" position={[0, 2.05, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.1, 3]} />
        {wallMaterial2}
      </mesh>
    </group>
  );
}

export function RoomWallPictures() {
  return (
    <Suspense fallback={null}>
      <WallsWithTexture />
    </Suspense>
  );
}
