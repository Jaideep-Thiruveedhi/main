import { worldNoise } from './noise';
import { CHUNK_SIZE, CHUNK_HEIGHT, Chunk } from './chunks';
import { PLACES } from '../state/useWorldStore';

// Generates the voxel world: terrain from seeded noise + hand-authored village structures.

// World spans -48..+47 in both axes (chunks -3..2), covering all place coordinates.
export const WORLD_CHUNK_MIN = -3;
export const WORLD_CHUNK_MAX = 2;
export const WORLD_CHUNKS_X = WORLD_CHUNK_MAX - WORLD_CHUNK_MIN + 1;
export const WORLD_CHUNKS_Z = WORLD_CHUNK_MAX - WORLD_CHUNK_MIN + 1;

const B = {
  GRASS: 1, DIRT: 2, SAND: 3, STONE: 4, MUD: 5, PLASTER: 6, TERRACOTTA: 7,
  THATCH: 8, TIMBER: 9, PLANK: 10, COBBLE: 11, WATER: 12, WHEAT: 13,
  FLOWER: 14, LEAVES: 15, CLOTH_RED: 16, CLOTH_BLUE: 17, CLOTH_GREEN: 18,
  GLASS: 19, GOLD: 20, LANTERN: 21, ROOF_BLUE: 22, PATH: 23, CROP: 24, PUMPKIN: 25,
};

function terrainHeight(wx: number, wz: number): number {
  const base = worldNoise.fbm(wx * 0.012, wz * 0.012, 4) * 6;
  const detail = worldNoise.fbm(wx * 0.05, wz * 0.05, 2) * 1.5;
  return Math.floor(3 + base + detail);
}

// Flatten an area for a building/place
function flattenArea(chunks: Chunk[], x0: number, z0: number, x1: number, z1: number, targetHeight: number) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      const chunk = chunks.find((c) => c.cx === cx && c.cz === cz);
      if (!chunk) continue;
      const lx = x - cx * CHUNK_SIZE;
      const lz = z - cz * CHUNK_SIZE;
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        if (y < targetHeight) chunk.set(lx, y, lz, B.DIRT);
        else if (y === targetHeight) chunk.set(lx, y, lz, B.GRASS);
        else chunk.set(lx, y, lz, 0);
      }
    }
  }
}

function fillBox(chunks: Chunk[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const chunk = chunks.find((c) => c.cx === cx && c.cz === cz);
        if (!chunk) continue;
        chunk.set(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE, id);
      }
    }
  }
}

function hollowBox(chunks: Chunk[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, wallId: number, roofId?: number) {
  fillBox(chunks, x0, y0, z0, x1, y1, z1, wallId);
  fillBox(chunks, x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1 - 1, z1 - 1, 0);
  if (roofId !== undefined) fillBox(chunks, x0, y1, z0, x1, y1, z1, roofId);
}

// A village house: mud-brick walls, terracotta roof, door, windows, lantern
function buildHouse(chunks: Chunk[], x0: number, z0: number, groundY: number, w: number, d: number, opts: { plaster?: boolean; roof?: number; twoStorey?: boolean } = {}) {
  const wallId = opts.plaster ? B.PLASTER : B.MUD;
  const roofId = opts.roof ?? B.TERRACOTTA;
  const h = opts.twoStorey ? 6 : 4;
  hollowBox(chunks, x0, groundY, z0, x0 + w, groundY + h, z0 + d, wallId, roofId);
  // door
  fillBox(chunks, x0 + Math.floor(w / 2), groundY, z0, x0 + Math.floor(w / 2), groundY + 2, z0, 0);
  fillBox(chunks, x0 + Math.floor(w / 2), groundY + 3, z0, x0 + Math.floor(w / 2), groundY + 3, z0, B.TIMBER);
  // windows
  fillBox(chunks, x0 + 1, groundY + 2, z0, x0 + 1, groundY + 3, z0, B.GLASS);
  fillBox(chunks, x0 + w - 1, groundY + 2, z0, x0 + w - 1, groundY + 3, z0, B.GLASS);
  // lantern by the door
  fillBox(chunks, x0 + Math.floor(w / 2) + 1, groundY + 2, z0, x0 + Math.floor(w / 2) + 1, groundY + 2, z0, B.LANTERN);
  // timber corners
  for (const [cx, cz] of [[x0, z0], [x0 + w, z0], [x0, z0 + d], [x0 + w, z0 + d]]) {
    fillBox(chunks, cx, groundY, cz, cx, groundY + h, cz, B.TIMBER);
  }
}

// Thatched hut
function buildHut(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  hollowBox(chunks, x0, groundY, z0, x0 + 4, groundY + 3, z0 + 4, B.MUD, B.THATCH);
  fillBox(chunks, x0 + 2, groundY, z0, x0 + 2, groundY + 2, z0, 0);
}

// Big banyan tree with hanging roots
function buildBanyan(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY, z0, x0 + 2, groundY + 8, z0 + 2, B.TIMBER);
  // canopy
  for (let dx = -4; dx <= 6; dx++) {
    for (let dz = -4; dz <= 6; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 5.5) {
        const y = groundY + 9 + Math.floor((5.5 - dist) * 0.5);
        fillBox(chunks, x0 + dx, y, z0 + dz, x0 + dx, y, z0 + dz, B.LEAVES);
      }
    }
  }
  // hanging roots
  for (const [rx, rz] of [[-2, 0], [4, 1], [0, 4], [3, -2], [-1, 3]]) {
    const len = 3 + Math.floor(Math.abs(worldNoise.noise(rx, rz)) * 3);
    fillBox(chunks, x0 + rx, groundY + 6, z0 + rz, x0 + rx, groundY + 6 - len, z0 + rz, B.TIMBER);
  }
  // shaded platform
  fillBox(chunks, x0 - 2, groundY, z0 - 2, x0 + 4, groundY, z0 + 4, B.PLANK);
}

// Neem / mango / palm tree
function buildTree(chunks: Chunk[], x0: number, z0: number, groundY: number, kind: 'neem' | 'mango' | 'palm') {
  const h = kind === 'palm' ? 7 : 5;
  fillBox(chunks, x0, groundY, z0, x0, groundY + h, z0, B.TIMBER);
  if (kind === 'palm') {
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      const lx = Math.round(Math.cos(angle) * 2);
      const lz = Math.round(Math.sin(angle) * 2);
      fillBox(chunks, x0 + lx, groundY + h, z0 + lz, x0 + lx * 2, groundY + h + 1, z0 + lz * 2, B.LEAVES);
    }
  } else {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) < 4) {
          fillBox(chunks, x0 + dx, groundY + h, z0 + dz, x0 + dx, groundY + h + 1, z0 + dz, B.LEAVES);
        }
      }
    }
  }
}

// Crop field with rows
function buildField(chunks: Chunk[], x0: number, z0: number, groundY: number, w: number, d: number, cropId: number) {
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      if (z % 2 === 0) {
        fillBox(chunks, x0 + x, groundY, z0 + z, x0 + x, groundY, z0 + z, cropId);
      } else {
        fillBox(chunks, x0 + x, groundY, z0 + z, x0 + x, groundY, z0 + z, B.DIRT);
      }
    }
  }
}

// Market stall with cloth awning
function buildStall(chunks: Chunk[], x0: number, z0: number, groundY: number, clothId: number) {
  fillBox(chunks, x0, groundY + 1, z0, x0, groundY + 3, z0, B.TIMBER);
  fillBox(chunks, x0 + 3, groundY + 1, z0, x0 + 3, groundY + 3, z0, B.TIMBER);
  fillBox(chunks, x0, groundY + 1, z0 + 3, x0, groundY + 3, z0 + 3, B.TIMBER);
  fillBox(chunks, x0 + 3, groundY + 1, z0 + 3, x0 + 3, groundY + 3, z0 + 3, B.TIMBER);
  fillBox(chunks, x0 - 1, groundY + 3, z0 - 1, x0 + 4, groundY + 3, z0 + 4, clothId);
  fillBox(chunks, x0, groundY, z0, x0 + 3, groundY, z0 + 3, B.PLANK);
}

// Well
function buildWell(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  for (let dx = 0; dx < 3; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      if (dx === 0 || dx === 2 || dz === 0 || dz === 2) {
        fillBox(chunks, x0 + dx, groundY, z0 + dz, x0 + dx, groundY + 1, z0 + dz, B.STONE);
      } else {
        fillBox(chunks, x0 + dx, groundY - 1, z0 + dz, x0 + dx, groundY - 1, z0 + dz, B.WATER);
      }
    }
  }
}

// Hand pump
function buildHandPump(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY, z0, x0, groundY + 2, z0, B.STONE);
  fillBox(chunks, x0, groundY + 2, z0, x0 + 1, groundY + 2, z0, B.GOLD);
}

// Skill centre building (can be ghost or built)
export function buildSkillCentre(chunks: Chunk[], x0: number, z0: number, groundY: number, ghost: boolean) {
  const wallId = ghost ? B.CLOTH_BLUE : B.PLASTER;
  const roofId = ghost ? B.CLOTH_BLUE : B.TERRACOTTA;
  hollowBox(chunks, x0, groundY, z0, x0 + 7, groundY + 5, z0 + 5, wallId, roofId);
  fillBox(chunks, x0 + 3, groundY, z0, x0 + 3, groundY + 3, z0, ghost ? 0 : B.TIMBER);
  if (!ghost) {
    fillBox(chunks, x0 + 3, groundY + 4, z0, x0 + 3, groundY + 4, z0, B.LANTERN);
    // golden beacon
    fillBox(chunks, x0 + 3, groundY + 6, z0 + 2, x0 + 3, groundY + 9, z0 + 2, B.GOLD);
  }
}

// District watch tower
function buildTower(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY, z0, x0 + 3, groundY + 14, z0 + 3, B.MUD);
  fillBox(chunks, x0 - 1, groundY + 14, z0 - 1, x0 + 4, groundY + 16, z0 + 4, B.TERRACOTTA);
  fillBox(chunks, x0, groundY + 16, z0, x0 + 3, groundY + 16, z0 + 3, B.TIMBER);
  // ladder
  for (let y = groundY; y < groundY + 14; y += 2) {
    fillBox(chunks, x0 + 1, y, z0 + 3, x0 + 2, y, z0 + 3, B.PLANK);
  }
}

// Field worker jeep (simple blocky shape)
function buildJeep(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY + 1, z0, x0 + 4, groundY + 2, z0 + 2, B.ROOF_BLUE);
  fillBox(chunks, x0 + 1, groundY + 3, z0, x0 + 3, groundY + 3, z0 + 2, B.GLASS);
  for (const [wx, wz] of [[x0, z0], [x0 + 4, z0], [x0, z0 + 2], [x0 + 4, z0 + 2]]) {
    fillBox(chunks, wx, groundY, wz, wx + 1, groundY + 1, wz + 1, B.STONE);
  }
}

// Career terrace step
function buildTerrace(chunks: Chunk[], x0: number, z0: number, groundY: number, level: number) {
  const y = groundY + level * 2;
  fillBox(chunks, x0, y, z0, x0 + 6, y, z0 + 6, B.STONE);
  fillBox(chunks, x0, y + 1, z0, x0 + 6, y + 1, z0 + 6, B.GRASS);
  fillBox(chunks, x0 + 2, y + 2, z0 + 2, x0 + 4, y + 2, z0 + 4, B.GOLD);
}

// Lantern post
function buildLanternPost(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY, z0, x0, groundY + 3, z0, B.TIMBER);
  fillBox(chunks, x0, groundY + 3, z0, x0, groundY + 3, z0, B.LANTERN);
}

// Bullock cart
function buildCart(chunks: Chunk[], x0: number, z0: number, groundY: number) {
  fillBox(chunks, x0, groundY + 1, z0, x0 + 3, groundY + 1, z0 + 2, B.PLANK);
  fillBox(chunks, x0, groundY + 2, z0, x0 + 3, groundY + 2, z0, B.TIMBER);
  fillBox(chunks, x0 + 4, groundY + 1, z0, x0 + 5, groundY + 1, z0 + 1, B.TIMBER);
  for (const [wx, wz] of [[x0, z0], [x0 + 3, z0], [x0, z0 + 2], [x0 + 3, z0 + 2]]) {
    fillBox(chunks, wx, groundY, wz, wx, groundY, wz, B.TIMBER);
  }
}

export function generateWorld(): Chunk[] {
  const chunks: Chunk[] = [];
  for (let cx = WORLD_CHUNK_MIN; cx <= WORLD_CHUNK_MAX; cx++) {
    for (let cz = WORLD_CHUNK_MIN; cz <= WORLD_CHUNK_MAX; cz++) {
      chunks.push(new Chunk(cx, cz));
    }
  }

  const chunkMap = new Map<string, Chunk>();
  for (const c of chunks) chunkMap.set(`${c.cx},${c.cz}`, c);
  const get = (x: number, z: number) => {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    return chunkMap.get(`${cx},${cz}`);
  };

  // Base terrain
  for (let x = WORLD_CHUNK_MIN * CHUNK_SIZE; x < (WORLD_CHUNK_MAX + 1) * CHUNK_SIZE; x++) {
    for (let z = WORLD_CHUNK_MIN * CHUNK_SIZE; z < (WORLD_CHUNK_MAX + 1) * CHUNK_SIZE; z++) {
      const h = terrainHeight(x, z);
      const chunk = get(x, z)!;
      const lx = x % CHUNK_SIZE;
      const lz = z % CHUNK_SIZE;
      for (let y = 0; y <= h; y++) {
        let id = B.STONE;
        if (y === h) id = B.GRASS;
        else if (y > h - 3) id = B.DIRT;
        // sandy near water level
        if (h <= 3 && y === h) id = B.SAND;
        chunk.set(lx, y, lz, id);
      }
      // pond in the south-west
      const pondDist = Math.sqrt((x + 40) ** 2 + (z + 40) ** 2);
      if (pondDist < 10) {
        for (let y = h; y >= 2; y--) chunk.set(lx, y, lz, y === 2 ? B.WATER : 0);
        chunk.set(lx, h + 1, lz, 0);
      }
    }
  }

  // Flatten village areas
  const homePos = PLACES.find((p) => p.id === 'home')!.position;
  const marketPos = PLACES.find((p) => p.id === 'jobs')!.position;
  const trainingPos = PLACES.find((p) => p.id === 'training')!.position;
  const communityPos = PLACES.find((p) => p.id === 'community')!.position;
  const aidPos = PLACES.find((p) => p.id === 'aid')!.position;
  const careersPos = PLACES.find((p) => p.id === 'careers')!.position;
  const workerPos = PLACES.find((p) => p.id === 'fieldWorker')!.position;
  const plannerPos = PLACES.find((p) => p.id === 'districtPlanner')!.position;

  const groundAt = (x: number, z: number) => terrainHeight(x, z) + 1;

  // Home compound (west)
  flattenArea(chunks, homePos[0] - 8, homePos[2] - 8, homePos[0] + 8, homePos[2] + 8, 4);
  buildHouse(chunks, homePos[0] - 4, homePos[2] - 3, 4, 7, 6, { plaster: true });
  buildHouse(chunks, homePos[0] + 5, homePos[2] + 2, 4, 5, 5, {});
  buildHut(chunks, homePos[0] - 7, homePos[2] + 4, 4);
  buildWell(chunks, homePos[0] + 2, homePos[2] + 5, 4);
  buildHandPump(chunks, homePos[0] - 2, homePos[2] + 6, 4);
  buildTree(chunks, homePos[0] - 6, homePos[2] - 6, 4, 'neem');
  buildTree(chunks, homePos[0] + 7, homePos[2] - 5, 4, 'mango');

  // Lantern road from home to centre
  for (let i = 0; i < 20; i++) {
    const x = homePos[0] + 8 + i;
    const z = homePos[2] - 4 + Math.floor(i * 0.3);
    const chunk = get(x, z)!;
    chunk.set(x % CHUNK_SIZE, groundAt(x, z), z % CHUNK_SIZE, B.PATH);
    if (i % 3 === 0) buildLanternPost(chunks, x + 1, z, groundAt(x + 1, z));
  }

  // Market / haat (east)
  flattenArea(chunks, marketPos[0] - 10, marketPos[2] - 8, marketPos[0] + 10, marketPos[2] + 8, 4);
  buildStall(chunks, marketPos[0] - 6, marketPos[2] - 4, 4, B.CLOTH_RED);
  buildStall(chunks, marketPos[0] - 1, marketPos[2] - 4, 4, B.CLOTH_BLUE);
  buildStall(chunks, marketPos[0] + 4, marketPos[2] - 4, 4, B.CLOTH_GREEN);
  buildStall(chunks, marketPos[0] - 6, marketPos[2] + 2, 4, B.CLOTH_BLUE);
  buildStall(chunks, marketPos[0] + 4, marketPos[2] + 2, 4, B.CLOTH_RED);
  buildCart(chunks, marketPos[0] + 1, marketPos[2] + 5, 4);
  buildTree(chunks, marketPos[0] - 8, marketPos[2] + 6, 4, 'neem');

  // Skill centres (3, at different distances)
  flattenArea(chunks, trainingPos[0] - 12, trainingPos[2] - 10, trainingPos[0] + 12, trainingPos[2] + 10, 4);
  buildSkillCentre(chunks, trainingPos[0] - 8, trainingPos[2] - 4, 4, false);
  buildSkillCentre(chunks, trainingPos[0] + 2, trainingPos[2] - 4, 4, true);
  buildSkillCentre(chunks, trainingPos[0] - 3, trainingPos[2] + 4, 4, false);
  buildLanternPost(chunks, trainingPos[0] - 5, trainingPos[2], 4);
  buildLanternPost(chunks, trainingPos[0] + 5, trainingPos[2], 4);

  // Career terraces (stepped hill, west)
  flattenArea(chunks, careersPos[0] - 10, careersPos[2] - 10, careersPos[0] + 10, careersPos[2] + 10, 4);
  for (let i = 0; i < 4; i++) {
    buildTerrace(chunks, careersPos[0] - 8 + i * 2, careersPos[2] - 8 + i * 2, 4, i);
  }
  buildTree(chunks, careersPos[0] + 8, careersPos[2] + 8, 4, 'mango');

  // Bank (south-west)
  flattenArea(chunks, aidPos[0] - 6, aidPos[2] - 6, aidPos[0] + 6, aidPos[2] + 6, 4);
  buildHouse(chunks, aidPos[0] - 3, aidPos[2] - 3, 4, 7, 6, { plaster: true, roof: B.ROOF_BLUE });
  buildLanternPost(chunks, aidPos[0] + 4, aidPos[2] + 4, 4);

  // Chaupal under banyan (centre-north)
  flattenArea(chunks, communityPos[0] - 8, communityPos[2] - 8, communityPos[0] + 8, communityPos[2] + 8, 4);
  buildBanyan(chunks, communityPos[0], communityPos[2], 4);
  buildHouse(chunks, communityPos[0] + 5, communityPos[2] + 3, 4, 5, 5, {});

  // Field worker jeep + shed
  flattenArea(chunks, workerPos[0] - 5, workerPos[2] - 5, workerPos[0] + 5, workerPos[2] + 5, 4);
  buildJeep(chunks, workerPos[0] - 2, workerPos[2] - 1, 4);
  buildHut(chunks, workerPos[0] + 2, workerPos[2] + 1, 4);

  // District tower (north-east)
  flattenArea(chunks, plannerPos[0] - 6, plannerPos[2] - 6, plannerPos[0] + 6, plannerPos[2] + 6, 4);
  buildTower(chunks, plannerPos[0], plannerPos[2], 4);

  // Fields around the village
  buildField(chunks, -40, 20, 4, 10, 8, B.WHEAT);
  buildField(chunks, -40, 30, 4, 10, 8, B.CROP);
  buildField(chunks, 30, 24, 4, 8, 8, B.WHEAT);
  buildField(chunks, -14, 34, 4, 8, 6, B.FLOWER);

  // Scattered trees
  const treeSpots: [number, number, 'neem' | 'mango' | 'palm'][] = [
    [-30, 18, 'neem'], [-24, 26, 'mango'], [10, 22, 'palm'], [36, -6, 'neem'],
    [-36, -10, 'mango'], [6, -26, 'palm'], [40, 12, 'neem'], [-12, -30, 'mango'],
    [24, -24, 'neem'], [-44, 4, 'palm'], [14, 34, 'mango'],
  ];
  for (const [tx, tz, kind] of treeSpots) {
    buildTree(chunks, tx, tz, groundAt(tx, tz), kind);
  }

  // Mark all chunks dirty for initial mesh
  for (const c of chunks) c.dirty = true;
  return chunks;
}
