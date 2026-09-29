import * as THREE from 'three';

// Procedural 16x16 pixel texture atlas - no external assets, crisp Minecraft look.

export const TILE = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, SAND: 3, STONE: 4,
  MUD_BRICK: 5, PLASTER: 6, TERRACOTTA: 7, THATCH: 8, TIMBER: 9,
  PLANK: 10, COBBLE: 11, WATER: 12, WHEAT: 13, FLOWER: 14, LEAVES: 15,
  CLOTH_RED: 16, CLOTH_BLUE: 17, CLOTH_GREEN: 18, GLASS: 19, GOLD: 20,
  LANTERN: 21, ROOF_BLUE: 22, PATH: 23, CROP_GREEN: 24, PUMPKIN: 25,
} as const;

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 4;
export const ATLAS_SIZE = ATLAS_COLS * ATLAS_ROWS;

type Painter = (ctx: CanvasRenderingContext2D, x: number, y: number, rand: () => number) => void;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function fill(ctx: CanvasRenderingContext2D, ox: number, oy: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(ox, oy, 16, 16);
}

function speckle(ctx: CanvasRenderingContext2D, ox: number, oy: number, colors: string[], density: number, rand: () => number) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (rand() < density) {
        px(ctx, ox + x, oy + y, colors[Math.floor(rand() * colors.length)]);
      }
    }
  }
}

function noiseRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const painters: Record<number, Painter> = {
  [TILE.GRASS_TOP]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#5d9c3f');
    speckle(ctx, ox, oy, ['#6fb34c', '#4e8a34', '#7cc257', '#548f3a'], 0.35, rand);
  },
  [TILE.GRASS_SIDE]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#8a5a33');
    speckle(ctx, ox, oy, ['#7a4e2c', '#96643a'], 0.25, rand);
    for (let x = 0; x < 16; x++) {
      const depth = 3 + Math.floor(rand() * 2);
      for (let y = 0; y < depth; y++) px(ctx, ox + x, oy + y, ['#5d9c3f', '#6fb34c', '#4e8a34'][Math.floor(rand() * 3)]);
    }
  },
  [TILE.DIRT]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#8a5a33');
    speckle(ctx, ox, oy, ['#7a4e2c', '#96643a', '#6e4526'], 0.3, rand);
  },
  [TILE.SAND]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#e0c98f');
    speckle(ctx, ox, oy, ['#d4ba7a', '#ecd8a0', '#c9ad6e'], 0.3, rand);
  },
  [TILE.STONE]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#8d8d8d');
    speckle(ctx, ox, oy, ['#7d7d7d', '#9d9d9d', '#6e6e6e'], 0.3, rand);
  },
  [TILE.MUD_BRICK]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#a0663a');
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      for (let x = 0; x < 16; x++) {
        const offset = row % 2 === 0 ? 0 : 4;
        const bx = (x + offset) % 16;
        if (x % 8 === 0 && offset === 0) px(ctx, ox + x, oy + y, '#7a4e2c');
        px(ctx, ox + bx, oy + y, ['#a0663a', '#96592f', '#ad7040'][Math.floor(rand() * 3)]);
        px(ctx, ox + bx, oy + y + 3, '#7a4e2c');
      }
      for (let x = 0; x < 16; x++) px(ctx, ox + x, oy + y + 3, '#7a4e2c');
    }
    speckle(ctx, ox, oy, ['#8a5530', '#b07040'], 0.15, rand);
  },
  [TILE.PLASTER]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#f5efe0');
    speckle(ctx, ox, oy, ['#efe8d8', '#faf5ea', '#e8e0cc'], 0.2, rand);
  },
  [TILE.TERRACOTTA]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#c1633a');
    for (let row = 0; row < 4; row++) {
      for (let x = 0; x < 16; x++) {
        const curve = Math.sin((x / 16) * Math.PI) * 2;
        const y = row * 4 + Math.floor(curve);
        px(ctx, ox + x, oy + y, '#c1633a');
        px(ctx, ox + x, oy + y + 1, '#a8542f');
        px(ctx, ox + x, oy + y + 2, '#8f4526');
      }
    }
    speckle(ctx, ox, oy, ['#d07045', '#b05a32'], 0.15, rand);
  },
  [TILE.THATCH]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#c9a44e');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if ((x + y * 2) % 3 === 0) px(ctx, ox + x, oy + y, ['#b8933f', '#d8b45e', '#a8853a'][Math.floor(rand() * 3)]);
      }
    }
  },
  [TILE.TIMBER]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#6e4a26');
    for (let x = 0; x < 16; x++) {
      if (x % 4 === 0) {
        for (let y = 0; y < 16; y++) px(ctx, ox + x, oy + y, '#5a3a1e');
      } else {
        for (let y = 0; y < 16; y++) {
          if (rand() < 0.1) px(ctx, ox + x, oy + y, '#7d5630');
        }
      }
    }
  },
  [TILE.PLANK]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#9c7040');
    for (let row = 0; row < 4; row++) {
      for (let x = 0; x < 16; x++) {
        px(ctx, ox + x, oy + row * 4, ['#9c7040', '#8a6236', '#aa7c48'][Math.floor(rand() * 3)]);
      }
      for (let x = 0; x < 16; x++) px(ctx, ox + x, oy + row * 4 + 3, '#6e4a26');
    }
  },
  [TILE.COBBLE]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#7a7a7a');
    for (let i = 0; i < 12; i++) {
      const cx = Math.floor(rand() * 13);
      const cy = Math.floor(rand() * 13);
      const w = 2 + Math.floor(rand() * 3);
      const h = 2 + Math.floor(rand() * 3);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          px(ctx, ox + cx + x, oy + cy + y, ['#8d8d8d', '#6e6e6e', '#9d9d9d'][Math.floor(rand() * 3)]);
        }
      }
    }
  },
  [TILE.WATER]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#3d7dd8');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y * 3) % 5 === 0) px(ctx, ox + x, oy + y, '#5a9aec');
        if ((x * 2 + y) % 7 === 0) px(ctx, ox + x, oy + y, '#2d6cc4');
      }
    }
  },
  [TILE.WHEAT]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#d8b84e');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (y % 4 === 0) px(ctx, ox + x, oy + y, '#c4a43e');
        else if (rand() < 0.2) px(ctx, ox + x, oy + y, '#e8cc6e');
      }
    }
  },
  [TILE.FLOWER]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#5d9c3f');
    speckle(ctx, ox, oy, ['#6fb34c', '#4e8a34'], 0.3, rand);
    for (let i = 0; i < 5; i++) {
      const fx = 1 + Math.floor(rand() * 14);
      const fy = 1 + Math.floor(rand() * 14);
      px(ctx, ox + fx, oy + fy, '#f2b33d');
      px(ctx, ox + fx + 1, oy + fy, '#e8963d');
      px(ctx, ox + fx, oy + fy + 1, '#f2d03d');
    }
  },
  [TILE.LEAVES]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#3e7a2e');
    speckle(ctx, ox, oy, ['#4e8a3a', '#2e6a22', '#5da348', '#6fb34c'], 0.4, rand);
  },
  [TILE.CLOTH_RED]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#c13a3a');
    speckle(ctx, ox, oy, ['#a82e2e', '#d04848'], 0.2, rand);
  },
  [TILE.CLOTH_BLUE]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#3a5ac1');
    speckle(ctx, ox, oy, ['#2e4aa8', '#4868d0'], 0.2, rand);
  },
  [TILE.CLOTH_GREEN]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#3aa15a');
    speckle(ctx, ox, oy, ['#2e8a4a', '#48b068'], 0.2, rand);
  },
  [TILE.GLASS]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#c8e4f0');
    for (let i = 0; i < 16; i++) {
      px(ctx, ox + i, oy, '#a8d0e0');
      px(ctx, ox + i, oy + 15, '#a8d0e0');
      px(ctx, ox, oy + i, '#a8d0e0');
      px(ctx, ox + 15, oy + i, '#a8d0e0');
    }
    px(ctx, ox + 3, oy + 3, '#e8f4fa');
    px(ctx, ox + 4, oy + 4, '#e8f4fa');
  },
  [TILE.GOLD]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#f2b33d');
    speckle(ctx, ox, oy, ['#e8a32e', '#ffd05e'], 0.25, rand);
  },
  [TILE.LANTERN]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#5a3a1e');
    for (let y = 2; y < 14; y++) {
      for (let x = 2; x < 14; x++) {
        px(ctx, ox + x, oy + y, '#ffd870');
      }
    }
    for (let i = 0; i < 16; i++) {
      px(ctx, ox + i, oy, '#3a2410');
      px(ctx, ox + i, oy + 15, '#3a2410');
      px(ctx, ox, oy + i, '#3a2410');
      px(ctx, ox + 15, oy + i, '#3a2410');
    }
  },
  [TILE.ROOF_BLUE]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#3a6ac1');
    for (let row = 0; row < 4; row++) {
      for (let x = 0; x < 16; x++) {
        px(ctx, ox + x, oy + row * 4, ['#3a6ac1', '#2e5aa8', '#4878d0'][Math.floor(rand() * 3)]);
      }
      for (let x = 0; x < 16; x++) px(ctx, ox + x, oy + row * 4 + 3, '#244a8a');
    }
  },
  [TILE.PATH]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#b89a6e');
    speckle(ctx, ox, oy, ['#a88a5e', '#c8aa7e', '#987a4e'], 0.35, rand);
  },
  [TILE.CROP_GREEN]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#4e8a34');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (y % 3 === 0) px(ctx, ox + x, oy + y, ['#5da348', '#3e7a2e', '#6fb34c'][Math.floor(rand() * 3)]);
      }
    }
  },
  [TILE.PUMPKIN]: (ctx, ox, oy, rand) => {
    fill(ctx, ox, oy, '#e8862e');
    for (let x = 0; x < 16; x++) {
      if (x % 4 === 0) {
        for (let y = 0; y < 16; y++) px(ctx, ox + x, oy + y, '#c46a1e');
      }
    }
    speckle(ctx, ox, oy, ['#f2963e', '#d07626'], 0.2, rand);
  },
};

let cachedAtlas: THREE.Texture | null = null;

export function getAtlas(): THREE.Texture {
  if (cachedAtlas) return cachedAtlas;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * 16;
  canvas.height = ATLAS_ROWS * 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < ATLAS_SIZE; i++) {
    const ox = (i % ATLAS_COLS) * 16;
    const oy = Math.floor(i / ATLAS_COLS) * 16;
    const painter = painters[i];
    if (painter) painter(ctx, ox, oy, noiseRand(i * 7919 + 13));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedAtlas = tex;
  return tex;
}

// UV rect for a tile index within the atlas
export function tileUV(index: number): { u0: number; v0: number; u1: number; v1: number } {
  const col = index % ATLAS_COLS;
  const row = Math.floor(index / ATLAS_COLS);
  const pad = 0.02;
  return {
    u0: col / ATLAS_COLS + pad / ATLAS_COLS,
    v0: 1 - (row + 1) / ATLAS_ROWS + pad / ATLAS_ROWS,
    u1: (col + 1) / ATLAS_COLS - pad / ATLAS_COLS,
    v1: 1 - row / ATLAS_ROWS - pad / ATLAS_ROWS,
  };
}
