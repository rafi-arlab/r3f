/**
 * Ambient, spot, directional and point lights for the room.
 */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <spotLight
        intensity={6}
        position={[0, 1.2, 2.5]}
        angle={1.15}
        penumbra={1}
        castShadow
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-2.5, 0.3, 2]} intensity={2} />
      <directionalLight position={[2.5, 0.3, 2]} intensity={2} />
      <pointLight position={[0, 2.5, 0.5]} intensity={1.5} distance={8} />
    </>
  );
}
