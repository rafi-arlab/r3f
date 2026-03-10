import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex Shader - positions the vertices
const vertexShader = `
  uniform float u_time;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    
    // Create a squish/flatten animation
    vec3 pos = position;
    
    // Oscillate between 1.0 (normal) and 0.2 (squished flat)
    float squishAmount = 0.2 + (sin(u_time * 2.0) * 0.5 + 0.5) * 0.8;
    
    // Squish along the Y axis (height)
    pos.y *= squishAmount;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment Shader - colors each pixel
const fragmentShader = `
  uniform float u_time;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    // Animated gradient based on position and time
    float mixStrength = vPosition.y + 0.5;
    
    // Create moving waves in the gradient
    mixStrength += sin(u_time * 0.8 + vPosition.x * 3.0) * 0.3;
    mixStrength += cos(u_time * 0.5 + vPosition.y * 2.0) * 0.2;
    
    // Pulse effect based on distance from center and time
    float dist = length(vUv - 0.5);
    mixStrength += sin(dist * 10.0 - u_time * 2.0) * 0.15;
    
    // Mix between two colors
    vec3 color = mix(u_colorA, u_colorB, mixStrength);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function GradientShaderMaterial({ colorA = '#ff22aa', colorB = '#55ccff' }) {
  const materialRef = useRef();

  // Update time uniform every frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={{
        u_time: { value: 0 },
        u_colorA: { value: new THREE.Color(colorA) },
        u_colorB: { value: new THREE.Color(colorB) },
      }}
      side={THREE.DoubleSide}
    />
  );
}
