import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../state/useWorldStore';

// Mitra - the glowing diya-lantern companion that follows the player.

export function Mitra() {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const playerPosition = useWorldStore((s) => s.playerPosition);
  const mitraState = useWorldStore((s) => s.mitraState);
  const reduceMotion = useWorldStore((s) => s.reduceMotion);

  const stateColors: Record<string, string> = {
    idle: '#ffd870',
    listening: '#5a9aec',
    thinking: '#c17ae8',
    speaking: '#7ae88a',
  };

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // Follow player at an offset
    const targetX = playerPosition[0] + 2;
    const targetZ = playerPosition[2] + 2;
    const targetY = playerPosition[1] + 2.5 + Math.sin(t * 2) * 0.2;
    if (reduceMotion) {
      ref.current.position.set(targetX, targetY, targetZ);
    } else {
      ref.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.03);
    }
    // Glow pulse
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const color = stateColors[mitraState] ?? stateColors.idle;

  return (
    <group ref={ref}>
      {/* Lantern body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      {/* Point light */}
      <pointLight color={color} intensity={2} distance={8} />
    </group>
  );
}
