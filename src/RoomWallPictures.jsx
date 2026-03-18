import { useMemo } from 'react';
import * as THREE from 'three';

const WALL_COLOR = '#1a0e08';
const WIRE_COLOR = '#d4c9a8';
const WIRE_OPACITY = 0.2;
const ROOM_GROUP_POSITION = [0, 0, 1.5];
const WALL_CENTER_Z = -1.25;
const ROOM_W = 4;
const ROOM_H = 4;
const ROOM_D = 7;
const GRID_SPACING = 0.5;

function FlatGrid({ width, height, position, rotation }) {
  const geo = useMemo(() => {
    const pts = [];
    const hw = width / 2;
    const hh = height / 2;
    for (let x = -hw; x <= hw + 0.001; x += GRID_SPACING) {
      pts.push(x, -hh, 0, x, hh, 0);
    }
    for (let y = -hh; y <= hh + 0.001; y += GRID_SPACING) {
      pts.push(-hw, y, 0, hw, y, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [width, height]);

  return (
    <lineSegments geometry={geo} position={position} rotation={rotation} renderOrder={1}>
      <lineBasicMaterial color={WIRE_COLOR} transparent opacity={WIRE_OPACITY} depthWrite={false} />
    </lineSegments>
  );
}

export function RoomWallPictures() {
  const hw = ROOM_W / 2;
  const hh = ROOM_H / 2;
  const hd = ROOM_D / 2;
  const cz = WALL_CENTER_Z;

  return (
    <group position={ROOM_GROUP_POSITION} name="room">
      <mesh name="room-box" position={[0, 0, cz]} receiveShadow>
        <boxGeometry args={[ROOM_W, ROOM_H, ROOM_D]} />
        <meshBasicMaterial color={WALL_COLOR} side={THREE.BackSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      <FlatGrid width={ROOM_D} height={ROOM_H} position={[-hw, 0, cz]} rotation={[0, Math.PI / 2, 0]} />
      <FlatGrid width={ROOM_D} height={ROOM_H} position={[hw, 0, cz]} rotation={[0, -Math.PI / 2, 0]} />
      <FlatGrid width={ROOM_W} height={ROOM_D} position={[0, -hh, cz]} rotation={[Math.PI / 2, 0, 0]} />
      <FlatGrid width={ROOM_W} height={ROOM_D} position={[0, hh, cz]} rotation={[-Math.PI / 2, 0, 0]} />
      <FlatGrid width={ROOM_W} height={ROOM_H} position={[0, 0, -2.45]} rotation={[0, 0, 0]} />
    </group>
  );
}
