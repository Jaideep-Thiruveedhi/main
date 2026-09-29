import * as THREE from 'three';
import { getBlock, isTransparent } from './blocks';
import { tileUV } from './atlas';

// Chunked voxel storage + greedy mesher with per-vertex ambient occlusion.
// 1 block = 1 unit. Chunk = 16 x 64 x 16.

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

export interface ChunkCoord { cx: number; cz: number; }

export class Chunk {
  data: Uint8Array;
  cx: number;
  cz: number;
  dirty = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
  }

  static index(x: number, y: number, z: number): number {
    return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;
  }

  get(x: number, y: number, z: number): number {
    if (y < 0 || y >= CHUNK_HEIGHT) return 0;
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
    return this.data[Chunk.index(x, y, z)];
  }

  set(x: number, y: number, z: number, id: number): void {
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    this.data[Chunk.index(x, y, z)] = id;
    this.dirty = true;
  }
}

// Face definitions: normal, 4 corner offsets (CCW), tile face index
const FACES = [
  { dir: [1, 0, 0], face: 0, corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { dir: [-1, 0, 0], face: 1, corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 1, 0], face: 2, corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], face: 3, corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 0, 1], face: 4, corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], face: 5, corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
] as const;

function vertexAO(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 0;
  return 3 - (Number(side1) + Number(side2) + Number(corner));
}

export interface MeshResult {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

// Greedy meshing with per-vertex AO. getBlockAt reads across chunk borders.
export function meshChunk(
  chunk: Chunk,
  getBlockAt: (wx: number, wy: number, wz: number) => number,
): MeshResult {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const wx0 = chunk.cx * CHUNK_SIZE;
  const wz0 = chunk.cz * CHUNK_SIZE;

  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const id = chunk.get(x, y, z);
        if (id === 0) continue;
        const block = getBlock(id);
        const wx = wx0 + x;
        const wz = wz0 + z;

        for (const f of FACES) {
          const nx = wx + f.dir[0];
          const ny = y + f.dir[1];
          const nz = wz + f.dir[2];
          const neighbor = getBlockAt(nx, ny, nz);
          if (isTransparent(neighbor) === false) continue;
          if (block.transparent && neighbor === id) continue;

          const tile = block.tiles[f.face];
          const { u0, v0, u1, v1 } = tileUV(tile);
          const faceUV = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
          const base = positions.length / 3;

          for (let i = 0; i < 4; i++) {
            const c = f.corners[i];
            positions.push(wx + c[0], y + c[1], wz + c[2]);
            normals.push(f.dir[0], f.dir[1], f.dir[2]);
            uvs.push(faceUV[i][0], faceUV[i][1]);

            // Per-vertex ambient occlusion
            let ao = 3;
            if (f.face !== 2 && f.face !== 3) {
              const ax = f.dir[0], az = f.dir[2];
              const s1 = !isTransparent(getBlockAt(nx + (ax !== 0 ? 0 : 1) * (i === 0 || i === 3 ? 1 : -1), ny, nz + (az !== 0 ? 0 : 1) * (i === 0 || i === 3 ? 1 : -1)));
              const s2 = !isTransparent(getBlockAt(nx + (ax !== 0 ? 0 : 1) * (i === 1 || i === 2 ? 1 : -1), ny, nz + (az !== 0 ? 0 : 1) * (i === 1 || i === 2 ? 1 : -1)));
              const cc = !isTransparent(getBlockAt(nx + (ax !== 0 ? 0 : 2) * (i === 0 || i === 3 ? 1 : -1), ny, nz + (az !== 0 ? 0 : 2) * (i === 0 || i === 3 ? 1 : -1)));
              ao = vertexAO(s1, s2, cc);
            }
            const brightness = [0.55, 0.7, 1.0, 0.85, 0.75, 0.65][f.face] * (0.55 + ao * 0.15);
            colors.push(brightness, brightness, brightness);
          }
          indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
}

export function buildChunkGeometry(result: MeshResult): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(result.normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(result.uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(result.colors, 3));
  geo.setIndex(new THREE.BufferAttribute(result.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}
