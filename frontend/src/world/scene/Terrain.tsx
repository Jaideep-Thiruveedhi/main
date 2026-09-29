import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Chunk, CHUNK_SIZE, meshChunk, buildChunkGeometry } from '../engine/chunks';
import { getBlock } from '../engine/blocks';
import { getAtlas } from '../engine/atlas';
import { getWorld, getWorldBlock } from '../engine/world';
import { useWorldStore } from '../state/useWorldStore';
import { getQualitySettings } from '../engine/quality';

// Renders the voxel terrain as chunked meshes with a shared atlas material.

export function Terrain() {
  const meshRef = useRef<THREE.Group>(null);
  const chunks = useMemo(() => getWorld(), []);
  const quality = useWorldStore((s) => s.quality);
  const q = getQualitySettings(quality);

  const material = useMemo(() => {
    const mat = new THREE.MeshLambertMaterial({
      map: getAtlas(),
      vertexColors: true,
    });
    return mat;
  }, []);

  const geometries = useMemo(() => {
    const getBlockAt = (wx: number, wy: number, wz: number) => getWorldBlock(wx, wy, wz);
    return chunks.map((chunk) => {
      const result = meshChunk(chunk, getBlockAt);
      return buildChunkGeometry(result);
    });
  }, [chunks]);

  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geometries, material]);

  return (
    <group ref={meshRef}>
      {geometries.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={material}
          castShadow={q.shadows}
          receiveShadow={q.shadows}
        />
      ))}
    </group>
  );
}
