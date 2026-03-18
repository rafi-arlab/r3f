export function RoomFloor() {
  return (
    <mesh
      name="floor"
      position={[0, 0, -1]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <boxGeometry args={[4, 0.1, 4]} />
      <meshStandardMaterial color="#1a0e08" roughness={0.9} metalness={0} />
    </mesh>
  );
}
