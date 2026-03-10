import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

const MAX_BLOOM = 1.2;
const MAX_OFFSET = 0.003;

export function SprintBlur({ sprintBlurRef }) {
  const [intensity, setIntensity] = useState(0);

  useFrame(() => {
    if (!sprintBlurRef) return;
    setIntensity(sprintBlurRef.current);
  });

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity * MAX_BLOOM}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.1}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[intensity * MAX_OFFSET, intensity * MAX_OFFSET * 0.5]}
        blendFunction={0}
      />
    </EffectComposer>
  );
}
