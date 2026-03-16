import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const POUR_DELAY_SECONDS = 0.9;

const TUBE_RADIUS = 0.07;
const INNER_RADIUS = 0.058;
const TUBE_TOP_Y = 2.25;
const TUBE_BOTTOM_Y = 0;
const TUBE_LENGTH = TUBE_TOP_Y - TUBE_BOTTOM_Y;
const TUBE_CENTER_Y = (TUBE_TOP_Y + TUBE_BOTTOM_Y) / 2;
const TUBULAR_SEGMENTS = 100;
const RADIAL_SEGMENTS = 24;

const fillVertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vAlong;
  varying float vRadial;

  void main() {
    vAlong = (1.65 - position.y) / 3.3;
    vRadial = (atan(position.z, position.x) / 6.28318 + 0.5);
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const liquidVertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vAlong;
  varying float vRadial;

  void main() {
    vAlong = (2.25 - position.y) / 3.3;
    vRadial = (atan(normal.z, normal.x) / 6.28318 + 0.5);

    float ripple = 0.012 * sin(vAlong * 60.0 - uTime * 18.0) * sin(vRadial * 6.28318);
    float lump1 = 0.01 * sin(vAlong * 90.0) * sin(vRadial * 8.0);
    float lump2 = 0.008 * sin(vAlong * 45.0 + 1.5) * sin(vRadial * 12.0 + 0.7);
    float lump3 = 0.006 * sin(vAlong * 120.0 - uTime * 3.0) * sin(vRadial * 5.0);
    vec3 pos = position + normal * (ripple + lump1 + lump2 + lump3);
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const liquidFragmentShader = `
  uniform float uTime;
  uniform vec3 uLiquidColor;
  uniform vec3 uHighlightColor;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vAlong;
  varying float vRadial;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);
    float gloss = 0.4 + 0.6 * fresnel;

    float along = vAlong;
    float flow = fract(along - uTime * 0.6);

    float wave1 = sin(along * 50.0 + uTime * 14.0) * 0.5 + 0.5;
    float wave2 = sin(along * 32.0 - uTime * 10.0) * 0.5 + 0.5;
    float wave3 = sin(along * 70.0 + uTime * 22.0) * 0.5 + 0.5;
    float waves = wave1 * 0.5 + wave2 * 0.35 + wave3 * 0.25;

    float streak = smoothstep(0.0, 0.1, flow) * (1.0 - smoothstep(0.3, 0.45, flow));
    float streak2 = smoothstep(0.4, 0.48, flow) * (1.0 - smoothstep(0.7, 0.85, flow));
    float streak3 = smoothstep(0.75, 0.82, flow) * (1.0 - smoothstep(0.95, 1.0, flow));
    float streaks = min(1.0, streak + streak2 * 0.8 + streak3 * 0.6);

    float ripple = sin(vRadial * 6.28318 * 4.0 + along * 28.0 - uTime * 16.0) * 0.5 + 0.5;
    float turbulence = sin(along * 45.0 + uTime * 12.0) * sin(vRadial * 15.0 - uTime * 8.0) * 0.5 + 0.5;

    float b1 = 1.0 - smoothstep(0.0, 0.065, length(vec2(fract(along - uTime * 0.65) - 0.5, vRadial - 0.25)));
    float b2 = 1.0 - smoothstep(0.0, 0.055, length(vec2(fract(along - uTime * 0.65 + 0.33) - 0.5, vRadial - 0.6)));
    float b3 = 1.0 - smoothstep(0.0, 0.06, length(vec2(fract(along - uTime * 0.65 + 0.66) - 0.5, vRadial - 0.1)));
    float b4 = 1.0 - smoothstep(0.0, 0.05, length(vec2(fract(along - uTime * 0.55 + 0.2) - 0.5, vRadial - 0.85)));
    float b5 = 1.0 - smoothstep(0.0, 0.058, length(vec2(fract(along - uTime * 0.55 + 0.55) - 0.5, vRadial - 0.5)));
    float bubbles = min(1.0, (b1 + b2 + b3 + b4 + b5) * 1.3);

    float grain = sin(vAlong * 180.0) * sin(vRadial * 25.0) * 0.5 + 0.5;
    grain += sin(vAlong * 220.0 + 2.1) * sin(vRadial * 18.0 + 1.3) * 0.5 + 0.5;
    grain = grain * 0.5;
    float surface = 0.92 + 0.08 * grain;

    vec3 col = mix(uLiquidColor, uHighlightColor, 0.2 * gloss + 0.3 * streaks + 0.4 * bubbles);
    col += uHighlightColor * 0.25 * (0.35 * ripple + 0.25 * turbulence);
    col *= surface;
    float alpha = uOpacity * (0.55 + 0.45 * fresnel) * (0.7 + 0.35 * waves) * (0.85 + 0.2 * streaks);
    alpha = min(1.0, alpha + bubbles * 0.35);

    float topFade = smoothstep(0.0, 0.2, along);
    alpha *= topFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * Liquid tube from top of box into cup, plus two brown discs that move with pour state.
 */
export function LiquidPour({ isPouring = false }) {
  const tubeRef = useRef();
  const fillRef = useRef();
  const pourStartTimeRef = useRef(null);
  const hasActivatedRef = useRef(false);
  const [liquidActive, setLiquidActive] = useState(false);
  const { clock } = useThree();

  useEffect(() => {
    if (!isPouring) {
      pourStartTimeRef.current = null;
      hasActivatedRef.current = false;
      setLiquidActive(false);
    } else {
      pourStartTimeRef.current = clock.getElapsedTime();
    }
  }, [isPouring, clock]);

  const { tubeGeo, fillGeo } = useMemo(() => {
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, TUBE_TOP_Y, 0),
      new THREE.Vector3(0, TUBE_BOTTOM_Y, 0),
    ]);
    const tubeGeo = new THREE.TubeGeometry(path, TUBULAR_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, false);
    const fillGeo = new THREE.CylinderGeometry(INNER_RADIUS, INNER_RADIUS, TUBE_LENGTH, 32, 1, false);
    return { tubeGeo, fillGeo };
  }, []);

  const tubeUniforms = useRef({
    uTime: { value: 0 },
    uLiquidColor: { value: new THREE.Color(0.2, 0.14, 0.08) },
    uHighlightColor: { value: new THREE.Color(0.42, 0.32, 0.2) },
    uOpacity: { value: 0.75 },
  });

  const fillUniforms = useRef({
    uTime: { value: 0 },
    uLiquidColor: { value: new THREE.Color(0.2, 0.14, 0.08) },
    uHighlightColor: { value: new THREE.Color(0.42, 0.32, 0.2) },
    uOpacity: { value: 0.92 },
  });

  const discsGroupRef = useRef();
  const DISCS_UP_Y = 1.35;
  const DISCS_DOWN_Y = 0.9;
  const discsYRef = useRef(DISCS_DOWN_Y);
  const DISCS_LERP_DOWN = 2.8;
  const DISCS_LERP_UP = 0.9;

  useFrame((_, delta) => {
    const targetY = isPouring ? DISCS_DOWN_Y : DISCS_UP_Y;
    const lerp = isPouring ? DISCS_LERP_DOWN : DISCS_LERP_UP;
    discsYRef.current += (targetY - discsYRef.current) * Math.min(1, lerp * delta);
    if (discsGroupRef.current) discsGroupRef.current.position.y = discsYRef.current;

    if (isPouring && pourStartTimeRef.current !== null && !hasActivatedRef.current) {
      const elapsed = clock.getElapsedTime() - pourStartTimeRef.current;
      if (elapsed >= POUR_DELAY_SECONDS) {
        hasActivatedRef.current = true;
        setLiquidActive(true);
      }
    }
    if (!liquidActive) return;
    const t = (tubeRef.current?.material?.uniforms?.uTime?.value ?? 0) + delta;
    if (tubeRef.current?.material?.uniforms) tubeRef.current.material.uniforms.uTime.value = t;
    if (fillRef.current?.material?.uniforms) fillRef.current.material.uniforms.uTime.value = t;
  });

  const topDiskRadius = 0.18;
  const topDiskHeight = 0.06;
  const bottomDiskRadius = 0.13;
  const bottomDiskHeight = 0.05;
  const topDiskGeo = useMemo(
    () => new THREE.CylinderGeometry(topDiskRadius, topDiskRadius, topDiskHeight, 32),
    []
  );
  const bottomDiskGeo = useMemo(
    () => new THREE.CylinderGeometry(bottomDiskRadius, bottomDiskRadius, bottomDiskHeight, 32),
    []
  );

  const brownMat = useMemo(
    () => ({
      color: new THREE.Color('#3d2914'),
      roughness: 0.9,
      metalness: 0
    }),
    []
  );

  return (
    <group position={[0, 0, 0]}>
      <group ref={discsGroupRef} position={[0, DISCS_DOWN_Y, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <primitive object={topDiskGeo} attach="geometry" />
          <meshStandardMaterial {...brownMat} />
        </mesh>
        <mesh position={[0, 1.0 - topDiskHeight / 2 - bottomDiskHeight / 2, 0]} castShadow receiveShadow>
          <primitive object={bottomDiskGeo} attach="geometry" />
          <meshStandardMaterial {...brownMat} />
        </mesh>
      </group>
      {liquidActive && (
        <>
          <mesh ref={fillRef} position={[0, TUBE_CENTER_Y, 0]}>
            <primitive object={fillGeo} attach="geometry" />
            <shaderMaterial
              vertexShader={fillVertexShader}
              fragmentShader={liquidFragmentShader}
              uniforms={fillUniforms.current}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
          <mesh ref={tubeRef}>
            <primitive object={tubeGeo} attach="geometry" />
            <shaderMaterial
              vertexShader={liquidVertexShader}
              fragmentShader={liquidFragmentShader}
              uniforms={tubeUniforms.current}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
