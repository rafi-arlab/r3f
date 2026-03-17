import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const TOTAL_BEANS = 10;

const COLLECT_NDC_RADIUS = 0.11;
const BEAN_RADIUS = 0.064;
const BEAN_LIFETIME_SEC = 4;
const SPAWN_INTERVAL_SEC = 0.9;
const MAX_BEANS_ON_SCREEN = 5;

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
      y: 1 - p.y * 2
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
      for (const h of handNdc) {
        if (Math.hypot(bx - h.x, by - h.y) < COLLECT_NDC_RADIUS) {
          onCollectRef.current?.();
          return false;
        }
      }
      return true;
    });

    const needMore = collectedCount < TOTAL_BEANS;
    if (needMore && beans.length < MAX_BEANS_ON_SCREEN && t - lastSpawnTimeRef.current >= SPAWN_INTERVAL_SEC) {
      lastSpawnTimeRef.current = t;
      const angle = Math.random() * Math.PI * 2;
      const radius = CIRCLE_RADIUS * (1 + (Math.random() * 2 - 1) * RADIUS_JITTER);
      beans = [
        ...beans,
        { id: ++nextId, angle, radius, spawnTime: t }
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
        group.children[i].position.set(x, baseY + floatY, CIRCLE_CENTER[2]);
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
            <mesh castShadow>
              <sphereGeometry args={[BEAN_RADIUS, 8, 8]} />
              <meshStandardMaterial color="#3d2914" roughness={0.9} metalness={0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
