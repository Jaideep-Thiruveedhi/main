import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './chunks';
import { generateWorld } from './terrain';

// Shared singleton world - generated once, used by terrain mesh, player collision, etc.
// Uses a flat Uint8Array for O(1) block access (much faster than Map lookups).

const WORLD_MIN = -48;
const WORLD_MAX = 47;
const WORLD_W = WORLD_MAX - WORLD_MIN + 1; // 96
const WORLD_D = WORLD_MAX - WORLD_MIN + 1; // 96
const WORLD_H = CHUNK_HEIGHT; // 64

let worldBlocks: Uint8Array | null = null;
let worldChunks: Chunk[] | null = null;

function getBlocks(): Uint8Array {
  if (!worldBlocks) {
    worldChunks = generateWorld();
    worldBlocks = new Uint8Array(WORLD_W * WORLD_H * WORLD_D);
    for (const chunk of worldChunks) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          for (let x = 0; x < CHUNK_SIZE; x++) {
            const wx = chunk.cx * CHUNK_SIZE + x;
            const wz = chunk.cz * CHUNK_SIZE + z;
            const id = chunk.get(x, y, z);
            if (id !== 0) {
              const wi = ((wx - WORLD_MIN) * WORLD_D + (wz - WORLD_MIN)) * WORLD_H + y;
              worldBlocks[wi] = id;
            }
          }
        }
      }
    }
  }
  return worldBlocks;
}

export function getWorld(): Chunk[] {
  getBlocks();
  return worldChunks!;
}

export function getWorldBlock(wx: number, wy: number, wz: number): number {
  const blocks = getBlocks();
  if (wx < WORLD_MIN || wx > WORLD_MAX || wz < WORLD_MIN || wz > WORLD_MAX) return 0;
  if (wy < 0 || wy >= WORLD_H) return 0;
  const wi = ((wx - WORLD_MIN) * WORLD_D + (wz - WORLD_MIN)) * WORLD_H + wy;
  return blocks[wi];
}

export function isWorldSolid(wx: number, wy: number, wz: number): boolean {
  const id = getWorldBlock(wx, wy, wz);
  return id !== 0 && id !== 12 && id !== 13 && id !== 14 && id !== 15 && id !== 16 && id !== 17 && id !== 18 && id !== 19 && id !== 21 && id !== 24;
}
