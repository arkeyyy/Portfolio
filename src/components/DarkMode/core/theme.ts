import type {
  CosmicRenderTheme,
  DepthFieldLayer,
  Rgb,
} from './contracts';

export const STAR_COLOR_FADE_MS = 1500;

export const PARALLAX_DEPTH = {
  distant: 0.16,
  far: 0.24,
  middle: 0.42,
  near: 0.58,
  foreground: 0.78,
  starField: 0.24,
  goldStars: 0.32,
  starClusters: 0.44,
} as const;

export const DEPTH_FIELD_STAR_STRENGTH = {
  field: 0.65,
  gold: 0.78,
  cluster: 0.62,
} as const;

export const DEPTH_FIELD_LAYERS = {
  cancerHaze: {
    translationDepth: 0.08,
    perspectiveDepth: 0.26,
    perspectiveStrength: 0.3,
  },
  cancer: {
    translationDepth: PARALLAX_DEPTH.distant,
    perspectiveDepth: 0.34,
    perspectiveStrength: 0.38,
  },
  libraHaze: {
    translationDepth: 0.46 * PARALLAX_DEPTH.starClusters,
    perspectiveDepth: 0.46,
    perspectiveStrength: DEPTH_FIELD_STAR_STRENGTH.cluster,
  },
  libra: {
    translationDepth: PARALLAX_DEPTH.far,
    perspectiveDepth: 0.54,
    perspectiveStrength: 0.58,
  },
  distantRing: {
    translationDepth: PARALLAX_DEPTH.far,
    perspectiveDepth: 1,
    perspectiveStrength: 0.28,
  },
  mainRing: {
    translationDepth: PARALLAX_DEPTH.middle,
    perspectiveDepth: 1,
    perspectiveStrength: 0.48,
  },
  cloudCore: {
    translationDepth: PARALLAX_DEPTH.near,
    perspectiveDepth: 1,
    perspectiveStrength: 0.42,
  },
  foregroundClouds: {
    translationDepth: PARALLAX_DEPTH.foreground,
    perspectiveDepth: 1,
    perspectiveStrength: 0.62,
  },
} as const satisfies Record<string, DepthFieldLayer>;

export const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
export const CLOUD_ACCENT: Rgb = [72, 78, 255];
export const ABOUT_CLOUD_ACCENT: Rgb = [158, 88, 255];
export const FOREGROUND_CLOUD_PURPLE: Rgb = [148, 82, 255];
export const DEEP_SPACE: Rgb = [10, 14, 54];
const DARK_STAR_NEUTRAL: Rgb = [225, 234, 255];

export const COSMIC_RENDER_THEME: CosmicRenderTheme = {
  neutralStarColor: DARK_STAR_NEUTRAL,
  cloudCompositeOperation: 'screen',
  backgroundWash: { centerAlpha: 0.12, depthAlpha: 0.065 },
  fieldStarAlpha: 0.34,
  goldStarAlpha: 0.58,
  starClusters: { baseAlpha: 0.86, highlightAlpha: 0.92 },
  ringTrails: { baseAlpha: 0.09, laneFalloff: 0.01, dashAlpha: 0.17 },
  secondaryRings: {
    distantAlpha: 0.1,
    innerAlpha: 0.125,
    dashAlpha: 0.18,
    particleAlpha: 0.72,
  },
  aurora: { activeAlpha: 0.76, purpleAlpha: 0.32 },
  quasar: { spriteAlpha: 0.82, lensAlpha: 0.48, particleAlpha: 0.76 },
  libra: { cloudAlpha: 0.72, lineAlpha: 0.64, starAlpha: 0.96 },
  cancer: { cloudAlpha: 0.5, lineAlpha: 0.48, starAlpha: 0.88 },
  distantCyclone: {
    hazeAlpha: 0.34,
    cyanAlpha: 0.56,
    crestAlpha: 0.68,
    pinkAlpha: 0.56,
    sparkAlpha: 0.78,
    coreAlpha: 0.82,
  },
  vortex: { activeAlpha: 0.56, accentAlpha: 0.34, coreAlpha: 0.065, starAlpha: 0.88 },
  clouds: {
    accentAlpha: 0.4,
    activeAlpha: 0.7,
    glowCoreAlpha: 0.04,
    glowMidAlpha: 0.018,
  },
  atmosphericFog: { far: 0.13, middle: 0.17, near: 0.21 },
  foregroundClouds: {
    purpleAlpha: 0.22,
    activeAlpha: 0.1,
    glowCoreAlpha: 0.045,
    glowMidAlpha: 0.022,
  },
  ringParticleAlpha: 0.88,
  planetRing: { foregroundAlpha: 0.58, backgroundAlpha: 0.34 },
  planetSurface: {
    featureAlpha: 0.4,
    violetStormAlpha: 0.52,
    rockyShadowAlpha: 0.24,
    rockyCraterAlpha: 0.5,
    rockyCraterRimAlpha: 0.34,
    oceanFeatureAlpha: 0.46,
    oceanCloudAlpha: 0.48,
    iceFacetAlpha: 0.24,
    iceFissureAlpha: 0.72,
  },
  planetAtmosphere: {
    rockyAlpha: 0.2,
    iceAlpha: 0.68,
    standardAlpha: 0.44,
    iceOuterAlpha: 0.24,
  },
  planetGradient: [0.84, 0.98, 0.99, 0.99],
  rogueTrailAlpha: 0.28,
};

export const BRAND_STAR_COLORS: readonly Rgb[] = [
  [0, 175, 255],
  [255, 183, 0],
  [7, 236, 152],
  [255, 111, 97],
  [127, 84, 255],
  [233, 14, 230],
];
