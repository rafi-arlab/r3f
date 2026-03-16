import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PLANE_Z = -6;
const PLANE_ASPECT = 16 / 9;
const COVER_OVERSIZE = 1.35;

/**
 * Coffee shop background before intro zoom. Centered at origin; sized to cover viewport.
 */
export function CoffeeShopBackground({ visible }) {
  const { camera, size } = useThree();
  const texture = useTexture('/coffee-shop-bg.png');

  if (!texture) return null;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (!visible) return null;

  const aspect = size.width / size.height;
  const vFov = (camera.fov * Math.PI) / 180;
  const planePosition = new THREE.Vector3(0, 0, PLANE_Z);
  const distance = camera.position.distanceTo(planePosition);
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * aspect;
  const planeWidth = Math.max(visibleWidth, visibleHeight * PLANE_ASPECT) * COVER_OVERSIZE;
  const planeHeight = Math.max(visibleHeight, visibleWidth / PLANE_ASPECT) * COVER_OVERSIZE;

  return (
    <group position={[0, 0, PLANE_Z]}>
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial
          map={texture}
          depthWrite={false}
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
