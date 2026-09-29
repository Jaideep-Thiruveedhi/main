import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { Sky } from './Sky';
import { Water } from './Water';
import { PlayerController } from '../controls/PlayerController';
import { CameraRig } from '../controls/CameraRig';
import { Places } from '../places/Places';
import { Npcs } from '../npc/Npcs';
import { Mitra } from '../npc/Mitra';
import { useWorldStore } from '../state/useWorldStore';
import { getQualitySettings } from '../engine/quality';
import { computeDayNight } from '../engine/lighting';

// Main 3D world canvas. Client-only (loaded via dynamic import with ssr:false).

export function WorldScene() {
  const quality = useWorldStore((s) => s.quality);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const q = getQualitySettings(quality);
  const dn = computeDayNight(timeOfDay);

  // These MUST be referentially stable: <Canvas> re-creates its reconciler
  // root when the gl/dpr/camera object identity changes between renders.
  const gl = useMemo(
    () => ({
      antialias: quality !== 'low',
      powerPreference: 'high-performance' as const,
      toneMapping: THREE.ACESFilmicToneMapping,
    }),
    [quality]
  );
  const dpr = useMemo<[number, number]>(() => [1, q.pixelRatioCap], [q.pixelRatioCap]);
  const camera = useMemo(
    () => ({ fov: 60, near: 0.1, far: 300, position: [-6, 10, 26] as [number, number, number] }),
    []
  );

  return (
    <Canvas
      shadows={q.shadows}
      dpr={dpr}
      gl={gl}
      camera={camera}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(dn.fogColor, 30, q.tier === 'low' ? 60 : q.tier === 'medium' ? 90 : 140);
      }}
    >
      <Suspense fallback={null}>
        <Sky />
        <Terrain />
        <Water />
        <Places />
        <Npcs />
        <Mitra />
        <PlayerController />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
