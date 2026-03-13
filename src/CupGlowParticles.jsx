import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 45;
const CUP_POSITION = [0, -1, 0];
/** Spread of particle origin behind the cup (x, y, z); z range = behind the cup only */
const SPREAD = [0.6, 0.5, 0.5];
/** Spawn this much above cup center (y) */
const Y_OFFSET = 0.4;
/** Z range: particles spawn from CUP_Z - Z_BACK to CUP_Z - Z_BACK - SPREAD[2] (well behind cup) */
const Z_BACK = 0.9;
/** Speed toward camera (+z); lateral spread */
const SPEED_TOWARD_CAMERA = 0.14;
const SPEED_LATERAL = 0.1;
/** Start fading when z passes this; full fade by Z_RESPAWN */
const Z_FADE_START = 0.02;
/** Respawn when particle passes this z (after fade out) */
const Z_RESPAWN = 0.35;
const SIZE = 0.4;

function createSoftTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  // Soft golden glow: warm amber/honey, lower opacity so it feels soft not bright
  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gradient.addColorStop(0, 'rgba(255, 230, 190, 0.55)');
  gradient.addColorStop(0.2, 'rgba(255, 218, 175, 0.45)');
  gradient.addColorStop(0.4, 'rgba(255, 205, 160, 0.3)');
  gradient.addColorStop(0.6, 'rgba(250, 195, 150, 0.18)');
  gradient.addColorStop(0.8, 'rgba(245, 188, 140, 0.06)');
  gradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function rand(low, high) {
  return low + Math.random() * (high - low);
}

export function CupGlowParticles() {
  const ref = useRef();
  const texture = useMemo(createSoftTexture, []);

  const velocitiesRef = useRef(null);
  if (velocitiesRef.current === null) {
    const v = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      v[i * 3 + 0] = rand(-SPEED_LATERAL, SPEED_LATERAL);
      v[i * 3 + 1] = rand(-SPEED_LATERAL, SPEED_LATERAL);
      v[i * 3 + 2] = rand(SPEED_TOWARD_CAMERA * 0.5, SPEED_TOWARD_CAMERA);
    }
    velocitiesRef.current = v;
  }

  const [positions, randoms, opacities] = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const randoms = new Float32Array(COUNT * 2);
    const opacities = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = CUP_POSITION[0] + (Math.random() - 0.5) * SPREAD[0];
      positions[i * 3 + 1] = CUP_POSITION[1] + Y_OFFSET + (Math.random() - 0.5) * SPREAD[1];
      positions[i * 3 + 2] = CUP_POSITION[2] - Z_BACK - Math.random() * SPREAD[2];
      randoms[i * 2 + 0] = Math.random();
      randoms[i * 2 + 1] = Math.random();
      opacities[i] = 1;
    }
    return [positions, randoms, opacities];
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('random', new THREE.BufferAttribute(randoms, 2));
    g.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return g;
  }, [positions, randoms, opacities]);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    const vel = velocitiesRef.current;
    const opacityAttr = ref.current.geometry.attributes.opacity;
    const opacityArr = opacityAttr.array;
    const fadeRange = Z_RESPAWN - Z_FADE_START;

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] += vel[i * 3 + 0] * delta;
      pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
      pos[i * 3 + 2] += vel[i * 3 + 2] * delta;

      const z = pos[i * 3 + 2];
      if (z > Z_RESPAWN) {
        pos[i * 3 + 0] = CUP_POSITION[0] + (Math.random() - 0.5) * SPREAD[0];
        pos[i * 3 + 1] = CUP_POSITION[1] + Y_OFFSET + (Math.random() - 0.5) * SPREAD[1];
        pos[i * 3 + 2] = CUP_POSITION[2] - Z_BACK - Math.random() * SPREAD[2];
        vel[i * 3 + 0] = rand(-SPEED_LATERAL, SPEED_LATERAL);
        vel[i * 3 + 1] = rand(-SPEED_LATERAL, SPEED_LATERAL);
        vel[i * 3 + 2] = rand(SPEED_TOWARD_CAMERA * 0.5, SPEED_TOWARD_CAMERA);
        opacityArr[i] = 1;
      } else if (z > Z_FADE_START) {
        const t = (z - Z_FADE_START) / fadeRange;
        opacityArr[i] = Math.max(0, 1 - t);
      } else {
        opacityArr[i] = 1;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    opacityAttr.needsUpdate = true;
  });

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      color: { value: new THREE.Color(1.0, 0.82, 0.55) },
      size: { value: SIZE },
      scale: { value: 80 }
    }),
    [texture]
  );

  const vertexShader = `
    attribute float opacity;
    varying float vOpacity;
    uniform float size;
    uniform float scale;
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (scale / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 color;
    uniform sampler2D map;
    varying float vOpacity;
    void main() {
      vec4 tex = texture2D(map, gl_PointCoord);
      gl_FragColor = vec4(color, 1.0) * tex;
      gl_FragColor.a *= vOpacity * 0.55;
    }
  `;

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
