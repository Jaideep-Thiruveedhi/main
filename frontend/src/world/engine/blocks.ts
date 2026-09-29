import { TILE } from './atlas';

// Block type registry. Each block maps faces to atlas tiles.
// face order: [px, nx, py, ny, pz, nz]

export interface BlockDef {
  name: string;
  tiles: [number, number, number, number, number, number];
  solid: boolean;
  transparent?: boolean;
  liquid?: boolean;
  light?: number; // 0-15 emitted light
}

const B = (name: string, tiles: [number, number, number, number, number, number], opts: Partial<BlockDef> = {}): BlockDef => ({
  name, tiles, solid: true, ...opts,
});

export const BLOCKS: Record<number, BlockDef> = {
  0: B('air', [0, 0, 0, 0, 0, 0], { solid: false }),
  1: B('grass', [TILE.GRASS_SIDE, TILE.GRASS_SIDE, TILE.GRASS_TOP, TILE.DIRT, TILE.GRASS_SIDE, TILE.GRASS_SIDE]),
  2: B('dirt', [TILE.DIRT, TILE.DIRT, TILE.DIRT, TILE.DIRT, TILE.DIRT, TILE.DIRT]),
  3: B('sand', [TILE.SAND, TILE.SAND, TILE.SAND, TILE.SAND, TILE.SAND, TILE.SAND]),
  4: B('stone', [TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE]),
  5: B('mud_brick', [TILE.MUD_BRICK, TILE.MUD_BRICK, TILE.MUD_BRICK, TILE.MUD_BRICK, TILE.MUD_BRICK, TILE.MUD_BRICK]),
  6: B('plaster', [TILE.PLASTER, TILE.PLASTER, TILE.PLASTER, TILE.PLASTER, TILE.PLASTER, TILE.PLASTER]),
  7: B('terracotta', [TILE.TERRACOTTA, TILE.TERRACOTTA, TILE.TERRACOTTA, TILE.TERRACOTTA, TILE.TERRACOTTA, TILE.TERRACOTTA]),
  8: B('thatch', [TILE.THATCH, TILE.THATCH, TILE.THATCH, TILE.THATCH, TILE.THATCH, TILE.THATCH]),
  9: B('timber', [TILE.TIMBER, TILE.TIMBER, TILE.TIMBER, TILE.TIMBER, TILE.TIMBER, TILE.TIMBER]),
  10: B('plank', [TILE.PLANK, TILE.PLANK, TILE.PLANK, TILE.PLANK, TILE.PLANK, TILE.PLANK]),
  11: B('cobble', [TILE.COBBLE, TILE.COBBLE, TILE.COBBLE, TILE.COBBLE, TILE.COBBLE, TILE.COBBLE]),
  12: B('water', [TILE.WATER, TILE.WATER, TILE.WATER, TILE.WATER, TILE.WATER, TILE.WATER], { solid: false, transparent: true, liquid: true }),
  13: B('wheat', [TILE.WHEAT, TILE.WHEAT, TILE.WHEAT, TILE.WHEAT, TILE.WHEAT, TILE.WHEAT], { solid: false }),
  14: B('flower', [TILE.FLOWER, TILE.FLOWER, TILE.FLOWER, TILE.FLOWER, TILE.FLOWER, TILE.FLOWER], { solid: false }),
  15: B('leaves', [TILE.LEAVES, TILE.LEAVES, TILE.LEAVES, TILE.LEAVES, TILE.LEAVES, TILE.LEAVES], { transparent: true }),
  16: B('cloth_red', [TILE.CLOTH_RED, TILE.CLOTH_RED, TILE.CLOTH_RED, TILE.CLOTH_RED, TILE.CLOTH_RED, TILE.CLOTH_RED], { solid: false }),
  17: B('cloth_blue', [TILE.CLOTH_BLUE, TILE.CLOTH_BLUE, TILE.CLOTH_BLUE, TILE.CLOTH_BLUE, TILE.CLOTH_BLUE, TILE.CLOTH_BLUE], { solid: false }),
  18: B('cloth_green', [TILE.CLOTH_GREEN, TILE.CLOTH_GREEN, TILE.CLOTH_GREEN, TILE.CLOTH_GREEN, TILE.CLOTH_GREEN, TILE.CLOTH_GREEN], { solid: false }),
  19: B('glass', [TILE.GLASS, TILE.GLASS, TILE.GLASS, TILE.GLASS, TILE.GLASS, TILE.GLASS], { transparent: true }),
  20: B('gold', [TILE.GOLD, TILE.GOLD, TILE.GOLD, TILE.GOLD, TILE.GOLD, TILE.GOLD]),
  21: B('lantern', [TILE.LANTERN, TILE.LANTERN, TILE.LANTERN, TILE.LANTERN, TILE.LANTERN, TILE.LANTERN], { solid: false, light: 14 }),
  22: B('roof_blue', [TILE.ROOF_BLUE, TILE.ROOF_BLUE, TILE.ROOF_BLUE, TILE.ROOF_BLUE, TILE.ROOF_BLUE, TILE.ROOF_BLUE]),
  23: B('path', [TILE.PATH, TILE.PATH, TILE.PATH, TILE.PATH, TILE.PATH, TILE.PATH]),
  24: B('crop_green', [TILE.CROP_GREEN, TILE.CROP_GREEN, TILE.CROP_GREEN, TILE.CROP_GREEN, TILE.CROP_GREEN, TILE.CROP_GREEN], { solid: false }),
  25: B('pumpkin', [TILE.PUMPKIN, TILE.PUMPKIN, TILE.PUMPKIN, TILE.PUMPKIN, TILE.PUMPKIN, TILE.PUMPKIN]),
};

export function getBlock(id: number): BlockDef {
  return BLOCKS[id] ?? BLOCKS[0];
}

export function isSolid(id: number): boolean {
  return getBlock(id).solid;
}

export function isTransparent(id: number): boolean {
  const b = getBlock(id);
  return !b.solid || b.transparent === true;
}
