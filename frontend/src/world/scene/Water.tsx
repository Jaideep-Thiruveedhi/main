import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getQualitySettings } from '../engine/quality';
import { useWorldStore } from '../state/useWorldStore';

// Animated pond water with fresnel-ish shimmer.

export function Water() {
  const ref = useRef<THREE.Mesh>(null);
  const quality = useWorldStore((s) => s.quality);
  const q = getQualitySettings(quality);

  const material = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: '#3d7dd8',
      transparent: true,
      opacity: 0.75,
      shininess: 120,
      specular: '#aaccff',
    });
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 2.0 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
      material.opacity = 0.7 + Math.sin(clock.elapsedTime * 1.2) * 0.05;
    }
  });

  return (
    <mesh ref={ref} position={[-40, 2, -40]} material={material}>
      <boxGeometry args={[20, 0.3, 20]} />
    </mesh>
  );
}
