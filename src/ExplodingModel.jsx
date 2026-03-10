import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { BufferAttribute, Color, MeshDepthMaterial, RGBADepthPacking, ShaderMaterial } from 'three';

const explodeVertexShader = `
  uniform float u_time;
  attribute vec3 aCenter;
  attribute float aRandom;
  varying float vExplode;

  void main() {
    float cycle = fract(u_time * 0.22);
    float burst = smoothstep(0.0, 1.0, cycle);

    vec3 local = position - aCenter;
    vec3 outward = normalize(aCenter + vec3(0.001));
    float explodeDistance = burst * (2.2 + aRandom * 2.8);
    vec3 explodedCenter = aCenter + outward * explodeDistance;

    float spin = burst * (2.5 + aRandom * 4.0);
    float c = cos(spin);
    float s = sin(spin);
    mat2 rot = mat2(c, -s, s, c);
    local.xy = rot * local.xy;

    vec3 explodedPosition = explodedCenter + local;

    vExplode = burst;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(explodedPosition, 1.0);
  }
`;

const explodeFragmentShader = `
  uniform vec3 u_colorInner;
  uniform vec3 u_colorOuter;
  varying float vExplode;

  void main() {
    vec3 color = mix(u_colorInner, u_colorOuter, vExplode);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createExplodeDepthMaterial() {
  const depthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });

  depthMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.u_time = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
uniform float u_time;
attribute vec3 aCenter;
attribute float aRandom;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `float cycle = fract(u_time * 0.22);
float burst = smoothstep(0.0, 1.0, cycle);
vec3 local = position - aCenter;
vec3 outward = normalize(aCenter + vec3(0.001));
float explodeDistance = burst * (2.2 + aRandom * 2.8);
vec3 explodedCenter = aCenter + outward * explodeDistance;
float spin = burst * (2.5 + aRandom * 4.0);
float c = cos(spin);
float s = sin(spin);
mat2 rot = mat2(c, -s, s, c);
local.xy = rot * local.xy;
vec3 transformed = explodedCenter + local;`
    );

    depthMaterial.userData.shader = shader;
  };

  return depthMaterial;
}

export function ExplodingModel() {
  const { scene } = useGLTF('/models/scene.gltf');
  const assetRef = useRef();
  const explodeMaterialsRef = useRef([]);
  const depthMaterialsRef = useRef([]);
  const generatedGeometriesRef = useRef([]);

  useEffect(() => {
    explodeMaterialsRef.current = [];
    depthMaterialsRef.current = [];
    generatedGeometriesRef.current = [];

    scene.traverse((child) => {
      if (child.isMesh) {
        const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        const positionAttribute = geometry.getAttribute('position');
        const centers = new Float32Array(positionAttribute.count * 3);
        const randoms = new Float32Array(positionAttribute.count);

        for (let i = 0; i < positionAttribute.count; i += 3) {
          const ax = positionAttribute.getX(i);
          const ay = positionAttribute.getY(i);
          const az = positionAttribute.getZ(i);

          const bx = positionAttribute.getX(i + 1);
          const by = positionAttribute.getY(i + 1);
          const bz = positionAttribute.getZ(i + 1);

          const cx = positionAttribute.getX(i + 2);
          const cy = positionAttribute.getY(i + 2);
          const cz = positionAttribute.getZ(i + 2);

          const centerX = (ax + bx + cx) / 3;
          const centerY = (ay + by + cy) / 3;
          const centerZ = (az + bz + cz) / 3;
          const pieceRandom = Math.random();

          for (let j = 0; j < 3; j += 1) {
            const index = i + j;
            centers[index * 3] = centerX;
            centers[index * 3 + 1] = centerY;
            centers[index * 3 + 2] = centerZ;
            randoms[index] = pieceRandom;
          }
        }

        geometry.setAttribute('aCenter', new BufferAttribute(centers, 3));
        geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));
        child.geometry = geometry;
        child.frustumCulled = false;

        const explodeMaterial = new ShaderMaterial({
          vertexShader: explodeVertexShader,
          fragmentShader: explodeFragmentShader,
          uniforms: {
            u_time: { value: 0 },
            u_colorInner: { value: new Color('#ffae00') },
            u_colorOuter: { value: new Color('#ff2255') }
          },
          flatShading: true
        });

        child.material = explodeMaterial;
        child.customDepthMaterial = createExplodeDepthMaterial();
        child.castShadow = true;
        child.receiveShadow = false;

        explodeMaterialsRef.current.push(explodeMaterial);
        depthMaterialsRef.current.push(child.customDepthMaterial);
        generatedGeometriesRef.current.push(geometry);
      }
    });

    return () => {
      explodeMaterialsRef.current.forEach((material) => material.dispose());
      depthMaterialsRef.current.forEach((material) => material.dispose());
      generatedGeometriesRef.current.forEach((geometry) => geometry.dispose());
      explodeMaterialsRef.current = [];
      depthMaterialsRef.current = [];
      generatedGeometriesRef.current = [];
    };
  }, [scene]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    explodeMaterialsRef.current.forEach((material) => {
      material.uniforms.u_time.value = elapsed;
    });

    depthMaterialsRef.current.forEach((material) => {
      if (material.userData.shader?.uniforms?.u_time) {
        material.userData.shader.uniforms.u_time.value = elapsed;
      }
    });

    if (assetRef.current) {
      assetRef.current.rotation.y += 0.01;
      assetRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <primitive
      ref={assetRef}
      object={scene}
      position={[0, 0, 0]}
      scale={0.1}
      castShadow
    />
  );
}
