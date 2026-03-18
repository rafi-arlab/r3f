import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const TOTAL_BEANS = 5;

const COLLECT_NDC_RADIUS = 0.18;
const BEAN_RADIUS = 0.12;
const BEAN_LIFETIME_SEC = 9;
const SPAWN_INTERVAL_SEC = 0.9;
const MAX_BEANS_ON_SCREEN = 5;

const HOVER_EMISSIVE = 0xffaa00;
const HOVER_EMISSIVE_INTENSITY = 0.7;

// Circle center (same space as cup: group scale 0.88). [x, y, z]
const CIRCLE_CENTER = [0, 0, 0.5];
const CIRCLE_RADIUS = 1.6;
// Radius randomness: each bean gets radius = CIRCLE_RADIUS * (1 + random in [-RADIUS_JITTER, +RADIUS_JITTER])
const RADIUS_JITTER = 0.35;
const FLOAT_AMPLITUDE = 0.028;
const FLOAT_SPEED = 1.4;

let nextId = 0;

/**
 * Beans spawn on a circle around the cup. Stops spawning once collected >= target (enough to pour).
 */
export function CoffeeBeans({ handPositions = [], onCollect, collectedCount = 0 }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const activeBeansRef = useRef([]);
  const [, forceUpdate] = useState(0);
  const lastSpawnTimeRef = useRef(-SPAWN_INTERVAL_SEC);
  const onCollectRef = useRef(onCollect);
  onCollectRef.current = onCollect;

  const worldPos = useRef(new THREE.Vector3());
  const ndc = useRef(new THREE.Vector3());

  const flushUpdates = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    let beans = activeBeansRef.current;
    beans = beans.filter((b) => t - b.spawnTime < BEAN_LIFETIME_SEC);

    const handNdc = handPositions.map((p) => ({
      x: 1 - p.x * 2,
      y: 1 - p.y * 2,
      pinching: p.pinching ?? false
    }));

    const matrixWorld = groupRef.current.matrixWorld;

    beans = beans.filter((bean) => {
      const r = bean.radius ?? CIRCLE_RADIUS;
      const x = CIRCLE_CENTER[0] + Math.cos(bean.angle) * r;
      const y = CIRCLE_CENTER[1] + Math.sin(bean.angle) * r;
      const z = CIRCLE_CENTER[2];
      worldPos.current.set(x, y, z).applyMatrix4(matrixWorld);
      ndc.current.copy(worldPos.current).project(camera);
      const bx = ndc.current.x;
      const by = ndc.current.y;
      let hovered = false;
      let shouldCollect = false;
      for (const h of handNdc) {
        if (Math.hypot(bx - h.x, by - h.y) < COLLECT_NDC_RADIUS) {
          hovered = true;
          if (h.pinching) shouldCollect = true;
        }
      }
      bean.hovered = hovered;
      if (shouldCollect) {
        onCollectRef.current?.();
        return false;
      }
      return true;
    });

    const needMore = collectedCount < TOTAL_BEANS;
    if (needMore && beans.length < MAX_BEANS_ON_SCREEN && t - lastSpawnTimeRef.current >= SPAWN_INTERVAL_SEC) {
      lastSpawnTimeRef.current = t;
      const angle = Math.random() * Math.PI * 2;
      const radius = CIRCLE_RADIUS * (1 + (Math.random() * 2 - 1) * RADIUS_JITTER);
      const rot = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
      beans = [
        ...beans,
        { id: ++nextId, angle, radius, spawnTime: t, rot }
      ];
    }

    const changed = beans.length !== activeBeansRef.current.length ||
      beans.some((b, i) => activeBeansRef.current[i]?.id !== b.id);
    activeBeansRef.current = beans;
    if (changed) flushUpdates();

    const group = groupRef.current;
    if (group && group.children.length === beans.length) {
      for (let i = 0; i < beans.length; i++) {
        const bean = beans[i];
        const r = bean.radius ?? CIRCLE_RADIUS;
        const x = CIRCLE_CENTER[0] + Math.cos(bean.angle) * r;
        const baseY = CIRCLE_CENTER[1] + Math.sin(bean.angle) * r;
        const floatY = FLOAT_AMPLITUDE * Math.sin(t * FLOAT_SPEED + bean.id);
        const child = group.children[i];
        child.position.set(x, baseY + floatY, CIRCLE_CENTER[2]);
        if (bean.rot) child.rotation.set(bean.rot[0], bean.rot[1], bean.rot[2]);
        const mesh = child.children[0];
        if (mesh?.material) {
          if (bean.hovered) {
            mesh.material.emissive.setHex(HOVER_EMISSIVE);
            mesh.material.emissiveIntensity = HOVER_EMISSIVE_INTENSITY;
          } else {
            mesh.material.emissive.setHex(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        }
      }
    }
  });

  const beans = activeBeansRef.current;

  return (
    <group ref={groupRef}>
      {beans.map((bean) => {
        const r = bean.radius ?? CIRCLE_RADIUS;
        const x = CIRCLE_CENTER[0] + Math.cos(bean.angle) * r;
        const baseY = CIRCLE_CENTER[1] + Math.sin(bean.angle) * r;
        const z = CIRCLE_CENTER[2];
        return (
          <group key={bean.id} position={[x, baseY, z]}>
            <mesh castShadow scale={[1, 0.65, 0.55]}>
              <sphereGeometry args={[BEAN_RADIUS, 12, 12]} />
              <meshStandardMaterial color="#3d2914" roughness={0.9} metalness={0} />
            </mesh>
            <mesh position={[0, 0, BEAN_RADIUS * 0.56 * 0.01]} scale={[0.85, 0.65, 1]} rotation={[0, 0, 0]}>
              <torusGeometry args={[BEAN_RADIUS * 0.55, BEAN_RADIUS * 0.06, 4, 12, Math.PI]} />
              <meshBasicMaterial color="#1a0a04" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
