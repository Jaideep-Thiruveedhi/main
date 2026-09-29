import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../state/useWorldStore';
import { getQualitySettings } from '../engine/quality';

// Blocky villagers and animals wandering the village.

const VILLAGER_COLORS = ['#c13a3a', '#3a6ac1', '#3aa15a', '#e8862e', '#8a4ac1', '#c1a43a'];
const SKIN_TONES = ['#e8b88a', '#d8a070', '#c89060', '#b88050'];

interface NpcData {
  x: number; z: number;
  color: string;
  skin: string;
  speed: number;
  radius: number;
  phase: number;
  kind: 'villager' | 'animal';
}

function Npc({ data }: { data: NpcData }) {
  const ref = useRef<THREE.Group>(null);
  const kind = data.kind;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * data.speed + data.phase;
    const x = data.x + Math.cos(t) * data.radius;
    const z = data.z + Math.sin(t) * data.radius;
    ref.current.position.set(x, kind === 'villager' ? 5 : 4.5, z);
    ref.current.rotation.y = t + Math.PI / 2;
    // Walk bob
    if (kind === 'villager') {
      ref.current.position.y = 5 + Math.abs(Math.sin(t * 4)) * 0.05;
    }
  });

  if (kind === 'animal') {
    return (
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.5]} />
          <meshLambertMaterial color={data.color} />
        </mesh>
        <mesh position={[0, 0.35, 0.2]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshLambertMaterial color={data.skin} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.35]} />
        <meshLambertMaterial color={data.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshLambertMaterial color={data.skin} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.12, 0.1, 0]} castShadow>
        <boxGeometry args={[0.18, 0.4, 0.2]} />
        <meshLambertMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0.12, 0.1, 0]} castShadow>
        <boxGeometry args={[0.18, 0.4, 0.2]} />
        <meshLambertMaterial color="#4a3a2a" />
      </mesh>
    </group>
  );
}

export function Npcs() {
  const quality = useWorldStore((s) => s.quality);
  const q = getQualitySettings(quality);

  const npcs = useMemo<NpcData[]>(() => {
    const arr: NpcData[] = [];
    const villagerCount = Math.min(q.maxNpcs, 10);
    for (let i = 0; i < villagerCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        color: VILLAGER_COLORS[i % VILLAGER_COLORS.length],
        skin: SKIN_TONES[i % SKIN_TONES.length],
        speed: 0.15 + Math.random() * 0.1,
        radius: 5 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2,
        kind: 'villager',
      });
    }
    const animalCount = Math.min(q.maxAnimals, 6);
    for (let i = 0; i < animalCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
        color: i % 2 === 0 ? '#f0f0f0' : '#8a5a33',
        skin: '#f0f0f0',
        speed: 0.08 + Math.random() * 0.05,
        radius: 8 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        kind: 'animal',
      });
    }
    return arr;
  }, [q.maxNpcs, q.maxAnimals]);

  return (
    <group>
      {npcs.map((npc, i) => (
        <Npc key={i} data={npc} />
      ))}
    </group>
  );
}
