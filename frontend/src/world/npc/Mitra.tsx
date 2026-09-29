import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../state/useWorldStore';

// Mitra - the glowing diya-lantern companion that follows the player.

export function Mitra() {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.PointLight>(null);
  const playerPosition = useWorldStore((s) => s.playerPosition);
  const mitraState = useWorldStore((s) => s.mitraState);
  const reduceMotion = useWorldStore((s) => s.reduceMotion);

  const stateColors: Record<string, string> = {
    idle: '#ffd870',
    listening: '#5a9aec',
    thinking: '#c17ae8',
    speaking: '#7ae88a',
  };

  useFrame(({ clock, camera }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // Follow the player, orbiting slowly so it never hides behind them.
    const orbit = t * 0.6;
    const radius = 2.2;
    const targetX = playerPosition[0] + Math.cos(orbit) * radius;
    const targetZ = playerPosition[2] + Math.sin(orbit) * radius;
    const targetY = playerPosition[1] + 1.9 + Math.sin(t * 2) * 0.18;
    if (reduceMotion) {
      ref.current.position.set(targetX, targetY, targetZ);
    } else {
      ref.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    }
    // Always face the player/camera.
    ref.current.lookAt(camera.position.x, ref.current.position.y, camera.position.z);
    // Glow pulse
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
    // Keep the companion readable at night: a warm light that follows you.
    if (lampRef.current) {
      lampRef.current.intensity = 2.2 + Math.sin(t * 3) * 0.6;
    }
  });

  const color = stateColors[mitraState] ?? stateColors.idle;

  return (
    <group ref={ref}>
      {/* Lantern body */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.55, 0.45]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Diya flame */}
      <mesh position={[0, 0.42, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color="#fff3c4" />
      </mesh>
      {/* Halo so Mitra is always findable, day or night */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.75, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <pointLight ref={lampRef} color={color} intensity={2.2} distance={14} />
    </group>
  );
}
