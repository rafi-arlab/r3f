/**
 * Room floor (brown box) and plinth (green base + cream top).
 */
export function RoomFloor() {
  return (
    <>
      <mesh
        name="floor"
        position={[0, 0, -1]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color="#3d2914" roughness={0.9} metalness={0} />
      </mesh>
      <group position={[0, -1.08, -0.08]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.14, 1]} />
          <meshStandardMaterial color="#00704a" roughness={0.85} metalness={0} />
        </mesh>
        <mesh position={[0, 0.071, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.06, 0.85]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.9} metalness={0} />
        </mesh>
      </group>
    </>
  );
}
