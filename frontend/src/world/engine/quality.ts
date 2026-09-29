export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  shadows: boolean;
  shadowCascades: number;
  postProcessing: boolean;
  ssao: boolean;
  viewDistanceChunks: number;
  maxNpcs: number;
  maxAnimals: number;
  weather: boolean;
  pixelRatioCap: number;
  bloom: boolean;
  waterReflection: boolean;
}

const PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    tier: 'low', shadows: false, shadowCascades: 0, postProcessing: false, ssao: false,
    viewDistanceChunks: 4, maxNpcs: 6, maxAnimals: 4, weather: false,
    pixelRatioCap: 1, bloom: false, waterReflection: false,
  },
  medium: {
    tier: 'medium', shadows: true, shadowCascades: 1, postProcessing: true, ssao: false,
    viewDistanceChunks: 6, maxNpcs: 12, maxAnimals: 8, weather: true,
    pixelRatioCap: 1.5, bloom: true, waterReflection: false,
  },
  high: {
    tier: 'high', shadows: true, shadowCascades: 2, postProcessing: true, ssao: true,
    viewDistanceChunks: 9, maxNpcs: 20, maxAnimals: 14, weather: true,
    pixelRatioCap: 2, bloom: true, waterReflection: true,
  },
};

export function getQualitySettings(tier: QualityTier): QualitySettings {
  return PRESETS[tier];
}

// Quick GPU benchmark to auto-detect a tier.
export function detectQualityTier(): QualityTier {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : '';
    const r = String(renderer).toLowerCase();
    const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    const lowEnd = /mali-4|adreno 3|powervr|intel hd graphics 4|swiftshader/i.test(r);
    if (mobile || lowEnd) {
      const mem = (navigator as any).deviceMemory;
      if (mem && mem <= 3) return 'low';
      return 'medium';
    }
    const highEnd = /rtx|radeon rx|apple m[2-9]|adreno 7|mali-g7/i.test(r);
    return highEnd ? 'high' : 'medium';
  } catch {
    return 'medium';
  }
}
