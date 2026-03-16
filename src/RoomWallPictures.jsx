import { Suspense } from 'react';

const SBUX_GREEN = '#00704a';

const ROOM_GROUP_POSITION = [0, 0, 1.5];
const WALL_CENTER_Z = -1.25;

function StarbucksRoom() {
  return (
    <group position={ROOM_GROUP_POSITION} name="room">
      <mesh name="left wall" position={[-2, 0, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        <meshStandardMaterial color={SBUX_GREEN} roughness={0.9} metalness={0} />
      </mesh>
      <mesh name="right wall" position={[2, 0, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        <meshStandardMaterial color={SBUX_GREEN} roughness={0.9} metalness={0} />
      </mesh>
      <mesh name="bottom wall" position={[0, -2.05, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.1, 3]} />
        <meshStandardMaterial color={SBUX_GREEN} roughness={0.9} metalness={0} />
      </mesh>
      <mesh name="top wall" position={[0, 2.05, WALL_CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.1, 3]} />
        <meshStandardMaterial color={SBUX_GREEN} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

export function RoomWallPictures() {
  return (
    <Suspense fallback={null}>
      <StarbucksRoom />
    </Suspense>
  );
}
