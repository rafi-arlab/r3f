import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/Starbuck.glb';
useGLTF.preload(MODEL_URL);

// Cup transform — change these to adjust position and rotation; scale can be driven by hand distance
const CUP_POSITION = [0, -1, 0];
const CUP_ROTATION = [-0.2, -90.7, 0.1]; // [x, y, z] in radians (e.g. [0, Math.PI / 4, 0] = 45° around Y)

/** Default scale when hand distance is not available */
const DEFAULT_SCALE = 10;

const RIM_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT = `
  uniform vec3 rimColor;
  uniform float rimPower;
  uniform float rimStrength;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), rimPower);
    rim *= rimStrength;
    gl_FragColor = vec4(rimColor, rim);
  }
`;

function createRimMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: { value: new THREE.Color(1.0, 0.88, 0.65) },
      rimPower: { value: 2.8 },
      rimStrength: { value: 0.45 }
    },
    vertexShader: RIM_VERTEX,
    fragmentShader: RIM_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}

export function Cup({ scale: scaleProp, rotationY: rotationYProp = 0 }) {
  const scale = scaleProp ?? DEFAULT_SCALE;
  const rotationY = rotationYProp ?? 0;
  const { scene } = useGLTF(MODEL_URL);

  const cloned = useMemo(() => {
    const s = scene.clone();
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          const m = mat.clone();
          m.roughness = 1;
          m.metalness = 0;
          child.material = Array.isArray(child.material) ? [m] : m;
        }
      }
    });
    return s;
  }, [scene]);

  const rimClone = useMemo(() => {
    const s = scene.clone();
    const rimMat = createRimMaterial();
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.material = rimMat;
      }
    });
    return s;
  }, [scene]);

  const rotation = [CUP_ROTATION[0], CUP_ROTATION[1] + rotationY, CUP_ROTATION[2]];

  return (
    <group position={CUP_POSITION} scale={scale} rotation={rotation}>
      <primitive object={cloned} castShadow receiveShadow />
      <group scale={[1, 1, 1]}>
        <primitive object={rimClone} />
      </group>
    </group>
  );
}
