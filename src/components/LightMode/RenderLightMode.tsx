import { useEffect, useRef } from 'react';
import {
  RENDERER_SNAPSHOT_VERSION,
  cloneRendererRgb,
  isRendererCameraSnapshot,
  isRendererRgbSnapshot,
} from '../../background-renderer/session';
import type {
  DeviceOrientationSession,
  LightRendererSnapshot,
  RendererSession,
} from '../../background-renderer/session';
import { registerRendererPrewarmer } from '../../background-renderer/prewarm';

type RenderLightModeProps = {
  activeColor: string;
  session: RendererSession<LightRendererSnapshot>;
  deviceOrientationSession: DeviceOrientationSession;
};

type Rgb = [number, number, number];
type CloudLayerKind = 'far' | 'middle' | 'foreground';
type HazeLayerKind = 'far' | 'middle' | 'near';

type AtmosphericDepthProfile = Readonly<{
  translation: number;
  perspective: number;
  tilt: number;
}>;

type CloudSprites = {
  farA: HTMLCanvasElement;
  farB: HTMLCanvasElement;
  middleA: HTMLCanvasElement;
  middleB: HTMLCanvasElement;
  foreground: HTMLCanvasElement;
};

type AtmosphericSprites = {
  washes: AtmosphericWashSprites;
  particles: AtmosphericParticleSprites;
  clouds: CloudSprites;
  cyanHaze: HTMLCanvasElement;
  foregroundCyanHaze: HTMLCanvasElement;
  lavenderHaze: HTMLCanvasElement;
  distantHills: DistantHillSprites;
  foregroundTrees: HTMLCanvasElement;
  riverLightMotes: RiverLightMoteSprites;
  riverParticles: RiverParticleSprites;
  risingRiverFragments: RisingRiverFragmentSprites;
  risingRiverFogPatches: RisingRiverFogPatchSprites;
  risingRiverGlows: RisingRiverGlowSprites;
  sun: HTMLCanvasElement;
};

type DistantHillSprites = {
  far: HTMLCanvasElement;
  middle: HTMLCanvasElement;
  near: HTMLCanvasElement;
};

type Cloud = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  speed: number;
  direction: -1 | 1;
  phase: number;
  opacity: number;
  layer: CloudLayerKind;
  sprite: HTMLCanvasElement;
};

type HazeLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  phase: number;
  driftX: number;
  driftY: number;
  opacity: number;
  layer: HazeLayerKind;
  sprite: HTMLCanvasElement;
};

type DistantHillLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  opacity: number;
  sprite: HTMLCanvasElement;
};

type ForegroundTreeLine = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  opacity: number;
  sprite: HTMLCanvasElement;
};

type RiverGlowLobe = Readonly<{
  phase: number;
  halfWidth: number;
  halfHeight: number;
  opacity: number;
  speed: number;
  verticalOffset: number;
}>;

type RiverParticleSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];

type RiverLightMoteSprites = {
  atlas: HTMLCanvasElement;
  cellSize: number;
};

type RiverLightMote = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: number;
  hoverSpeed: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
  shapeIndex: 0 | 1 | 2;
  toneIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};

type RiverParticle = {
  qualityRank: number;
  phase: number;
  speed: number;
  size: number;
  depthProfile: AtmosphericDepthProfile;
  depthScale: number;
  spriteIndex: 0 | 1 | 2;
  y: number;
  horizontalDrift: number;
  verticalDrift: number;
  driftSpeed: number;
  driftPhase: number;
  lift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

type RisingRiverFragmentGlowVariant = -1 | 0 | 1;

type RisingRiverFragmentSprites = {
  colorAtlas: HTMLCanvasElement;
  transitionGlowAtlas: HTMLCanvasElement;
  cellSize: number;
};

type RisingRiverFragment = {
  sourceX: number;
  sourceY: number;
  riseDistance: number;
  phase: number;
  duration: number;
  baseSize: number;
  terminalScale: number;
  horizontalDrift: number;
  sway: number;
  swayCycles: number;
  rotation: number;
  rotationSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  opacity: number;
  shapeIndex: 0 | 1 | 2 | 3 | 4;
  colorSequence: readonly number[];
  colorPhaseMs: number;
  haloStrength: number;
  transitionGlowVariant: RisingRiverFragmentGlowVariant;
  depthProfile: AtmosphericDepthProfile;
};

type RisingRiverFogPatchSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];

type RisingRiverFogPatch = {
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
  riseDistance: number;
  phase: number;
  duration: number;
  horizontalDrift: number;
  sway: number;
  swayCycles: number;
  growthX: number;
  growthY: number;
  opacity: number;
  spriteIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};

type RisingRiverGlowSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];

type RisingRiverGlow = {
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
  riseDistance: number;
  phase: number;
  duration: number;
  horizontalDrift: number;
  sway: number;
  swayCycles: number;
  rotation: number;
  rotationDrift: number;
  growth: number;
  opacity: number;
  spriteIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};

type AtmosphericParticle = {
  qualityRank: number;
  x: number;
  y: number;
  size: number;
  depthProfile: AtmosphericDepthProfile;
  phase: number;
  drift: number;
  speed: number;
  colorIndex: number;
};

type SunState = {
  x: number;
  y: number;
  radius: number;
  glowRadius: number;
};

type DepthProjection = {
  x: number;
  y: number;
  scale: number;
  alphaScale: number;
};

type ParallaxFrame = {
  positionX: number;
  positionY: number;
  maximumOffsetX: number;
  maximumOffsetY: number;
  maximumPitch: number;
  maximumYaw: number;
  maximumPerspectiveScale: number;
  centerX: number;
  centerY: number;
  inverseHalfWidth: number;
  inverseHalfHeight: number;
  cursorNormalization: number;
};

type AtmosphericScene = {
  width: number;
  height: number;
  compact: boolean;
  motionScale: number;
  pixelRatio: number;
  parallax: ParallaxFrame;
  sun: SunState;
  clouds: Cloud[];
  haze: HazeLayer[];
  distantHills: DistantHillLayer[];
  foregroundTrees: ForegroundTreeLine;
  riverLightMotes: RiverLightMote[];
  riverParticles: RiverParticle[];
  risingRiverFragments: RisingRiverFragment[];
  risingRiverFogPatches: RisingRiverFogPatch[];
  risingRiverGlows: RisingRiverGlow[];
  particles: AtmosphericParticle[];
  projection: DepthProjection;
};

type AtmosphericWashSprites = {
  sky: HTMLCanvasElement;
  riverBed: HTMLCanvasElement;
  riverLobe: HTMLCanvasElement;
  sunAccent: HTMLCanvasElement;
  compactSunAccent: HTMLCanvasElement;
  cyan: HTMLCanvasElement;
  lavender: HTMLCanvasElement;
  right: HTMLCanvasElement;
  lowerRight: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  edge: HTMLCanvasElement;
  tint: HTMLCanvasElement;
};

type AtmosphericParticleSprites = {
  atlas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tint: Rgb;
};

type CachedPlane = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

type FramePlanes = {
  sky: CachedPlane;
  edge: CachedPlane;
  tint: CachedPlane;
  tintScratch: CachedPlane;
  color: Rgb;
  rightColor: Rgb;
  foregroundColor: Rgb;
  cameraX: number;
  cameraY: number;
  valid: boolean;
};

type QualityTier = 0 | 1 | 2;
type AdaptiveQuality = {
  tier: QualityTier;
  warmupUntil: number;
  changedAt: number;
  paintEma: number;
  overloadPaints: number;
  stablePaints: number;
  lateSamples: Uint8Array;
  sampleIndex: number;
  sampleCount: number;
  lateCount: number;
  triangleWeights: Float64Array;
  particleWeights: Float64Array;
};

const QUALITY_PROFILES = [
  { desktopFps: 60, mobileFps: 30, triangles: 1, particles: 1 },
  { desktopFps: 45, mobileFps: 27, triangles: 0.75, particles: 0.5 },
  { desktopFps: 30, mobileFps: 24, triangles: 0.5, particles: 0.25 },
] as const;
const QUALITY_FADE_MS = 650;

function createAdaptiveQuality(now: number): AdaptiveQuality {
  return {
    tier: 0, warmupUntil: now + 2000, changedAt: -Infinity,
    paintEma: 0, overloadPaints: 0, stablePaints: 0,
    lateSamples: new Uint8Array(120), sampleIndex: 0, sampleCount: 0, lateCount: 0,
    triangleWeights: new Float64Array([1, 1, 1, 1]),
    particleWeights: new Float64Array([1, 1, 1, 1]),
  };
}

function resetQualityMeasurements(quality: AdaptiveQuality, now: number) {
  quality.warmupUntil = now + 2000;
  quality.paintEma = 0;
  quality.overloadPaints = quality.stablePaints = 0;
  quality.sampleIndex = quality.sampleCount = quality.lateCount = 0;
  quality.lateSamples.fill(0);
}

function recordQualityPaint(
  quality: AdaptiveQuality,
  now: number,
  cost: number,
  scheduledElapsed: number,
  interval: number,
) {
  if (now < quality.warmupUntil) return;
  quality.paintEma = quality.sampleCount === 0 ? cost
    : quality.paintEma + (cost - quality.paintEma) * 0.05;
  quality.lateCount -= quality.lateSamples[quality.sampleIndex];
  const late = scheduledElapsed > interval * 1.35 ? 1 : 0;
  quality.lateSamples[quality.sampleIndex] = late;
  quality.lateCount += late;
  quality.sampleIndex = (quality.sampleIndex + 1) % quality.lateSamples.length;
  quality.sampleCount = Math.min(quality.sampleCount + 1, quality.lateSamples.length);
  quality.overloadPaints = quality.paintEma > interval * 0.72
    ? quality.overloadPaints + 1 : 0;
  quality.stablePaints = quality.paintEma < interval * 0.42 && late === 0
    ? quality.stablePaints + 1 : 0;
  if (now - quality.changedAt < 10_000) return;
  const overloaded = quality.overloadPaints >= 90
    || (quality.sampleCount === 120 && quality.lateCount > 18);
  if (overloaded && quality.tier < 2) {
    quality.tier = (quality.tier + 1) as QualityTier;
  } else if (quality.stablePaints >= 360 && quality.tier > 0) {
    quality.tier = (quality.tier - 1) as QualityTier;
  } else {
    return;
  }
  quality.changedAt = now;
  resetQualityMeasurements(quality, now);
}

function updateQualityWeights(quality: AdaptiveQuality, elapsed: number) {
  const profile = QUALITY_PROFILES[quality.tier];
  const step = Math.max(elapsed, 0) / QUALITY_FADE_MS;
  for (let band = 0; band < 4; band += 1) {
    const rank = (band + 1) * 0.25;
    const triangleTarget = rank <= profile.triangles ? 1 : 0;
    const particleTarget = rank <= profile.particles ? 1 : 0;
    quality.triangleWeights[band] += clamp(
      triangleTarget - quality.triangleWeights[band], -step, step,
    );
    quality.particleWeights[band] += clamp(
      particleTarget - quality.particleWeights[band], -step, step,
    );
  }
}

function qualityOpacity(rank: number, weights: Float64Array) {
  return weights[Math.min(Math.floor(rank * 4), 3)];
}

function qualityRank(index: number, salt: number) {
  let hash = (index ^ salt) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000;
}

type DeviceOrientationPermissionState =
  | 'unavailable'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'denied';

type DeviceOrientationEventConstructor = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type CloudSpec = {
  x: number;
  y: number;
  width: number;
  aspect: number;
  speed: number;
  direction: -1 | 1;
  opacity: number;
  layer: CloudLayerKind;
  sprite: keyof CloudSprites;
};

const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const SKY_CYAN: Rgb = [114, 199, 232];
const FOREGROUND_FOG_CYAN: Rgb = [92, 196, 238];
const SKY_LAVENDER: Rgb = [178, 166, 226];
const RIVER_LIGHT_BLUE: Rgb = [157, 205, 214];
const RIGHT_GLOW_GOLD: Rgb = [255, 235, 196];
const FOREGROUND_GLOW_GOLD: Rgb = [239, 188, 128];
const FOREGROUND_TREE_BLACK: Rgb = [46, 48, 46];
const FOREGROUND_TREE_WARM_BLACK: Rgb = [209, 179, 141];
const FOREGROUND_TREE_BACK: Rgb = [85, 89, 85];
const WARM_PARTICLE: Rgb = [255, 244, 220];
const COOL_PARTICLE: Rgb = [225, 246, 255];
const RIVER_LIGHT_MOTE_CELL_SIZE = 64;
const RIVER_LIGHT_MOTE_TONES: readonly [Rgb, Rgb, Rgb] = [
  [244, 252, 255],
  [255, 214, 211],
  [210, 247, 244],
];
const SECTION_COLOR_DURATION_MS = 1200;
const RISING_RIVER_FRAGMENT_COLOR_FADE_MS = 2000;
const RISING_RIVER_FRAGMENT_CELL_SIZE = 128;
const RISING_RIVER_FRAGMENT_SHAPE_COUNT = 5;
const RISING_RIVER_FRAGMENT_WHITE_INDEX = 3;
const RISING_RIVER_FRAGMENT_PALETTE: readonly Rgb[] = [
  [41, 40, 39],
  [182, 143, 114],
  [99, 71, 58],
  [249, 252, 255],
  [154, 153, 148],
  [81, 84, 81],
];
const RISING_RIVER_FRAGMENT_COLOR_POOL = [0, 0, 2, 2, 5, 5, 1, 3, 4] as const;
const RISING_RIVER_FRAGMENT_GLOW_COLORS: readonly [Rgb, Rgb] = [
  [255, 255, 255],
  [174, 155, 151],
];
const PARALLAX_EASE_MS = 300;
const DEVICE_TILT_DEAD_ZONE = 1.25;
const DEVICE_TILT_RANGE_X = 18;
const DEVICE_TILT_RANGE_Y = 22;
const TAU = Math.PI * 2;
const DEGREE = Math.PI / 180;

const DESKTOP_RIVER_GLOW_LOBES: ReadonlyArray<RiverGlowLobe> = [
  { phase: 0.02, halfWidth: 0.17, halfHeight: 0.04, opacity: 0.62, speed: 5, verticalOffset: -0.006 },
  { phase: 0.21, halfWidth: 0.13, halfHeight: 0.032, opacity: 0.46, speed: 6.2, verticalOffset: 0.004 },
  { phase: 0.43, halfWidth: 0.21, halfHeight: 0.05, opacity: 0.56, speed: 4.4, verticalOffset: 0 },
  { phase: 0.66, halfWidth: 0.15, halfHeight: 0.036, opacity: 0.52, speed: 5.7, verticalOffset: -0.009 },
  { phase: 0.84, halfWidth: 0.19, halfHeight: 0.044, opacity: 0.42, speed: 3.9, verticalOffset: 0.007 },
];
const COMPACT_RIVER_GLOW_LOBES: ReadonlyArray<RiverGlowLobe> = [
  { phase: 0.04, halfWidth: 0.25, halfHeight: 0.048, opacity: 0.56, speed: 3.6, verticalOffset: -0.006 },
  { phase: 0.29, halfWidth: 0.19, halfHeight: 0.04, opacity: 0.44, speed: 4.3, verticalOffset: 0.004 },
  { phase: 0.55, halfWidth: 0.28, halfHeight: 0.058, opacity: 0.5, speed: 3.2, verticalOffset: 0.007 },
  { phase: 0.79, halfWidth: 0.22, halfHeight: 0.045, opacity: 0.4, speed: 4, verticalOffset: -0.004 },
];
const RIVER_GLOW_FLOW_BOUNDARY_X = 0.76;

// Each normalized response is independent: 0 stays anchored and 1 receives
// the light camera's full translation, cursor-weighted scale, or plane tilt.
const LIGHT_DEPTH_PROFILES = {
  sun: { translation: 0.02, perspective: 0.02, tilt: 0.01 },
  farHaze: { translation: 0.05, perspective: 0.04, tilt: 0.03 },
  distantHill: { translation: 0.065, perspective: 0.055, tilt: 0.04 },
  riverGlow: { translation: 0.025, perspective: 0.02, tilt: 0 },
  farCloud: { translation: 0.2, perspective: 0.16, tilt: 0.14 },
  middleHaze: { translation: 0.32, perspective: 0.28, tilt: 0.24 },
  middleCloud: { translation: 0.45, perspective: 0.4, tilt: 0.36 },
  nearHaze: { translation: 0.6, perspective: 0.56, tilt: 0.5 },
  foregroundMist: { translation: 0.78, perspective: 0.7, tilt: 0.64 },
  foregroundTrees: { translation: 0.2, perspective: 0.15, tilt: 0.1 },
} as const satisfies Record<string, AtmosphericDepthProfile>;

const PARTICLE_DEPTH_RANGE = {
  translation: [0.36, 0.54],
  perspective: [0.32, 0.48],
} as const;

const DESKTOP_CLOUD_SPECS: CloudSpec[] = [
  { x: -0.04, y: 0.2, width: 0.3, aspect: 3, speed: 2.7, direction: 1, opacity: 0.11, layer: 'far', sprite: 'farA' },
  { x: 0.31, y: 0.32, width: 0.24, aspect: 2.8, speed: 3.8, direction: -1, opacity: 0.09, layer: 'far', sprite: 'farB' },
  { x: 0.67, y: 0.16, width: 0.28, aspect: 3.1, speed: 3.2, direction: 1, opacity: 0.12, layer: 'far', sprite: 'farA' },
  { x: 0.97, y: 0.48, width: 0.26, aspect: 2.9, speed: 4.1, direction: -1, opacity: 0.1, layer: 'far', sprite: 'farB' },
  { x: -0.1, y: 0.31, width: 0.43, aspect: 2.35, speed: 5.1, direction: 1, opacity: 0.16, layer: 'middle', sprite: 'middleA' },
  { x: 0.49, y: 0.38, width: 0.36, aspect: 2.2, speed: 6.6, direction: -1, opacity: 0.18, layer: 'middle', sprite: 'middleB' },
  { x: 0.94, y: 0.27, width: 0.4, aspect: 2.3, speed: 4.7, direction: -1, opacity: 0.16, layer: 'middle', sprite: 'middleA' },
  { x: -0.14, y: 0.88, width: 0.72, aspect: 2.55, speed: 3.4, direction: 1, opacity: 0.14, layer: 'foreground', sprite: 'foreground' },
  { x: 0.93, y: 0.84, width: 0.66, aspect: 2.5, speed: 2.9, direction: -1, opacity: 0.15, layer: 'foreground', sprite: 'foreground' },
];

const COMPACT_CLOUD_SPECS: CloudSpec[] = [
  { x: -0.08, y: 0.24, width: 0.55, aspect: 3, speed: 2.5, direction: 1, opacity: 0.1, layer: 'far', sprite: 'farA' },
  { x: 0.78, y: 0.42, width: 0.48, aspect: 2.8, speed: 3.3, direction: -1, opacity: 0.115, layer: 'far', sprite: 'farB' },
  { x: -0.12, y: 0.34, width: 0.78, aspect: 2.3, speed: 4.2, direction: 1, opacity: 0.155, layer: 'middle', sprite: 'middleA' },
  { x: 0.79, y: 0.41, width: 0.72, aspect: 2.2, speed: 5.2, direction: -1, opacity: 0.17, layer: 'middle', sprite: 'middleB' },
  { x: 0.84, y: 0.9, width: 1.24, aspect: 2.6, speed: 2.8, direction: -1, opacity: 0.14, layer: 'foreground', sprite: 'foreground' },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp((value - edgeStart) / Math.max(edgeEnd - edgeStart, 0.0001), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${clamp(alpha, 0, 1)})`;
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const mix = clamp(amount, 0, 1);
  return [
    from[0] + (to[0] - from[0]) * mix,
    from[1] + (to[1] - from[1]) * mix,
    from[2] + (to[2] - from[2]) * mix,
  ];
}

function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  if (shortHex) {
    return shortHex.slice(1).map((channel) => Number.parseInt(channel + channel, 16)) as Rgb;
  }

  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (longHex) {
    return longHex.slice(1).map((channel) => Number.parseInt(channel, 16)) as Rgb;
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(color);
  if (!rgb) return null;
  return [
    clamp(Number(rgb[1]), 0, 255),
    clamp(Number(rgb[2]), 0, 255),
    clamp(Number(rgb[3]), 0, 255),
  ];
}

function resolveActiveColor(value: string): Rgb {
  let resolved = value.trim();
  const variable = /^var\(\s*(--[\w-]+)(?:\s*,[^)]+)?\s*\)$/.exec(resolved);
  if (variable && typeof document !== 'undefined') {
    resolved = getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  }
  return parseColor(resolved) ?? [...DEFAULT_ACTIVE_COLOR];
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function featherSprite(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.filter = 'none';
  context.globalCompositeOperation = 'destination-in';
  const horizontal = context.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, 'rgba(255,255,255,0)');
  horizontal.addColorStop(0.1, 'rgba(255,255,255,1)');
  horizontal.addColorStop(0.9, 'rgba(255,255,255,1)');
  horizontal.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, width, height);

  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, 'rgba(255,255,255,0)');
  vertical.addColorStop(0.12, 'rgba(255,255,255,1)');
  vertical.addColorStop(0.86, 'rgba(255,255,255,1)');
  vertical.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function createCloudSprite(kind: CloudLayerKind, seed: number) {
  const width = kind === 'foreground' ? 720 : 600;
  const height = kind === 'foreground' ? 320 : 280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(seed);
  const isFar = kind === 'far';
  const isForeground = kind === 'foreground';
  const puffCount = isFar ? 13 : isForeground ? 22 : 18;
  context.globalCompositeOperation = 'source-over';
  context.filter = `blur(${isFar ? 13 : isForeground ? 22 : 17}px)`;

  for (let index = 0; index < (isFar ? 9 : 12); index += 1) {
    const progress = index / Math.max((isFar ? 9 : 12) - 1, 1);
    const x = width * (0.08 + progress * 0.84) + (random() - 0.5) * width * 0.1;
    const y = height * (isForeground ? 0.64 : 0.59) + (random() - 0.5) * height * 0.13;
    context.fillStyle = rgba(
      index % 3 === 0 ? [162, 169, 218] as Rgb : [128, 181, 220] as Rgb,
      isFar ? 0.42 : 0.5,
    );
    context.beginPath();
    context.ellipse(
      x,
      y,
      width * (0.075 + random() * 0.055),
      height * (isFar ? 0.07 : 0.12) * (0.75 + random() * 0.55),
      (random() - 0.5) * 0.12,
      0,
      TAU,
    );
    context.fill();
  }

  context.filter = `blur(${isFar ? 8 : isForeground ? 16 : 11}px)`;

  for (let index = 0; index < puffCount; index += 1) {
    const progress = index / Math.max(puffCount - 1, 1);
    const x = width * (0.1 + progress * 0.8) + (random() - 0.5) * width * 0.12;
    const arc = Math.sin(progress * Math.PI);
    const y = height * (isForeground ? 0.58 : 0.53)
      - arc * height * (isFar ? 0.06 : 0.15)
      + (random() - 0.5) * height * 0.16;
    const radiusX = width * (isFar ? 0.075 : isForeground ? 0.09 : 0.08)
      * (0.72 + random() * 0.75);
    const radiusY = height * (isFar ? 0.075 : isForeground ? 0.16 : 0.14)
      * (0.68 + random() * 0.72);
    const tint = index % 3 === 0 ? [205, 229, 247] as Rgb : [255, 255, 255] as Rgb;
    context.fillStyle = rgba(tint, isFar ? 0.76 : 0.9);
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, (random() - 0.5) * 0.18, 0, TAU);
    context.fill();
  }

  context.filter = `blur(${isFar ? 4 : 6}px)`;
  context.lineCap = 'round';
  context.lineWidth = isFar ? 8 : isForeground ? 17 : 12;
  for (let index = 0; index < (isFar ? 7 : 9); index += 1) {
    const baseY = height * (0.38 + random() * 0.33);
    context.strokeStyle = rgba(index % 2 === 0 ? SKY_CYAN : SKY_LAVENDER, isFar ? 0.24 : 0.2);
    context.beginPath();
    context.moveTo(width * (0.03 + random() * 0.08), baseY);
    context.bezierCurveTo(
      width * 0.28,
      baseY - height * (0.12 + random() * 0.12),
      width * 0.68,
      baseY + height * (random() - 0.5) * 0.16,
      width * (0.91 + random() * 0.06),
      baseY - height * (random() - 0.5) * 0.08,
    );
    context.stroke();
  }

  if (!isFar) {
    context.filter = 'blur(3px)';
    for (let index = 0; index < 8; index += 1) {
      const x = width * (0.16 + random() * 0.68);
      const y = height * (0.38 + random() * 0.26);
      context.fillStyle = `rgba(255,255,255,${0.18 + random() * 0.16})`;
      context.beginPath();
      context.ellipse(x, y, width * (0.025 + random() * 0.03), height * (0.035 + random() * 0.05), 0, 0, TAU);
      context.fill();
    }
  }

  featherSprite(context, width, height);
  return canvas;
}

function createHazeSprite(color: Rgb, seed: number) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(seed);
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 12; index += 1) {
    const x = size * (0.28 + random() * 0.44);
    const y = size * (0.28 + random() * 0.44);
    const radius = size * (0.22 + random() * 0.2);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rgba(color, 0.11 + random() * 0.05));
    gradient.addColorStop(0.5, rgba(color, 0.04));
    gradient.addColorStop(1, rgba(color, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  featherSprite(context, size, size);
  return canvas;
}

function createSunSprite() {
  const size = 640;
  const center = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.save();
  context.translate(center, center);
  context.filter = 'blur(16px)';
  context.lineCap = 'round';
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 + 0.18;
    context.rotate(angle);
    const ray = context.createLinearGradient(0, 0, center * 0.84, 0);
    ray.addColorStop(0, 'rgba(255,247,226,0.16)');
    ray.addColorStop(1, 'rgba(255,247,226,0)');
    context.strokeStyle = ray;
    context.lineWidth = index % 2 === 0 ? 9 : 5;
    context.beginPath();
    context.moveTo(center * 0.05, 0);
    context.lineTo(center * (index % 2 === 0 ? 0.82 : 0.58), 0);
    context.stroke();
    context.rotate(-angle);
  }
  context.restore();

  const outer = context.createRadialGradient(center, center, 0, center, center, center);
  outer.addColorStop(0, 'rgba(255,253,244,0.82)');
  outer.addColorStop(0.05, 'rgba(255,249,229,0.56)');
  outer.addColorStop(0.17, 'rgba(255,236,198,0.24)');
  outer.addColorStop(0.48, 'rgba(255,225,181,0.09)');
  outer.addColorStop(1, 'rgba(255,225,181,0)');
  context.fillStyle = outer;
  context.fillRect(0, 0, size, size);

  const core = context.createRadialGradient(center, center, 0, center, center, size * 0.05);
  core.addColorStop(0, 'rgba(255,255,252,0.98)');
  core.addColorStop(0.36, 'rgba(255,252,240,0.82)');
  core.addColorStop(1, 'rgba(255,241,211,0)');
  context.fillStyle = core;
  context.fillRect(0, 0, size, size);
  return canvas;
}

function createRiverLightMoteSprites(): RiverLightMoteSprites {
  const cellSize = RIVER_LIGHT_MOTE_CELL_SIZE;
  const atlas = document.createElement('canvas');
  atlas.width = cellSize * 3;
  atlas.height = cellSize * RIVER_LIGHT_MOTE_TONES.length;
  const context = atlas.getContext('2d');
  if (!context) return { atlas, cellSize };

  for (let toneIndex = 0; toneIndex < RIVER_LIGHT_MOTE_TONES.length; toneIndex += 1) {
    const tone = RIVER_LIGHT_MOTE_TONES[toneIndex];
    for (let shapeIndex = 0; shapeIndex < 3; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = toneIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      const bloomRadius = shapeIndex === 1 ? 25 : shapeIndex === 2 ? 21 : 23;

      context.save();
      context.beginPath();
      context.rect(cellX, cellY, cellSize, cellSize);
      context.clip();

      const bloom = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        bloomRadius,
      );
      bloom.addColorStop(0, rgba(tone, shapeIndex === 1 ? 0.42 : 0.36));
      bloom.addColorStop(0.18, rgba(tone, 0.28));
      bloom.addColorStop(0.52, rgba(tone, 0.09));
      bloom.addColorStop(1, rgba(tone, 0));
      context.fillStyle = bloom;
      context.fillRect(cellX, cellY, cellSize, cellSize);

      if (shapeIndex === 1) {
        context.strokeStyle = rgba(tone, 0.82);
        context.lineCap = 'round';
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(centerX, centerY - 10);
        context.lineTo(centerX, centerY + 10);
        context.moveTo(centerX - 7, centerY);
        context.lineTo(centerX + 7, centerY);
        context.stroke();
      }

      const coreRadius = shapeIndex === 1 ? 4.6 : shapeIndex === 2 ? 4.1 : 4.4;
      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius,
      );
      core.addColorStop(0, 'rgba(255,255,255,0.98)');
      core.addColorStop(0.32, rgba(tone, 0.94));
      core.addColorStop(1, rgba(tone, 0));
      context.fillStyle = core;
      if (shapeIndex === 2) {
        context.beginPath();
        context.ellipse(centerX + 0.8, centerY - 0.5, 5.4, 3.7, -0.18, 0, TAU);
        context.fill();
      } else {
        context.fillRect(
          centerX - coreRadius,
          centerY - coreRadius,
          coreRadius * 2,
          coreRadius * 2,
        );
      }
      context.restore();
    }
  }

  return { atlas, cellSize };
}

function createRiverParticleSprite(variant: 0 | 1 | 2) {
  const size = 64;
  const center = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const vertices = variant === 0
    ? [[0, -10], [9, 8], [-9, 8]]
    : variant === 1
      ? [[0, -13], [6, 10], [-6, 7]]
      : [[-3, -11], [11, 5], [-8, 9]];
  const traceTriangle = () => {
    context.beginPath();
    context.moveTo(center + vertices[0][0], center + vertices[0][1]);
    context.lineTo(center + vertices[1][0], center + vertices[1][1]);
    context.lineTo(center + vertices[2][0], center + vertices[2][1]);
    context.closePath();
  };

  context.save();
  context.filter = 'blur(5px)';
  context.fillStyle = 'rgba(255,255,255,0.34)';
  traceTriangle();
  context.fill();
  context.restore();

  context.fillStyle = 'rgba(255,255,255,0.92)';
  traceTriangle();
  context.fill();

  const highlight = context.createLinearGradient(
    center,
    center - 13,
    center,
    center + 10,
  );
  highlight.addColorStop(0, 'rgba(255,255,255,0.98)');
  highlight.addColorStop(1, 'rgba(255,255,255,0.54)');
  context.fillStyle = highlight;
  traceTriangle();
  context.fill();
  return canvas;
}

function createRiverParticleSprites(): RiverParticleSprites {
  return [
    createRiverParticleSprite(0),
    createRiverParticleSprite(1),
    createRiverParticleSprite(2),
  ];
}

function traceRisingRiverFragment(
  context: CanvasRenderingContext2D,
  shapeIndex: number,
  centerX: number,
  centerY: number,
) {
  context.beginPath();
  if (shapeIndex === 0) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(centerX + 41, centerY + 31);
    context.lineTo(centerX - 36, centerY + 23);
  } else if (shapeIndex === 1) {
    context.moveTo(centerX - 7, centerY - 46);
    context.lineTo(centerX + 25, centerY + 39);
    context.lineTo(centerX - 23, centerY + 31);
  } else if (shapeIndex === 2) {
    context.moveTo(centerX + 7, centerY - 43);
    context.lineTo(centerX + 39, centerY + 29);
    context.lineTo(centerX - 40, centerY + 24);
  } else if (shapeIndex === 3) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(centerX + 35, centerY - 3);
    context.lineTo(centerX + 12, centerY + 41);
    context.lineTo(centerX - 32, centerY + 18);
    context.lineTo(centerX - 24, centerY - 18);
  } else {
    context.moveTo(centerX - 12, centerY - 46);
    context.lineTo(centerX + 20, centerY - 20);
    context.lineTo(centerX + 10, centerY + 44);
    context.lineTo(centerX - 17, centerY + 31);
  }
  context.closePath();
}

function traceRisingRiverFragmentFacet(
  context: CanvasRenderingContext2D,
  shapeIndex: number,
  centerX: number,
  centerY: number,
  secondary: boolean,
) {
  context.beginPath();
  if (shapeIndex === 0) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(secondary ? centerX - 36 : centerX + 41, secondary ? centerY + 23 : centerY + 31);
    context.lineTo(centerX + 3, centerY + 6);
  } else if (shapeIndex === 1) {
    context.moveTo(centerX - 7, centerY - 46);
    context.lineTo(secondary ? centerX - 23 : centerX + 25, secondary ? centerY + 31 : centerY + 39);
    context.lineTo(centerX - 1, centerY + 8);
  } else if (shapeIndex === 2) {
    context.moveTo(centerX + 7, centerY - 43);
    context.lineTo(secondary ? centerX - 40 : centerX + 39, secondary ? centerY + 24 : centerY + 29);
    context.lineTo(centerX + 2, centerY + 7);
  } else if (shapeIndex === 3) {
    context.moveTo(secondary ? centerX - 24 : centerX, secondary ? centerY - 18 : centerY - 43);
    context.lineTo(secondary ? centerX - 32 : centerX + 35, secondary ? centerY + 18 : centerY - 3);
    context.lineTo(centerX + 1, centerY + 5);
  } else {
    context.moveTo(secondary ? centerX - 17 : centerX - 12, secondary ? centerY + 31 : centerY - 46);
    context.lineTo(secondary ? centerX + 10 : centerX + 20, secondary ? centerY + 44 : centerY - 20);
    context.lineTo(centerX + 1, centerY + 3);
  }
  context.closePath();
}

function createRisingRiverFragmentSprites(): RisingRiverFragmentSprites {
  const cellSize = RISING_RIVER_FRAGMENT_CELL_SIZE;
  const colorAtlas = document.createElement('canvas');
  colorAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  colorAtlas.height = cellSize * RISING_RIVER_FRAGMENT_PALETTE.length;
  const colorContext = colorAtlas.getContext('2d');

  const transitionGlowAtlas = document.createElement('canvas');
  transitionGlowAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  transitionGlowAtlas.height = cellSize * RISING_RIVER_FRAGMENT_GLOW_COLORS.length;
  const haloContext = transitionGlowAtlas.getContext('2d');

  if (!colorContext || !haloContext) return { colorAtlas, transitionGlowAtlas, cellSize };

  for (let colorIndex = 0; colorIndex < RISING_RIVER_FRAGMENT_PALETTE.length; colorIndex += 1) {
    const color = RISING_RIVER_FRAGMENT_PALETTE[colorIndex];
    const facetLight = mixRgb(color, [255, 255, 255], colorIndex === 3 ? 0.08 : 0.22);
    const facetShadow = mixRgb(color, [17, 19, 20], colorIndex === 3 ? 0.16 : 0.25);
    for (let shapeIndex = 0; shapeIndex < RISING_RIVER_FRAGMENT_SHAPE_COUNT; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = colorIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      colorContext.save();
      colorContext.beginPath();
      colorContext.rect(cellX, cellY, cellSize, cellSize);
      colorContext.clip();
      colorContext.globalCompositeOperation = 'source-over';
      colorContext.fillStyle = rgba(color, 1);
      traceRisingRiverFragment(colorContext, shapeIndex, centerX, centerY);
      colorContext.fill();
      colorContext.fillStyle = rgba(facetLight, 0.62);
      traceRisingRiverFragmentFacet(colorContext, shapeIndex, centerX, centerY, false);
      colorContext.fill();
      colorContext.fillStyle = rgba(facetShadow, 0.42);
      traceRisingRiverFragmentFacet(colorContext, shapeIndex, centerX, centerY, true);
      colorContext.fill();
      colorContext.restore();
    }
  }

  for (
    let glowIndex = 0;
    glowIndex < RISING_RIVER_FRAGMENT_GLOW_COLORS.length;
    glowIndex += 1
  ) {
    const glowColor = RISING_RIVER_FRAGMENT_GLOW_COLORS[glowIndex];
    const innerColor = glowIndex === 0
      ? [255, 255, 255] as Rgb
      : mixRgb(glowColor, [255, 255, 255], 0.3);
    for (let shapeIndex = 0; shapeIndex < RISING_RIVER_FRAGMENT_SHAPE_COUNT; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = glowIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      haloContext.save();
      haloContext.beginPath();
      haloContext.rect(cellX, cellY, cellSize, cellSize);
      haloContext.clip();
      haloContext.globalCompositeOperation = 'lighter';
      haloContext.filter = 'blur(10px)';
      haloContext.fillStyle = rgba(glowColor, glowIndex === 0 ? 0.58 : 0.5);
      traceRisingRiverFragment(haloContext, shapeIndex, centerX, centerY);
      haloContext.fill();
      haloContext.filter = 'blur(4px)';
      haloContext.fillStyle = rgba(innerColor, glowIndex === 0 ? 0.42 : 0.38);
      traceRisingRiverFragment(haloContext, shapeIndex, centerX, centerY);
      haloContext.fill();
      haloContext.restore();
    }
  }

  return { colorAtlas, transitionGlowAtlas, cellSize };
}

function createRisingRiverFogPatchSprite(variant: 0 | 1 | 2) {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(18431 + variant * 2707);
  const riverColor = mixRgb(RIVER_LIGHT_BLUE, SKY_CYAN, 0.58);
  const highlightColor = mixRgb(riverColor, [232, 248, 252], 0.34);
  const drawFogLobe = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: Rgb,
    opacity: number,
  ) => {
    context.save();
    context.translate(width * x, height * y);
    context.scale(width * radiusX, height * radiusY);
    const fog = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    fog.addColorStop(0, rgba(color, opacity));
    fog.addColorStop(0.42, rgba(color, opacity * 0.62));
    fog.addColorStop(0.78, rgba(color, opacity * 0.2));
    fog.addColorStop(1, rgba(color, 0));
    context.fillStyle = fog;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };

  context.globalCompositeOperation = 'lighter';
  drawFogLobe(0.5, 0.63, 0.48, 0.29, riverColor, 0.52);
  drawFogLobe(
    0.47 + (variant - 1) * 0.025,
    0.52,
    0.39,
    0.22,
    riverColor,
    0.36,
  );

  const lobeCount = 6 + variant;
  for (let index = 0; index < lobeCount; index += 1) {
    const lane = lobeCount === 1 ? 0.5 : index / (lobeCount - 1);
    drawFogLobe(
      0.1 + lane * 0.8 + (random() - 0.5) * 0.055,
      0.46 + (random() - 0.5) * 0.19,
      0.13 + random() * 0.1,
      0.16 + random() * 0.12,
      random() > 0.46 ? highlightColor : riverColor,
      0.32 + random() * 0.22,
    );
  }

  featherSprite(context, width, height);
  return canvas;
}

function createRisingRiverFogPatchSprites(): RisingRiverFogPatchSprites {
  return [
    createRisingRiverFogPatchSprite(0),
    createRisingRiverFogPatchSprite(1),
    createRisingRiverFogPatchSprite(2),
  ];
}

function createRisingRiverGlowSprite(variant: 0 | 1 | 2) {
  const width = 256;
  const height = 384;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const variantOffset = variant === 0 ? -0.035 : variant === 1 ? 0.045 : 0;
  const variantLean = variant === 0 ? -0.08 : variant === 1 ? 0.1 : 0.025;
  const drawGlowLobe = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: Rgb,
    opacity: number,
  ) => {
    context.save();
    context.translate(width * x, height * y);
    context.rotate(variantLean);
    context.scale(width * radiusX, height * radiusY);
    const glow = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, rgba(color, opacity));
    glow.addColorStop(0.46, rgba(color, opacity * 0.48));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };

  context.globalCompositeOperation = 'lighter';
  drawGlowLobe(0.5 + variantOffset, 0.62, 0.42, 0.32, RIVER_LIGHT_BLUE, 0.72);
  drawGlowLobe(0.45 - variantOffset * 0.5, 0.46, 0.31, 0.29, [191, 228, 239], 0.65);
  drawGlowLobe(0.55 + variantOffset * 0.8, 0.3, 0.24, 0.25, [207, 239, 248], 0.55);
  drawGlowLobe(0.48 - variantOffset, 0.17, 0.16, 0.18, [224, 246, 252], 0.42);

  context.save();
  context.filter = 'blur(8px)';
  context.strokeStyle = 'rgba(230,248,255,0.6)';
  context.lineCap = 'round';
  context.lineWidth = variant === 2 ? 16 : 13;
  context.beginPath();
  context.moveTo(width * (0.47 + variantOffset), height * 0.78);
  context.bezierCurveTo(
    width * (0.34 - variantOffset),
    height * 0.6,
    width * (0.65 + variantOffset),
    height * 0.38,
    width * (0.48 - variantOffset * 0.5),
    height * 0.12,
  );
  context.stroke();
  context.restore();

  drawGlowLobe(0.5 + variantOffset * 0.4, 0.58, 0.18, 0.21, [244, 252, 255], 0.95);
  drawGlowLobe(0.47 - variantOffset * 0.5, 0.38, 0.12, 0.17, [250, 254, 255], 0.85);
  featherSprite(context, width, height);
  return canvas;
}

function createRisingRiverGlowSprites(): RisingRiverGlowSprites {
  return [
    createRisingRiverGlowSprite(0),
    createRisingRiverGlowSprite(1),
    createRisingRiverGlowSprite(2),
  ];
}

function createDistantHillSprite(kind: keyof DistantHillSprites) {
  const width = 1200;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const profiles: Record<keyof DistantHillSprites, {
    masses: ReadonlyArray<{
      ridge: ReadonlyArray<readonly [number, number]>;
      opacity: number;
      lift: number;
      blurScale: number;
    }>;
    highlight: Rgb;
    shadow: Rgb;
    blur: number;
    fadeStart: number;
  }> = {
    far: {
      masses: [
        {
          ridge: [
            [0.5, 0.96], [0.58, 0.8], [0.67, 0.64], [0.76, 0.56],
            [0.84, 0.58], [0.93, 0.68], [1.02, 0.83], [1.1, 0.96],
          ],
          opacity: 0.26,
          lift: 0.52,
          blurScale: 1.35,
        },
        {
          ridge: [
            [0.13, 0.96], [0.22, 0.76], [0.31, 0.61], [0.4, 0.53],
            [0.49, 0.55], [0.59, 0.64], [0.69, 0.77], [0.79, 0.91],
            [0.87, 0.97],
          ],
          opacity: 0.54,
          lift: 0.28,
          blurScale: 1.18,
        },
        {
          ridge: [
            [-0.154, 0.97], [-0.084, 0.57], [-0.004, 0.27], [0.076, 0.15],
            [0.156, 0.17], [0.246, 0.25], [0.336, 0.41], [0.426, 0.6],
            [0.526, 0.78], [0.626, 0.95], [0.716, 1.04],
          ],
          opacity: 1,
          lift: 0,
          blurScale: 1,
        },
      ],
      highlight: [137, 138, 147],
      shadow: [96, 105, 118],
      blur: 12,
      fadeStart: 0.58,
    },
    middle: {
      masses: [
        {
          ridge: [
            [0.57, 0.97], [0.65, 0.76], [0.74, 0.6], [0.83, 0.56],
            [0.92, 0.64], [1.01, 0.79], [1.09, 0.96],
          ],
          opacity: 0.23,
          lift: 0.56,
          blurScale: 1.3,
        },
        {
          ridge: [
            [0.23, 0.97], [0.31, 0.71], [0.4, 0.52], [0.49, 0.45],
            [0.58, 0.49], [0.67, 0.62], [0.76, 0.8], [0.85, 0.96],
          ],
          opacity: 0.56,
          lift: 0.3,
          blurScale: 1.15,
        },
        {
          ridge: [
            [-0.1, 0.94], [-0.02, 0.59], [0.07, 0.36], [0.15, 0.28],
            [0.24, 0.32], [0.33, 0.44], [0.42, 0.62], [0.52, 0.8],
            [0.62, 0.96],
          ],
          opacity: 0.9,
          lift: 0.08,
          blurScale: 1,
        },
      ],
      highlight: [160, 160, 168],
      shadow: [100, 112, 125],
      blur: 8,
      fadeStart: 0.66,
    },
    near: {
      masses: [
        {
          ridge: [
            [0.62, 0.97], [0.7, 0.77], [0.78, 0.62], [0.86, 0.59],
            [0.94, 0.68], [1.02, 0.82], [1.09, 0.97],
          ],
          opacity: 0.2,
          lift: 0.58,
          blurScale: 1.28,
        },
        {
          ridge: [
            [0.24, 0.97], [0.32, 0.7], [0.41, 0.53], [0.5, 0.47],
            [0.59, 0.52], [0.68, 0.66], [0.77, 0.83], [0.86, 0.97],
          ],
          opacity: 0.5,
          lift: 0.32,
          blurScale: 1.12,
        },
        {
          ridge: [
            [-0.1, 0.96], [-0.02, 0.67], [0.06, 0.47], [0.14, 0.39],
            [0.22, 0.43], [0.31, 0.56], [0.4, 0.72], [0.5, 0.88],
            [0.59, 0.97],
          ],
          opacity: 0.84,
          lift: 0.1,
          blurScale: 1,
        },
      ],
      highlight: [145, 147, 155],
      shadow: [84, 98, 111],
      blur: 6,
      fadeStart: 0.74,
    },
  };
  const profile = profiles[kind];

  for (const mass of profile.masses) {
    context.save();
    context.globalAlpha = mass.opacity;
    context.filter = `blur(${profile.blur * mass.blurScale}px)`;
    context.beginPath();
    const first = mass.ridge[0];
    context.moveTo(first[0] * width, height + profile.blur * 2);
    context.lineTo(first[0] * width, first[1] * height);
    for (let index = 1; index < mass.ridge.length - 1; index += 1) {
      const point = mass.ridge[index];
      const next = mass.ridge[index + 1];
      context.quadraticCurveTo(
        point[0] * width,
        point[1] * height,
        (point[0] + next[0]) * width * 0.5,
        (point[1] + next[1]) * height * 0.5,
      );
    }
    const last = mass.ridge[mass.ridge.length - 1];
    context.lineTo(last[0] * width, last[1] * height);
    context.lineTo(last[0] * width, height + profile.blur * 2);
    context.closePath();
    const highlight = mixRgb(profile.highlight, [247, 247, 249], mass.lift);
    const shadow = mixRgb(profile.shadow, [225, 226, 231], mass.lift);
    const fill = context.createLinearGradient(0, height * 0.12, 0, height);
    fill.addColorStop(0, rgba(highlight, 0.72));
    fill.addColorStop(0.48, rgba(mixRgb(highlight, shadow, 0.58), 0.9));
    fill.addColorStop(1, rgba(shadow, 0.96));
    context.fillStyle = fill;
    context.fill();
    context.restore();
  }

  context.save();
  context.globalCompositeOperation = 'source-atop';
  context.filter = `blur(${profile.blur * 2}px)`;
  const random = createSeededRandom(kind === 'far' ? 8573 : kind === 'middle' ? 9257 : 10103);
  for (let index = 0; index < 5; index += 1) {
    const x = width * (0.12 + random() * 0.58);
    const y = height * (0.4 + random() * 0.36);
    const radius = width * (0.12 + random() * 0.1);
    const mist = context.createRadialGradient(x, y, 0, x, y, radius);
    mist.addColorStop(0, 'rgba(247,248,252,0.2)');
    mist.addColorStop(1, 'rgba(247,248,252,0)');
    context.fillStyle = mist;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = 'destination-in';
  const rightFade = context.createLinearGradient(0, 0, width, 0);
  rightFade.addColorStop(0, 'rgba(255,255,255,1)');
  rightFade.addColorStop(profile.fadeStart, 'rgba(255,255,255,0.98)');
  rightFade.addColorStop(0.86, 'rgba(255,255,255,0.28)');
  rightFade.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = rightFade;
  context.fillRect(0, 0, width, height);
  context.restore();
  return canvas;
}

type ForestFoliageZone = Readonly<{
  start: number;
  end: number;
  topStart: number;
  topEnd: number;
  baseY: number;
  count: number;
  minimumWidth: number;
  maximumWidth: number;
}>;

type ForestPineAnchor = Readonly<{
  x: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  variant: number;
  rotation?: number;
}>;

type ForestPaletteStop = Readonly<{
  offset: number;
  color: Rgb;
}>;

type ForestSkylinePoint = readonly [x: number, y: number];

function createForestLayerCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawOrganicFoliageShape(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  random: () => number,
  opacity: number,
) {
  const pointCount = 8 + Math.floor(random() * 4);
  const points = Array.from({ length: pointCount }, (_, index) => {
    const angle = index / pointCount * TAU;
    const radius = 0.7 + random() * 0.32;
    return {
      x: centerX + Math.cos(angle) * radiusX * radius,
      y: centerY + Math.sin(angle) * radiusY * radius,
    };
  });
  const first = points[0];
  const last = points[points.length - 1];
  context.beginPath();
  context.moveTo((first.x + last.x) * 0.5, (first.y + last.y) * 0.5);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) * 0.5,
      (point.y + next.y) * 0.5,
    );
  }
  context.closePath();
  context.fillStyle = `rgba(255,255,255,${opacity})`;
  context.fill();
}

function createFoliageBrush(seed: number) {
  const width = 112;
  const height = 82;
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);

  drawOrganicFoliageShape(context, width * 0.5, height * 0.54, 31, 22, random, 0.62);
  for (let index = 0; index < 52; index += 1) {
    const angle = random() * TAU;
    const distance = Math.pow(random(), 0.82);
    drawOrganicFoliageShape(
      context,
      width * 0.5 + Math.cos(angle) * width * 0.34 * distance,
      height * 0.53 + Math.sin(angle) * height * 0.31 * distance,
      5 + random() * 13,
      3 + random() * 8,
      random,
      0.2 + random() * 0.42,
    );
  }

  for (let index = 0; index < 38; index += 1) {
    const angle = random() * TAU;
    drawOrganicFoliageShape(
      context,
      width * 0.5 + Math.cos(angle) * width * (0.3 + random() * 0.13),
      height * 0.53 + Math.sin(angle) * height * (0.27 + random() * 0.11),
      2.5 + random() * 6,
      1.5 + random() * 4,
      random,
      0.12 + random() * 0.3,
    );
  }
  return canvas;
}

function drawCanopyBranchSystem(
  context: CanvasRenderingContext2D,
  x: number,
  canopyY: number,
  canopyWidth: number,
  canopyHeight: number,
  random: () => number,
) {
  const lean = (random() - 0.5) * canopyWidth * 0.24;
  const baseY = canopyY + canopyHeight * (0.48 + random() * 0.42);
  const baseX = x - lean * (0.18 + random() * 0.2);
  context.save();
  context.strokeStyle = `rgba(255,255,255,${0.32 + random() * 0.16})`;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = Math.max(1, canopyWidth * (0.017 + random() * 0.009));
  context.beginPath();
  context.moveTo(baseX, baseY);
  context.quadraticCurveTo(
    x + lean * 0.18,
    canopyY + canopyHeight * 0.52,
    x + lean,
    canopyY + canopyHeight * 0.06,
  );
  context.stroke();

  const forkCount = 4 + Math.floor(random() * 3);
  for (let fork = 0; fork < forkCount; fork += 1) {
    const progress = 0.18 + random() * 0.5;
    const startY = baseY + (canopyY - baseY) * progress;
    const startX = baseX + (lean + x - baseX) * progress;
    const side = fork % 2 === 0 ? -1 : 1;
    const endX = x + canopyWidth * (0.16 + random() * 0.34) * side;
    const endY = canopyY - canopyHeight * (0.02 + random() * 0.3);
    context.globalAlpha = 0.56 + random() * 0.2;
    context.lineWidth = Math.max(0.65, canopyWidth * (0.007 + random() * 0.007));
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + (endX - startX) * (0.38 + random() * 0.2),
      startY - canopyHeight * (0.06 + random() * 0.12),
      endX,
      endY,
    );
    context.stroke();

    const twigSide = random() < 0.5 ? -1 : 1;
    const twigStartX = startX + (endX - startX) * (0.56 + random() * 0.14);
    const twigStartY = startY + (endY - startY) * (0.56 + random() * 0.14);
    const twigEndX = twigStartX + canopyWidth * (0.07 + random() * 0.12) * twigSide;
    const twigEndY = twigStartY - canopyHeight * (0.08 + random() * 0.13);
    context.globalAlpha = 0.38 + random() * 0.18;
    context.lineWidth = Math.max(0.5, canopyWidth * (0.004 + random() * 0.004));
    context.beginPath();
    context.moveTo(twigStartX, twigStartY);
    context.quadraticCurveTo(
      twigStartX + (twigEndX - twigStartX) * 0.48,
      twigStartY - canopyHeight * 0.04,
      twigEndX,
      twigEndY,
    );
    context.stroke();
  }
  context.restore();
}

function createPineBrush(seed: number) {
  const width = 220;
  const height = 340;
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);
  const lean = (random() - 0.5) * width * 0.07;

  context.fillStyle = 'rgba(255,255,255,0.38)';
  context.beginPath();
  context.moveTo(width * 0.5 + lean, height * 0.025);
  context.lineTo(width * 0.525, height * 0.99);
  context.lineTo(width * 0.475, height * 0.99);
  context.closePath();
  context.fill();

  const branchCount = 48;
  for (let index = 0; index < branchCount; index += 1) {
    const progress = 0.035 + index / (branchCount - 1) * 0.92;
    const spineX = width * 0.5 + lean * (1 - progress);
    const y = height * progress;
    const halfWidth = width * (0.022 + Math.pow(progress, 0.8) * 0.43);
    const leftReach = halfWidth * (0.76 + random() * 0.24);
    const rightReach = halfWidth * (0.76 + random() * 0.24);
    const thickness = height * (0.013 + progress * 0.019) * (0.88 + random() * 0.28);
    const droop = height * (0.004 + progress * 0.014);
    context.fillStyle = `rgba(255,255,255,${0.62 + random() * 0.28})`;
    context.beginPath();
    context.moveTo(spineX, y - thickness * 0.8);
    context.quadraticCurveTo(
      spineX + rightReach * 0.42,
      y - thickness * 0.42,
      spineX + rightReach,
      y + droop,
    );
    context.quadraticCurveTo(
      spineX + rightReach * 0.54,
      y + thickness * 1.25 + droop,
      spineX,
      y + thickness * 0.88,
    );
    context.quadraticCurveTo(
      spineX - leftReach * 0.54,
      y + thickness * 1.2 + droop,
      spineX - leftReach,
      y + droop * 0.82,
    );
    context.quadraticCurveTo(
      spineX - leftReach * 0.42,
      y - thickness * 0.4,
      spineX,
      y - thickness * 0.8,
    );
    context.closePath();
    context.fill();

    if (index > 4 && index % 2 === 0) {
      const clusterY = y + thickness * (0.15 + random() * 0.3);
      drawOrganicFoliageShape(
        context,
        spineX + (random() - 0.5) * halfWidth * 0.55,
        clusterY,
        halfWidth * (0.24 + random() * 0.22),
        thickness * (0.7 + random() * 0.55),
        random,
        0.36 + random() * 0.28,
      );
    }
  }
  drawOrganicFoliageShape(
    context,
    width * 0.5 + lean,
    height * 0.035,
    width * 0.025,
    height * 0.03,
    random,
    0.82,
  );
  return canvas;
}

function sampleForestSkyline(
  skyline: ReadonlyArray<ForestSkylinePoint>,
  x: number,
) {
  for (let index = 0; index < skyline.length - 1; index += 1) {
    const start = skyline[index];
    const end = skyline[index + 1];
    if (x < start[0] || x > end[0]) continue;
    const mix = clamp((x - start[0]) / Math.max(0.0001, end[0] - start[0]), 0, 1);
    const easedMix = mix * mix * (3 - 2 * mix);
    return start[1] + (end[1] - start[1]) * easedMix;
  }
  return x <= skyline[0][0] ? skyline[0][1] : skyline[skyline.length - 1][1];
}

function createPineForestBand(
  seed: number,
  count: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
  baseY: number,
  minimumOpacity: number,
  maximumOpacity: number,
) {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, (_, index): ForestPineAnchor => {
    const horizontalStep = 1.1 / count;
    const x = -0.05
      + (index + 0.2 + random() * 0.6) * horizontalStep
      + (random() - 0.5) * horizontalStep * 0.52;
    const skylineY = sampleForestSkyline(skyline, x);
    const top = clamp(skylineY - 0.018 - random() * 0.092, 0.035, baseY - 0.16);
    const height = baseY + 0.08 + random() * 0.055 - top;
    return {
      x,
      top,
      width: height * (0.105 + random() * 0.052),
      height,
      opacity: minimumOpacity + random() * (maximumOpacity - minimumOpacity),
      variant: Math.floor(random() * 3),
      rotation: (random() - 0.5) * 0.035,
    };
  });
}

function drawForestCanopyUnderlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
  random: () => number,
) {
  const samples: Array<ForestSkylinePoint> = [];
  for (let segment = 0; segment < skyline.length - 1; segment += 1) {
    const start = skyline[segment];
    const end = skyline[segment + 1];
    const sampleCount = Math.max(3, Math.ceil((end[0] - start[0]) * 120));
    for (let index = 0; index < sampleCount; index += 1) {
      const mix = index / sampleCount;
      const easedMix = mix * mix * (3 - 2 * mix);
      const x = start[0] + (end[0] - start[0]) * mix;
      const baseY = start[1] + (end[1] - start[1]) * easedMix;
      const ripple = Math.sin(x * 79) * 0.007 + Math.sin(x * 191 + 1.7) * 0.004;
      samples.push([x, baseY + ripple + (random() - 0.5) * 0.012]);
    }
  }
  samples.push(skyline[skyline.length - 1]);

  context.save();
  const underlay = context.createLinearGradient(0, height * 0.18, 0, height);
  underlay.addColorStop(0, 'rgba(255,255,255,0.12)');
  underlay.addColorStop(0.55, 'rgba(255,255,255,0.2)');
  underlay.addColorStop(1, 'rgba(255,255,255,0.14)');
  context.fillStyle = underlay;
  context.beginPath();
  context.moveTo(samples[0][0] * width, samples[0][1] * height);
  for (let index = 1; index < samples.length; index += 1) {
    context.lineTo(samples[index][0] * width, samples[index][1] * height);
  }
  context.lineTo(width * 1.08, height * 1.04);
  context.lineTo(width * -0.08, height * 1.04);
  context.closePath();
  context.fill();
  context.restore();
}

function drawForestBrush(
  context: CanvasRenderingContext2D,
  brush: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  opacity: number,
) {
  context.save();
  context.globalAlpha = opacity;
  context.translate(x, y);
  context.rotate(rotation);
  context.drawImage(brush, -width * 0.5, -height * 0.5, width, height);
  context.restore();
}

function drawForestFoliageField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  zones: ReadonlyArray<ForestFoliageZone>,
  random: () => number,
) {
  for (const zone of zones) {
    const lowerFoliageCount = Math.round(zone.count * 1.16);
    for (let index = 0; index < lowerFoliageCount; index += 1) {
      const horizontalMix = random();
      const top = zone.topStart + (zone.topEnd - zone.topStart) * horizontalMix;
      const lowerBandTop = Math.max(top + 0.15, zone.baseY - 0.23);
      const verticalMix = Math.pow(random(), 0.72);
      const x = width * (zone.start + (zone.end - zone.start) * horizontalMix);
      const y = height * (lowerBandTop + (zone.baseY - lowerBandTop) * verticalMix);
      const stampWidth = width * (
        zone.minimumWidth
        + random() * (zone.maximumWidth - zone.minimumWidth)
      ) * (0.84 + verticalMix * 0.44);
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        x,
        y,
        stampWidth,
        stampWidth * (0.62 + random() * 0.28),
        (random() - 0.5) * 0.5,
        0.38 + verticalMix * 0.38 + random() * 0.18,
      );
    }
  }
}

function drawForestBushRows(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  random: () => number,
  baseY: number,
) {
  const rowCount = 8;
  for (let row = 0; row < rowCount; row += 1) {
    const progress = row / (rowCount - 1);
    const count = 64 + row * 7;
    const rowY = baseY - 0.075 + progress * 0.39;
    const rowOffset = row % 2 === 0 ? 0.18 : 0.68;
    for (let index = 0; index < count; index += 1) {
      const x = width * ((index + rowOffset + (random() - 0.5) * 0.56) / count);
      const y = height * (
        rowY
        + Math.sin((index / count) * TAU * (2.2 + row * 0.17) + row) * 0.012
        + (random() - 0.5) * 0.024
      );
      const stampWidth = width * (0.018 + progress * 0.013 + random() * 0.015);
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        x,
        y,
        stampWidth,
        stampWidth * (0.68 + random() * 0.34),
        (random() - 0.5) * 0.42,
        0.48 + progress * 0.16 + random() * 0.25,
      );
    }
  }
}

function drawForestPines(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  anchors: ReadonlyArray<ForestPineAnchor>,
) {
  for (const anchor of anchors) {
    const pineWidth = width * anchor.width;
    const pineHeight = height * anchor.height;
    const brush = brushes[anchor.variant % brushes.length];
    context.save();
    context.globalAlpha = anchor.opacity;
    context.translate(width * anchor.x, height * anchor.top);
    context.rotate(anchor.rotation ?? 0);
    context.drawImage(brush, -pineWidth * 0.5, 0, pineWidth, pineHeight);
    context.restore();
  }
}

function drawPineUndergrowth(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  pines: ReadonlyArray<ForestPineAnchor>,
  random: () => number,
) {
  for (const pine of pines) {
    if (random() > 0.62) continue;
    const pineX = width * pine.x;
    const pineTop = height * pine.top;
    const pineWidth = width * pine.width;
    const pineHeight = height * pine.height;
    const clusterX = pineX + (random() - 0.5) * pineWidth * 0.86;
    const clusterY = pineTop + pineHeight * (0.78 + random() * 0.13);
    const clusterWidth = Math.max(width * 0.016, pineWidth * (0.94 + random() * 0.82));
    const clusterHeight = Math.max(
      height * 0.024,
      pineHeight * (0.064 + random() * 0.042),
    );

    drawCanopyBranchSystem(
      context,
      clusterX,
      clusterY,
      clusterWidth,
      clusterHeight,
      random,
    );
    drawForestBrush(
      context,
      brushes[Math.floor(random() * brushes.length)],
      clusterX,
      clusterY,
      clusterWidth,
      clusterHeight,
      (random() - 0.5) * 0.34,
      0.34 + random() * 0.2,
    );

    const lobeCount = 3 + Math.floor(random() * 3);
    for (let lobe = 0; lobe < lobeCount; lobe += 1) {
      const side = lobe % 2 === 0 ? -1 : 1;
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        clusterX + clusterWidth * side * (0.2 + random() * 0.22),
        clusterY + clusterHeight * (0.04 + random() * 0.18),
        clusterWidth * (0.34 + random() * 0.28),
        clusterHeight * (0.38 + random() * 0.3),
        (random() - 0.5) * 0.42,
        0.26 + random() * 0.2,
      );
    }
  }
}

function colorForestMask(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: ReadonlyArray<ForestPaletteStop>,
) {
  context.save();
  context.globalCompositeOperation = 'source-in';
  const gradient = context.createLinearGradient(0, 0, width, 0);
  for (const stop of stops) gradient.addColorStop(stop.offset, rgba(stop.color, 1));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function createForestLayer(
  width: number,
  height: number,
  seed: number,
  foliageBrushes: ReadonlyArray<HTMLCanvasElement>,
  pineBrushes: ReadonlyArray<HTMLCanvasElement>,
  zones: ReadonlyArray<ForestFoliageZone>,
  pines: ReadonlyArray<ForestPineAnchor>,
  palette: ReadonlyArray<ForestPaletteStop>,
  baseY: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
) {
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);

  drawForestCanopyUnderlay(context, width, height, skyline, random);
  drawForestPines(context, width, height, pineBrushes, pines);
  drawPineUndergrowth(context, width, height, foliageBrushes, pines, random);
  drawForestFoliageField(context, width, height, foliageBrushes, zones, random);
  drawForestBushRows(context, width, height, foliageBrushes, random, baseY);

  colorForestMask(context, width, height, palette);
  return canvas;
}

function carveForestMist(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  strength: number,
) {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.translate(width * x, height * y);
  context.scale(1, height * radiusY / (width * radiusX));
  const radius = width * radiusX;
  const mist = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  mist.addColorStop(0, `rgba(0,0,0,${strength})`);
  mist.addColorStop(0.42, `rgba(0,0,0,${strength * 0.72})`);
  mist.addColorStop(0.78, `rgba(0,0,0,${strength * 0.2})`);
  mist.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = mist;
  context.fillRect(-radius, -radius, radius * 2, radius * 2);
  context.restore();
}

function createForegroundTreesSprite() {
  const width = 1800;
  const height = 680;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const foliageBrushes = [1109, 2027, 4093, 6029].map(createFoliageBrush);
  const pineBrushes = [3011, 5021, 7013].map(createPineBrush);
  const mistPalette: ReadonlyArray<ForestPaletteStop> = [
    { offset: 0, color: [116, 122, 118] },
    { offset: 0.58, color: [142, 137, 128] },
    { offset: 1, color: [207, 179, 142] },
  ];
  const backPalette: ReadonlyArray<ForestPaletteStop> = [
    { offset: 0, color: FOREGROUND_TREE_BACK },
    { offset: 0.58, color: [100, 99, 94] },
    { offset: 1, color: [184, 154, 119] },
  ];
  const middlePalette: ReadonlyArray<ForestPaletteStop> = [
    { offset: 0, color: [55, 59, 56] },
    { offset: 0.56, color: [81, 76, 71] },
    { offset: 1, color: [166, 132, 98] },
  ];
  const frontPalette: ReadonlyArray<ForestPaletteStop> = [
    { offset: 0, color: FOREGROUND_TREE_BLACK },
    { offset: 0.28, color: [54, 55, 51] },
    { offset: 0.52, color: [85, 77, 73] },
    { offset: 0.7, color: [128, 108, 95] },
    { offset: 0.86, color: [179, 154, 125] },
    { offset: 1, color: FOREGROUND_TREE_WARM_BLACK },
  ];
  const frontSkyline: ReadonlyArray<ForestSkylinePoint> = [
    [-0.03, 0.21], [0.05, 0.18], [0.12, 0.21], [0.2, 0.29],
    [0.25, 0.37], [0.29, 0.5], [0.32, 0.54], [0.37, 0.5],
    [0.4, 0.45], [0.49, 0.43], [0.57, 0.42], [0.65, 0.37],
    [0.73, 0.33], [0.8, 0.31], [0.88, 0.36], [0.96, 0.31],
    [1.03, 0.35],
  ];
  const middleSkyline: ReadonlyArray<ForestSkylinePoint> = [
    [-0.04, 0.19], [0.04, 0.15], [0.13, 0.2], [0.21, 0.27],
    [0.28, 0.42], [0.35, 0.47], [0.41, 0.29], [0.48, 0.37],
    [0.56, 0.34], [0.64, 0.3], [0.72, 0.25], [0.79, 0.28],
    [0.87, 0.3], [0.94, 0.26], [1.04, 0.32],
  ];
  const backSkyline: ReadonlyArray<ForestSkylinePoint> = [
    [-0.04, 0.14], [0.07, 0.18], [0.15, 0.22], [0.23, 0.3],
    [0.3, 0.39], [0.38, 0.35], [0.45, 0.23], [0.52, 0.31],
    [0.61, 0.26], [0.69, 0.22], [0.77, 0.2], [0.85, 0.27],
    [0.93, 0.21], [1.04, 0.28],
  ];
  const mistSkyline: ReadonlyArray<ForestSkylinePoint> = [
    [-0.05, 0.11], [0.05, 0.13], [0.13, 0.17], [0.2, 0.24],
    [0.29, 0.34], [0.36, 0.3], [0.43, 0.19], [0.5, 0.27],
    [0.58, 0.22], [0.67, 0.18], [0.75, 0.16], [0.83, 0.22],
    [0.91, 0.17], [1.05, 0.24],
  ];

  const mistLayer = createForestLayer(
    width,
    height,
    10037,
    foliageBrushes,
    pineBrushes,
    [
      { start: -0.06, end: 0.23, topStart: 0.13, topEnd: 0.28, baseY: 0.73, count: 58, minimumWidth: 0.008, maximumWidth: 0.022 },
      { start: 0.2, end: 0.47, topStart: 0.28, topEnd: 0.24, baseY: 0.73, count: 48, minimumWidth: 0.008, maximumWidth: 0.021 },
      { start: 0.43, end: 0.72, topStart: 0.24, topEnd: 0.2, baseY: 0.73, count: 52, minimumWidth: 0.008, maximumWidth: 0.021 },
      { start: 0.68, end: 1.06, topStart: 0.2, topEnd: 0.27, baseY: 0.73, count: 66, minimumWidth: 0.008, maximumWidth: 0.022 },
    ],
    [
      ...createPineForestBand(11213, 18, mistSkyline, 0.73, 0.3, 0.5),
      { x: 0.12, top: 0.22, width: 0.035, height: 0.32, opacity: 0.52, variant: 1 },
      { x: 0.36, top: 0.25, width: 0.032, height: 0.3, opacity: 0.48, variant: 2 },
      { x: 0.69, top: 0.17, width: 0.04, height: 0.36, opacity: 0.54, variant: 0 },
      { x: 0.91, top: 0.2, width: 0.037, height: 0.33, opacity: 0.48, variant: 2 },
    ],
    mistPalette,
    0.73,
    mistSkyline,
  );
  const mistLayerContext = mistLayer.getContext('2d');
  if (mistLayerContext) {
    carveForestMist(mistLayerContext, width, height, 0.2, 0.48, 0.07, 0.11, 0.16);
    carveForestMist(mistLayerContext, width, height, 0.48, 0.44, 0.08, 0.12, 0.18);
    carveForestMist(mistLayerContext, width, height, 0.79, 0.4, 0.09, 0.13, 0.16);
  }

  const backLayer = createForestLayer(
    width,
    height,
    12289,
    foliageBrushes,
    pineBrushes,
    [
      { start: -0.05, end: 0.11, topStart: 0.18, topEnd: 0.2, baseY: 0.7, count: 80, minimumWidth: 0.012, maximumWidth: 0.035 },
      { start: 0.07, end: 0.29, topStart: 0.2, topEnd: 0.42, baseY: 0.7, count: 92, minimumWidth: 0.011, maximumWidth: 0.032 },
      { start: 0.39, end: 0.55, topStart: 0.27, topEnd: 0.4, baseY: 0.7, count: 58, minimumWidth: 0.01, maximumWidth: 0.029 },
      { start: 0.51, end: 0.75, topStart: 0.39, topEnd: 0.29, baseY: 0.7, count: 70, minimumWidth: 0.01, maximumWidth: 0.028 },
      { start: 0.7, end: 1.05, topStart: 0.28, topEnd: 0.34, baseY: 0.7, count: 104, minimumWidth: 0.01, maximumWidth: 0.03 },
    ],
    [
      ...createPineForestBand(13159, 26, backSkyline, 0.72, 0.44, 0.7),
      { x: 0.035, top: 0.18, width: 0.07, height: 0.49, opacity: 0.72, variant: 0 },
      { x: 0.17, top: 0.27, width: 0.048, height: 0.39, opacity: 0.7, variant: 1 },
      { x: 0.25, top: 0.3, width: 0.04, height: 0.35, opacity: 0.65, variant: 2 },
      { x: 0.425, top: 0.15, width: 0.066, height: 0.54, opacity: 0.82, variant: 1 },
      { x: 0.404, top: 0.29, width: 0.039, height: 0.37, opacity: 0.68, variant: 2 },
      { x: 0.46, top: 0.31, width: 0.036, height: 0.34, opacity: 0.64, variant: 0 },
      { x: 0.57, top: 0.35, width: 0.038, height: 0.31, opacity: 0.58, variant: 0 },
      { x: 0.67, top: 0.29, width: 0.045, height: 0.37, opacity: 0.6, variant: 2 },
      { x: 0.78, top: 0.24, width: 0.056, height: 0.43, opacity: 0.64, variant: 1 },
      { x: 0.88, top: 0.28, width: 0.047, height: 0.38, opacity: 0.58, variant: 0 },
      { x: 0.97, top: 0.26, width: 0.05, height: 0.4, opacity: 0.54, variant: 2 },
    ],
    backPalette,
    0.72,
    backSkyline,
  );
  const backLayerContext = backLayer.getContext('2d');
  if (backLayerContext) {
    carveForestMist(backLayerContext, width, height, 0.16, 0.5, 0.065, 0.1, 0.14);
    carveForestMist(backLayerContext, width, height, 0.34, 0.48, 0.082, 0.13, 0.24);
    carveForestMist(backLayerContext, width, height, 0.54, 0.47, 0.07, 0.11, 0.14);
    carveForestMist(backLayerContext, width, height, 0.7, 0.39, 0.09, 0.12, 0.16);
    carveForestMist(backLayerContext, width, height, 0.87, 0.45, 0.075, 0.11, 0.13);
  }

  const middleLayer = createForestLayer(
    width,
    height,
    14731,
    foliageBrushes,
    pineBrushes,
    [
      { start: -0.06, end: 0.12, topStart: 0.14, topEnd: 0.18, baseY: 0.7, count: 104, minimumWidth: 0.011, maximumWidth: 0.032 },
      { start: 0.08, end: 0.29, topStart: 0.18, topEnd: 0.4, baseY: 0.7, count: 112, minimumWidth: 0.01, maximumWidth: 0.03 },
      { start: 0.39, end: 0.5, topStart: 0.24, topEnd: 0.42, baseY: 0.7, count: 52, minimumWidth: 0.009, maximumWidth: 0.027 },
      { start: 0.47, end: 0.7, topStart: 0.42, topEnd: 0.31, baseY: 0.7, count: 86, minimumWidth: 0.009, maximumWidth: 0.027 },
      { start: 0.68, end: 1.05, topStart: 0.26, topEnd: 0.32, baseY: 0.7, count: 122, minimumWidth: 0.009, maximumWidth: 0.029 },
    ],
    [
      ...createPineForestBand(15233, 32, middleSkyline, 0.72, 0.54, 0.8),
      { x: 0.08, top: 0.18, width: 0.064, height: 0.48, opacity: 0.84, variant: 2, rotation: -0.015 },
      { x: 0.19, top: 0.26, width: 0.044, height: 0.4, opacity: 0.78, variant: 0 },
      { x: 0.265, top: 0.3, width: 0.038, height: 0.36, opacity: 0.72, variant: 1 },
      { x: 0.432, top: 0.11, width: 0.064, height: 0.57, opacity: 0.94, variant: 0, rotation: 0.012 },
      { x: 0.405, top: 0.27, width: 0.042, height: 0.4, opacity: 0.8, variant: 2 },
      { x: 0.462, top: 0.3, width: 0.038, height: 0.36, opacity: 0.76, variant: 1 },
      { x: 0.615, top: 0.31, width: 0.04, height: 0.34, opacity: 0.68, variant: 2 },
      { x: 0.755, top: 0.23, width: 0.054, height: 0.43, opacity: 0.76, variant: 1 },
      { x: 0.855, top: 0.28, width: 0.046, height: 0.37, opacity: 0.66, variant: 2 },
      { x: 0.945, top: 0.25, width: 0.052, height: 0.41, opacity: 0.6, variant: 0 },
    ],
    middlePalette,
    0.72,
    middleSkyline,
  );
  const middleLayerContext = middleLayer.getContext('2d');
  if (middleLayerContext) {
    carveForestMist(middleLayerContext, width, height, 0.17, 0.51, 0.06, 0.09, 0.1);
    carveForestMist(middleLayerContext, width, height, 0.34, 0.5, 0.072, 0.12, 0.18);
    carveForestMist(middleLayerContext, width, height, 0.56, 0.43, 0.055, 0.085, 0.1);
    carveForestMist(middleLayerContext, width, height, 0.79, 0.45, 0.07, 0.1, 0.11);
  }

  const frontLayer = createForestLayer(
    width,
    height,
    16411,
    foliageBrushes,
    pineBrushes,
    [
      { start: -0.07, end: 0.13, topStart: 0.11, topEnd: 0.17, baseY: 0.69, count: 124, minimumWidth: 0.01, maximumWidth: 0.03 },
      { start: 0.08, end: 0.29, topStart: 0.17, topEnd: 0.39, baseY: 0.69, count: 126, minimumWidth: 0.009, maximumWidth: 0.028 },
      { start: 0.395, end: 0.5, topStart: 0.26, topEnd: 0.43, baseY: 0.69, count: 52, minimumWidth: 0.009, maximumWidth: 0.026 },
      { start: 0.47, end: 0.7, topStart: 0.43, topEnd: 0.3, baseY: 0.69, count: 92, minimumWidth: 0.008, maximumWidth: 0.026 },
      { start: 0.68, end: 1.07, topStart: 0.25, topEnd: 0.32, baseY: 0.69, count: 138, minimumWidth: 0.008, maximumWidth: 0.028 },
    ],
    [
      ...createPineForestBand(17029, 28, frontSkyline, 0.71, 0.62, 0.88),
      { x: 0.045, top: 0.14, width: 0.07, height: 0.52, opacity: 0.9, variant: 1, rotation: -0.02 },
      { x: 0.18, top: 0.26, width: 0.043, height: 0.39, opacity: 0.86, variant: 2 },
      { x: 0.255, top: 0.29, width: 0.037, height: 0.36, opacity: 0.8, variant: 0 },
      { x: 0.43, top: 0.1, width: 0.062, height: 0.58, opacity: 0.98, variant: 1, rotation: 0.01 },
      { x: 0.405, top: 0.25, width: 0.044, height: 0.42, opacity: 0.88, variant: 0 },
      { x: 0.463, top: 0.29, width: 0.039, height: 0.37, opacity: 0.84, variant: 2 },
      { x: 0.58, top: 0.35, width: 0.038, height: 0.3, opacity: 0.76, variant: 0 },
      { x: 0.66, top: 0.3, width: 0.044, height: 0.36, opacity: 0.78, variant: 2 },
      { x: 0.77, top: 0.24, width: 0.055, height: 0.43, opacity: 0.82, variant: 0 },
      { x: 0.86, top: 0.28, width: 0.047, height: 0.37, opacity: 0.72, variant: 1 },
      { x: 0.96, top: 0.25, width: 0.052, height: 0.41, opacity: 0.66, variant: 2 },
    ],
    frontPalette,
    0.71,
    frontSkyline,
  );
  const frontLayerContext = frontLayer.getContext('2d');
  if (frontLayerContext) {
    carveForestMist(frontLayerContext, width, height, 0.16, 0.56, 0.055, 0.085, 0.08);
    carveForestMist(frontLayerContext, width, height, 0.36, 0.55, 0.06, 0.09, 0.1);
    carveForestMist(frontLayerContext, width, height, 0.59, 0.51, 0.06, 0.09, 0.09);
    carveForestMist(frontLayerContext, width, height, 0.82, 0.52, 0.065, 0.095, 0.08);
  }

  context.save();
  context.filter = 'blur(6px)';
  context.globalAlpha = 0.26;
  context.drawImage(mistLayer, 0, 0);
  context.restore();

  context.save();
  context.filter = 'blur(4px)';
  context.globalAlpha = 0.4;
  context.drawImage(backLayer, 0, 0);
  context.restore();

  context.save();
  context.filter = 'blur(1.7px)';
  context.globalAlpha = 0.56;
  context.drawImage(middleLayer, 0, 0);
  context.restore();

  context.save();
  context.filter = 'blur(0.5px)';
  context.globalAlpha = 0.8;
  context.drawImage(frontLayer, 0, 0);
  context.restore();

  context.save();
  context.globalCompositeOperation = 'source-atop';
  const sunWash = context.createRadialGradient(
    width * 1.03,
    height * 0.28,
    0,
    width * 1.03,
    height * 0.28,
    width * 0.62,
  );
  sunWash.addColorStop(0, rgba([239, 188, 128], 0.34));
  sunWash.addColorStop(0.48, rgba([213, 157, 109], 0.14));
  sunWash.addColorStop(1, rgba([213, 157, 109], 0));
  context.fillStyle = sunWash;
  context.fillRect(0, 0, width, height);
  context.restore();

  context.save();
  context.globalCompositeOperation = 'destination-in';
  const sunlightFade = context.createLinearGradient(0, 0, width, 0);
  sunlightFade.addColorStop(0, 'rgba(255,255,255,1)');
  sunlightFade.addColorStop(0.54, 'rgba(255,255,255,0.98)');
  sunlightFade.addColorStop(0.72, 'rgba(255,255,255,0.92)');
  sunlightFade.addColorStop(0.86, 'rgba(255,255,255,0.82)');
  sunlightFade.addColorStop(1, 'rgba(255,255,255,0.72)');
  context.fillStyle = sunlightFade;
  context.fillRect(0, 0, width, height);
  context.restore();

  return canvas;
}

// All radial interpolation happens once during prewarming, never in a frame.
function createRadialWashSprite(
  color: Rgb,
  stops: readonly (readonly [number, number])[],
  width = 256,
  height = 256,
  innerRadius = 0,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.translate(width * 0.5, height * 0.5);
  context.scale(width * 0.5, height * 0.5);
  const gradient = context.createRadialGradient(0, 0, innerRadius, 0, 0, 1);
  for (const [position, alpha] of stops) gradient.addColorStop(position, rgba(color, alpha));
  context.fillStyle = gradient;
  context.fillRect(-1, -1, 2, 2);
  return canvas;
}

function createAtmosphericWashSprites(): AtmosphericWashSprites {
  const white: Rgb = [255, 255, 255];
  const sky = document.createElement('canvas');
  sky.width = 1;
  sky.height = 512;
  const context = sky.getContext('2d', { alpha: false })!;
  const gradient = context.createLinearGradient(0, 0, 0, sky.height);
  gradient.addColorStop(0, '#d8ecfc');
  gradient.addColorStop(0.44, '#eaf5fd');
  gradient.addColorStop(0.76, '#f5f9fb');
  gradient.addColorStop(1, '#fff5e8');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, sky.height);
  const riverColor = mixRgb(RIVER_LIGHT_BLUE, SKY_CYAN, 0.58);
  const sunStops = [[0, 0.038], [0.58, 0.012], [1, 0]] as const;
  return {
    sky,
    riverBed: createRadialWashSprite(riverColor, [[0, 0.13], [0.48, 0.065], [0.82, 0.018], [1, 0]], 512, 256),
    riverLobe: createRadialWashSprite(riverColor, [[0, 0.36], [0.42, 0.18], [0.76, 0.05], [1, 0]], 512, 256),
    sunAccent: createRadialWashSprite(white, sunStops, 256, 256, 0.018 / (0.43 * 1.12)),
    compactSunAccent: createRadialWashSprite(white, sunStops, 256, 256, 0.018 / (0.36 * 1.12)),
    cyan: createRadialWashSprite(SKY_CYAN, [[0, 0.045], [1, 0]]),
    lavender: createRadialWashSprite(SKY_LAVENDER, [[0, 0.055], [1, 0]]),
    right: createRadialWashSprite(white, [[0, 0.11], [0.5, 0.045], [1, 0]]),
    lowerRight: createRadialWashSprite(white, [[0, 0.052], [1, 0]]),
    accent: createRadialWashSprite(white, [[0, 0.085], [0.48, 0.035], [1, 0]]),
    edge: createRadialWashSprite(white, [[0, 0.06], [0.62, 0.02], [1, 0]]),
    tint: createRadialWashSprite(white, [[0, 0.14], [0.48, 0.07], [0.78, 0.015], [1, 0]]),
  };
}

function paintAtmosphericParticleCell(context: CanvasRenderingContext2D, index: number, color: Rgb) {
  const x = index * 64 + 32;
  context.clearRect(index * 64, 0, 64, 64);
  context.fillStyle = rgba(color, 0.12);
  context.beginPath();
  context.arc(x, 32, 20, 0, TAU);
  context.fill();
  context.fillStyle = rgba(color, 0.38);
  context.beginPath();
  context.ellipse(x, 32, 5.2, 8, 0, 0, TAU);
  context.fill();
}

function createAtmosphericParticleSprites(): AtmosphericParticleSprites {
  const atlas = document.createElement('canvas');
  atlas.width = 192;
  atlas.height = 64;
  const context = atlas.getContext('2d')!;
  const tint = mixRgb(COOL_PARTICLE, DEFAULT_ACTIVE_COLOR, 0.18);
  paintAtmosphericParticleCell(context, 0, WARM_PARTICLE);
  paintAtmosphericParticleCell(context, 1, COOL_PARTICLE);
  paintAtmosphericParticleCell(context, 2, tint);
  return { atlas, context, tint };
}

function createCachedPlane(width: number, height: number, opaque = false): CachedPlane {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, context: canvas.getContext('2d', { alpha: !opaque })! };
}

function createFramePlanes(width: number, height: number): FramePlanes {
  // Start at half resolution; also bound all three planes together so the
  // retained sprites + viewport caches stay below the ~32 MiB light budget.
  const scale = Math.min(0.5, 1024 / width, 640 / height, Math.sqrt(220_000 / (width * height)));
  const bufferWidth = Math.max(1, Math.ceil(width * scale));
  const bufferHeight = Math.max(1, Math.ceil(height * scale));
  return {
    sky: createCachedPlane(bufferWidth, bufferHeight, true),
    edge: createCachedPlane(bufferWidth, bufferHeight),
    tint: createCachedPlane(bufferWidth, bufferHeight),
    tintScratch: createCachedPlane(256, 256),
    color: [0, 0, 0], rightColor: [0, 0, 0], foregroundColor: [0, 0, 0],
    cameraX: 0, cameraY: 0, valid: false,
  };
}

function disposeFramePlanes(planes: FramePlanes | null) {
  if (!planes) return;
  // Release viewport-dependent raster resources immediately on unmount/resize.
  planes.sky.canvas.width = planes.sky.canvas.height = 0;
  planes.edge.canvas.width = planes.edge.canvas.height = 0;
  planes.tint.canvas.width = planes.tint.canvas.height = 0;
  planes.tintScratch.canvas.width = planes.tintScratch.canvas.height = 0;
}

function tintWash(mask: HTMLCanvasElement, color: Rgb, scratch: CachedPlane) {
  const { context, canvas } = scratch;
  context.globalCompositeOperation = 'copy';
  context.fillStyle = rgba(color, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(mask, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawRadialWash(context: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number, radius: number) {
  context.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
}

function createAtmosphericSprites(): AtmosphericSprites {
  return {
    washes: createAtmosphericWashSprites(),
    particles: createAtmosphericParticleSprites(),
    clouds: {
      farA: createCloudSprite('far', 1051),
      farB: createCloudSprite('far', 2083),
      middleA: createCloudSprite('middle', 3187),
      middleB: createCloudSprite('middle', 4211),
      foreground: createCloudSprite('foreground', 5279),
    },
    cyanHaze: createHazeSprite(SKY_CYAN, 6311),
    foregroundCyanHaze: createHazeSprite(FOREGROUND_FOG_CYAN, 6311),
    lavenderHaze: createHazeSprite(SKY_LAVENDER, 7411),
    distantHills: {
      far: createDistantHillSprite('far'),
      middle: createDistantHillSprite('middle'),
      near: createDistantHillSprite('near'),
    },
    foregroundTrees: createForegroundTreesSprite(),
    riverLightMotes: createRiverLightMoteSprites(),
    riverParticles: createRiverParticleSprites(),
    risingRiverFragments: createRisingRiverFragmentSprites(),
    risingRiverFogPatches: createRisingRiverFogPatchSprites(),
    risingRiverGlows: createRisingRiverGlowSprites(),
    sun: createSunSprite(),
  };
}

let atmosphericSpriteCache: AtmosphericSprites | null = null;

function getAtmosphericSprites() {
  atmosphericSpriteCache ??= createAtmosphericSprites();
  return atmosphericSpriteCache;
}

function prewarmLightModeRenderer() {
  getAtmosphericSprites();
}

registerRendererPrewarmer('light', prewarmLightModeRenderer);

function getCloudWidth(sceneWidth: number, compact: boolean, spec: CloudSpec) {
  if (spec.layer === 'far') {
    return clamp(sceneWidth * spec.width, compact ? 150 : 190, compact ? 280 : 480);
  }
  if (spec.layer === 'middle') {
    return clamp(sceneWidth * spec.width, compact ? 210 : 300, compact ? 380 : 680);
  }
  return clamp(sceneWidth * spec.width, compact ? 380 : 620, compact ? 560 : 1040);
}

function createClouds(
  width: number,
  height: number,
  compact: boolean,
  sprites: CloudSprites,
) {
  const specs = compact ? COMPACT_CLOUD_SPECS : DESKTOP_CLOUD_SPECS;
  return specs.map((spec, index): Cloud => {
    const cloudWidth = getCloudWidth(width, compact, spec);
    const depthProfile = spec.layer === 'far'
      ? LIGHT_DEPTH_PROFILES.farCloud
      : spec.layer === 'middle'
        ? LIGHT_DEPTH_PROFILES.middleCloud
        : LIGHT_DEPTH_PROFILES.foregroundMist;
    return {
      x: width * spec.x,
      y: height * spec.y,
      width: cloudWidth,
      height: cloudWidth / spec.aspect,
      depthProfile,
      speed: spec.speed,
      direction: spec.direction,
      phase: index * 1.73 + 0.41,
      opacity: spec.opacity,
      layer: spec.layer,
      sprite: sprites[spec.sprite],
    };
  });
}

function createHazeLayers(
  width: number,
  height: number,
  sprites: AtmosphericSprites,
): HazeLayer[] {
  const shortSide = Math.min(width, height);
  return [
    {
      x: width * 0.2,
      y: height * 0.31,
      width: Math.max(width * 0.7, shortSide * 0.8),
      height: Math.max(height * 0.48, shortSide * 0.52),
      depthProfile: LIGHT_DEPTH_PROFILES.farHaze,
      phase: 0.7,
      driftX: width * 0.012,
      driftY: height * 0.01,
      opacity: 0.44,
      layer: 'far',
      sprite: sprites.cyanHaze,
    },
    {
      x: width * 0.79,
      y: height * 0.48,
      width: Math.max(width * 0.62, shortSide * 0.72),
      height: Math.max(height * 0.55, shortSide * 0.58),
      depthProfile: LIGHT_DEPTH_PROFILES.middleHaze,
      phase: 2.3,
      driftX: width * 0.018,
      driftY: height * 0.014,
      opacity: 0.38,
      layer: 'middle',
      sprite: sprites.lavenderHaze,
    },
    {
      x: width * 0.14,
      y: height * 0.86,
      width: Math.max(width * 0.86, shortSide),
      height: Math.max(height * 0.44, shortSide * 0.5),
      depthProfile: LIGHT_DEPTH_PROFILES.nearHaze,
      phase: 4.8,
      driftX: width * 0.021,
      driftY: height * 0.017,
      opacity: 0.3,
      layer: 'near',
      sprite: sprites.foregroundCyanHaze,
    },
    {
      x: width * 0.42,
      y: height * 0.87,
      width: Math.max(width * 0.54, shortSide * 0.72),
      height: Math.max(height * 0.38, shortSide * 0.44),
      depthProfile: LIGHT_DEPTH_PROFILES.nearHaze,
      phase: 5.9,
      driftX: width * 0.016,
      driftY: height * 0.013,
      opacity: 0.2,
      layer: 'near',
      sprite: sprites.foregroundCyanHaze,
    },
  ];
}

function createDistantHills(
  width: number,
  height: number,
  compact: boolean,
  sprites: DistantHillSprites,
): DistantHillLayer[] {
  const hillWidth = Math.max(
    width * (compact ? 1.72 : 1.3),
    height * (compact ? 0.94 : 1.12),
  );
  const centerX = width * (compact ? 0.82 : 0.58);
  return [
    {
      x: centerX,
      y: height * (compact ? 0.64 : 0.6),
      width: hillWidth,
      height: height * (compact ? 0.7 : 0.8),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.43,
      sprite: sprites.far,
    },
    {
      x: centerX - width * 0.015,
      y: height * (compact ? 0.67 : 0.64),
      width: hillWidth * 1.02,
      height: height * (compact ? 0.62 : 0.7),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.24,
      sprite: sprites.middle,
    },
    {
      x: centerX - width * 0.035,
      y: height * (compact ? 0.7 : 0.68),
      width: hillWidth * 1.04,
      height: height * (compact ? 0.58 : 0.62),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.26,
      sprite: sprites.near,
    },
  ];
}

function createForegroundTrees(
  width: number,
  height: number,
  compact: boolean,
  sprite: HTMLCanvasElement,
): ForegroundTreeLine {
  return {
    x: width * 0.5,
    y: height * (compact ? 0.92 : 0.9),
    width: width * (compact ? 1.38 : 1.22),
    height: height * (compact ? 0.46 : 0.52),
    depthProfile: LIGHT_DEPTH_PROFILES.foregroundTrees,
    opacity: 0.7,
    sprite,
  };
}

function createParticles(width: number, height: number, compact: boolean) {
  const count = compact ? 26 : 48;
  const random = createSeededRandom(compact ? 8111 : 9011);
  return Array.from({ length: count }, (_, index): AtmosphericParticle => {
    const x = random() * width;
    const y = random() * height;
    const size = (compact ? 0.45 : 0.55) + random() * (compact ? 1.05 : 1.35);
    const depthMix = random();
    return {
      qualityRank: qualityRank(index, 0x61a7),
      x,
      y,
      size,
      depthProfile: {
        translation: PARTICLE_DEPTH_RANGE.translation[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.translation[1] - PARTICLE_DEPTH_RANGE.translation[0]),
        perspective: PARTICLE_DEPTH_RANGE.perspective[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.perspective[1] - PARTICLE_DEPTH_RANGE.perspective[0]),
        tilt: 0,
      },
      phase: random() * TAU + index * 0.19,
      drift: 2 + random() * 7,
      speed: 0.55 + random() * 2.1,
      colorIndex: Math.floor(random() * 3),
    };
  });
}

function createRiverLightMotes(
  width: number,
  height: number,
  compact: boolean,
): RiverLightMote[] {
  const count = compact ? 26 : 44;
  const random = createSeededRandom(compact ? 101833 : 103921);
  const toneRandom = createSeededRandom(compact ? 102653 : 104729);
  const accentRandom = createSeededRandom(compact ? 103681 : 105319);
  const primaryCount = compact ? 14 : 24;
  const secondaryCount = compact ? 8 : 13;
  const pearlCount = compact ? 19 : 32;
  const blushCount = compact ? 4 : 7;
  const accentCount = compact ? 3 : 6;

  const clusterAssignments = Array.from({ length: count }, (_, index) => (
    index < primaryCount ? 0 : index < primaryCount + secondaryCount ? 1 : 2
  ));
  for (let index = clusterAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = clusterAssignments[index];
    clusterAssignments[index] = clusterAssignments[swapIndex];
    clusterAssignments[swapIndex] = value;
  }

  const toneAssignments = Array.from(
    { length: count },
    (_, index): 0 | 1 | 2 => (
      index < pearlCount ? 0 : index < pearlCount + blushCount ? 1 : 2
    ),
  );
  for (let index = toneAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(toneRandom() * (index + 1));
    const value = toneAssignments[index];
    toneAssignments[index] = toneAssignments[swapIndex];
    toneAssignments[swapIndex] = value;
  }

  const accentAssignments = Array.from(
    { length: count },
    (_, index) => index < accentCount,
  );
  for (let index = accentAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(accentRandom() * (index + 1));
    const value = accentAssignments[index];
    accentAssignments[index] = accentAssignments[swapIndex];
    accentAssignments[swapIndex] = value;
  }

  return Array.from({ length: count }, (_, index): RiverLightMote => {
    const cluster = clusterAssignments[index];
    const xRatio = cluster === 0
      ? 0.22 + (random() + random()) * 0.125
      : cluster === 1
        ? 0.08 + (random() + random()) * 0.11
        : 0.45 + (random() + random()) * 0.105;
    const accent = accentAssignments[index];
    const depthMix = random();
    const shapeRoll = random();
    return {
      x: width * xRatio,
      y: height * (0.58 + Math.sqrt(random()) * 0.24),
      size: compact
        ? accent ? 13 + random() * 4 : 5 + random() * 8
        : accent ? 18 + random() * 6 : 7 + random() * 11,
      opacity: accent ? 0.6 + random() * 0.18 : 0.34 + random() * 0.3,
      phase: random() * TAU,
      hoverSpeed: TAU / (8 + random() * 7),
      twinkleSpeed: TAU / (2.8 + random() * 2.7),
      driftX: compact ? 1 + random() * 2 : 1.5 + random() * 3,
      driftY: compact ? 0.75 + random() * 1.5 : 1 + random() * 2,
      shapeIndex: shapeRoll < 0.6 ? 0 : shapeRoll < 0.75 ? 1 : 2,
      toneIndex: toneAssignments[index],
      depthProfile: {
        translation: 0.1 + depthMix * 0.08,
        perspective: 0.08 + depthMix * 0.07,
        tilt: 0,
      },
    };
  });
}

function createRiverParticles(compact: boolean): RiverParticle[] {
  const count = compact ? 56 : 96;
  const random = createSeededRandom(compact ? 12457 : 17681);
  const minimumSize = compact ? 1.4 : 1.8;
  const maximumSize = compact ? 4.2 : 5.5;
  const minimumY = compact ? 0.72 : 0.69;
  const maximumY = compact ? 0.91 : 0.89;

  return Array.from({ length: count }, (_, index): RiverParticle => {
    const sizeRoll = random();
    const depthMix = random();
    const size = compact
      ? sizeRoll < 0.6
        ? 1.4 + random() * 1.2
        : sizeRoll < 0.9
          ? 2.6 + random() * 0.9
          : 3.5 + random() * 0.7
      : sizeRoll < 0.6
        ? 1.8 + random() * 1.2
        : sizeRoll < 0.9
          ? 3 + random() * 1.5
          : 4.5 + random() * 1;
    const spinDirection = random() < 0.5 ? -1 : 1;
    const fastTumble = random() < 0.15;
    return {
      qualityRank: qualityRank(index, 0x92bf),
      phase: positiveModulo(random() + index / count, 1),
      speed: 4.5 + random() * 4.5,
      size: clamp(size, minimumSize, maximumSize),
      depthProfile: {
        translation: 0.14 + depthMix * 0.28,
        perspective: 0.12 + depthMix * 0.3,
        tilt: 0.08 + depthMix * 0.3,
      },
      depthScale: 0.78 + depthMix * 0.42,
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      y: minimumY + (random() + random()) * 0.5 * (maximumY - minimumY),
      horizontalDrift: 2 + random() * 7,
      verticalDrift: 2 + random() * 5,
      driftSpeed: 0.00016 + random() * 0.00019,
      driftPhase: random() * TAU,
      lift: 0.008 + random() * 0.035,
      rotation: random() * TAU,
      rotationSpeed: spinDirection
        * (fastTumble ? 0.61 + random() * 0.35 : 0.14 + random() * 0.42),
      opacity: (0.46 + random() * 0.38) * (0.72 + depthMix * 0.28),
    };
  });
}

function createRisingRiverFragmentColorSequence(random: () => number) {
  const fallback = [0, 2, 5, 0, 1, 2, 4, 5, 3];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const sequence = Array.from(RISING_RIVER_FRAGMENT_COLOR_POOL);
    for (let index = sequence.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const value = sequence[index];
      sequence[index] = sequence[swapIndex];
      sequence[swapIndex] = value;
    }
    let valid = sequence[0] !== sequence[sequence.length - 1];
    for (let index = 1; index < sequence.length && valid; index += 1) {
      valid = sequence[index] !== sequence[index - 1];
    }
    if (valid) return sequence;
  }
  return fallback;
}

function getRisingRiverFragmentShapeIndex(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value < 0.28) return 0;
  if (value < 0.54) return 1;
  if (value < 0.72) return 2;
  if (value < 0.88) return 3;
  return 4;
}

function createRisingRiverFragments(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverFragment[] {
  const coreCount = compact ? 105 : 175;
  const leftExtensionCount = compact ? 21 : 35;
  const edgeFringeCount = compact ? 11 : 18;
  const count = coreCount + leftExtensionCount + edgeFringeCount;
  const random = createSeededRandom(compact ? 38921 : 45191);
  const glowRandom = createSeededRandom(compact ? 57427 : 61861);
  const leftGlowRandom = createSeededRandom(compact ? 70117 : 73471);
  const edgeGlowRandom = createSeededRandom(compact ? 81283 : 84719);
  const sizeBoostRandom = createSeededRandom(compact ? 92347 : 96731);
  const primaryClusterCount = Math.round(coreCount * 0.6);
  const secondaryClusterCount = Math.round(coreCount * 0.3);
  const clusterAssignments = Array.from({ length: coreCount }, (_, index) => (
    index < primaryClusterCount
      ? 0
      : index < primaryClusterCount + secondaryClusterCount
        ? 1
        : 2
  ));
  for (let index = clusterAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = clusterAssignments[index];
    clusterAssignments[index] = clusterAssignments[swapIndex];
    clusterAssignments[swapIndex] = value;
  }
  const whiteGlowCount = compact ? 16 : 26;
  const roseGlowCount = compact ? 10 : 18;
  const glowAssignments = Array.from(
    { length: coreCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < whiteGlowCount
        ? 0
        : index < whiteGlowCount + roseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = glowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(glowRandom() * (index + 1));
    const value = glowAssignments[index];
    glowAssignments[index] = glowAssignments[swapIndex];
    glowAssignments[swapIndex] = value;
  }
  const leftWhiteGlowCount = compact ? 3 : 6;
  const leftRoseGlowCount = 3;
  const leftGlowAssignments = Array.from(
    { length: leftExtensionCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < leftWhiteGlowCount
        ? 0
        : index < leftWhiteGlowCount + leftRoseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = leftGlowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(leftGlowRandom() * (index + 1));
    const value = leftGlowAssignments[index];
    leftGlowAssignments[index] = leftGlowAssignments[swapIndex];
    leftGlowAssignments[swapIndex] = value;
  }
  const edgeWhiteGlowCount = compact ? 2 : 3;
  const edgeRoseGlowCount = compact ? 1 : 2;
  const edgeGlowAssignments = Array.from(
    { length: edgeFringeCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < edgeWhiteGlowCount
        ? 0
        : index < edgeWhiteGlowCount + edgeRoseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = edgeGlowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(edgeGlowRandom() * (index + 1));
    const value = edgeGlowAssignments[index];
    edgeGlowAssignments[index] = edgeGlowAssignments[swapIndex];
    edgeGlowAssignments[swapIndex] = value;
  }
  const boostedSizeCount = Math.round(count * 0.25);
  const sizeBoostAssignments = Array.from(
    { length: count },
    (_, index) => index < boostedSizeCount,
  );
  for (let index = sizeBoostAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(sizeBoostRandom() * (index + 1));
    const value = sizeBoostAssignments[index];
    sizeBoostAssignments[index] = sizeBoostAssignments[swapIndex];
    sizeBoostAssignments[swapIndex] = value;
  }

  const sizeScale = 1.25;

  return Array.from({ length: count }, (_, index): RisingRiverFragment => {
    const sizeRoll = random();
    const baseSize = (
      compact
        ? sizeRoll < 0.72
          ? 2.6 + random() * 3.1
          : sizeRoll < 0.95
            ? 5.7 + random() * 2.6
            : 8.3 + random() * 2.6
        : sizeRoll < 0.7
          ? 3.25 + random() * 3.8
          : sizeRoll < 0.95
            ? 7.05 + random() * 3.8
            : 10.85 + random() * 3.95
    ) * sizeScale * (sizeBoostAssignments[index] ? 1.875 : 1);
    const isLeftExtension = index >= coreCount
      && index < coreCount + leftExtensionCount;
    const isEdgeFringe = index >= coreCount + leftExtensionCount;
    const extensionIndex = index - coreCount;
    const edgeIndex = index - coreCount - leftExtensionCount;
    const cluster = isEdgeFringe
      ? 4
      : isLeftExtension
        ? 3
        : clusterAssignments[index];
    const sourceXRatio = cluster === 4
      ? -0.13 + (random() + random()) * 0.05
      : cluster === 3
      ? -0.04 + (random() + random()) * 0.08
      : cluster === 0
        ? 0.08 + (random() + random()) * 0.1
        : cluster === 1
          ? 0.29 + (random() + random()) * 0.09
          : 0.03 + random() * 0.52;
    const sourceX = width * clamp(sourceXRatio, -0.13, 0.55);
    const sourceY = height * (0.89 + random() * 0.06);
    const targetY = height * (0.1 + random() * 0.26);
    const riseDistance = sourceY - targetY;
    const angle = (67 + random() * 6) * Math.PI / 180;
    const endpointLimit = width * (compact ? 0.62 : 0.68);
    const rightwardTravel = Math.min(
      width * (riseDistance / height) / Math.tan(angle),
      Math.max(endpointLimit - sourceX, 0),
    );
    const horizontalDrift = isEdgeFringe
      ? rightwardTravel * (0.55 + random() * 0.18)
      : !isLeftExtension && random() < 0.1
        ? -width * (0.01 + random() * 0.02)
        : rightwardTravel;
    const depthMix = random();
    const fastTumble = random() < 0.14;
    const spinDirection = random() < 0.5 ? -1 : 1;
    const colorSequence = createRisingRiverFragmentColorSequence(random);
    return {
      sourceX,
      sourceY,
      riseDistance,
      phase: positiveModulo(
        (isEdgeFringe
          ? edgeIndex / edgeFringeCount
          : isLeftExtension
            ? extensionIndex / leftExtensionCount
            : index / coreCount)
          + random() * 0.18,
        1,
      ),
      duration: 48000 + random() * 24000,
      baseSize,
      terminalScale: 0.42 + random() * 0.18,
      horizontalDrift,
      sway: compact ? 2 + random() * 5 : 3 + random() * 7,
      swayCycles: 0.65 + random() * 0.6,
      rotation: random() * TAU,
      rotationSpeed: spinDirection
        * (fastTumble ? 0.25 + random() * 0.17 : 0.05 + random() * 0.19),
      tumblePhase: random() * TAU,
      tumbleSpeed: 0.09 + random() * 0.24,
      opacity: 0.46 + random() * 0.32,
      shapeIndex: getRisingRiverFragmentShapeIndex(random()),
      colorSequence,
      colorPhaseMs: random()
        * RISING_RIVER_FRAGMENT_COLOR_FADE_MS
        * colorSequence.length,
      haloStrength: 0.58 + random() * 0.42,
      transitionGlowVariant: isEdgeFringe
        ? edgeGlowAssignments[edgeIndex]
        : isLeftExtension
          ? leftGlowAssignments[extensionIndex]
          : glowAssignments[index],
      depthProfile: {
        translation: 0.3 + depthMix * 0.26,
        perspective: 0.26 + depthMix * 0.24,
        tilt: 0.18 + depthMix * 0.24,
      },
    };
  });
}

function createRisingRiverFogPatches(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverFogPatch[] {
  const count = compact ? 5 : 8;
  const random = createSeededRandom(compact ? 25357 : 33791);
  const minimumWidth = compact ? 120 : 180;
  const maximumWidth = compact ? 220 : 360;
  const minimumHeight = compact ? 42 : 52;
  const maximumHeight = compact ? 82 : 115;
  const minimumOpacity = compact ? 0.08 : 0.07;
  const maximumOpacity = compact ? 0.14 : 0.13;

  return Array.from({ length: count }, (_, index): RisingRiverFogPatch => {
    const sourceY = height * (0.89 + random() * 0.05);
    const targetY = height * (0.42 + random() * 0.14);
    const depthMix = random();
    const corridorProgress = (index + random() * 0.42) / (count - 1 + 0.42);
    return {
      sourceX: width * (0.025 + corridorProgress * 0.69),
      sourceY,
      width: minimumWidth + random() * (maximumWidth - minimumWidth),
      height: minimumHeight + random() * (maximumHeight - minimumHeight),
      riseDistance: sourceY - targetY,
      phase: positiveModulo((index + random() * 0.35) / count, 1),
      duration: 52000 + random() * 30000,
      horizontalDrift: width * (0.05 + random() * 0.05),
      sway: 3 + random() * 5,
      swayCycles: 0.72 + random() * 0.68,
      growthX: 0.2 + random() * 0.15,
      growthY: 0.15 + random() * 0.15,
      opacity: minimumOpacity + random() * (maximumOpacity - minimumOpacity),
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      depthProfile: {
        translation: 0.04 + depthMix * 0.1,
        perspective: 0.035 + depthMix * 0.095,
        tilt: 0.02 + depthMix * 0.06,
      },
    };
  });
}

function createRisingRiverGlows(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverGlow[] {
  const count = compact ? 7 : 12;
  const random = createSeededRandom(compact ? 21401 : 29879);
  const minimumWidth = compact ? 28 : 42;
  const maximumWidth = compact ? 72 : 110;

  return Array.from({ length: count }, (_, index): RisingRiverGlow => {
    const glowWidth = minimumWidth + random() * (maximumWidth - minimumWidth);
    const sourceY = height * (0.9 + random() * 0.04);
    const targetY = height * (0.35 + random() * 0.15);
    const depthMix = random();
    return {
      sourceX: width * (0.035 + (random() + random()) * 0.345),
      sourceY,
      width: glowWidth,
      height: glowWidth * (1.45 + random() * 0.65),
      riseDistance: sourceY - targetY,
      phase: positiveModulo(index / count + random() * 0.16, 1),
      duration: 34000 + random() * 18000,
      horizontalDrift: width * (-0.025 + random() * 0.065),
      sway: clamp(width * (0.006 + random() * 0.012), 5, compact ? 13 : 22),
      swayCycles: 0.8 + random() * 0.8,
      rotation: (random() - 0.5) * 0.08,
      rotationDrift: (random() - 0.5) * 0.12,
      growth: 0.2 + random() * 0.15,
      opacity: 0.08 + random() * 0.14,
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      depthProfile: {
        translation: 0.07 + depthMix * 0.13,
        perspective: 0.06 + depthMix * 0.12,
        tilt: 0.03 + depthMix * 0.09,
      },
    };
  });
}

function createScene(
  width: number,
  height: number,
  coarsePointer: boolean,
  sprites: AtmosphericSprites,
): AtmosphericScene {
  const compact = width < 720 || height < 560;
  const shortSide = Math.min(width, height);
  const motionScale = compact || coarsePointer ? 0.68 : 1;
  return {
    width,
    height,
    compact,
    motionScale,
    pixelRatio: 1,
    parallax: {
      positionX: 0, positionY: 0,
      maximumOffsetX: clamp(width * 0.025, 15, 34) * motionScale,
      maximumOffsetY: clamp(height * 0.019, 10, 22) * motionScale,
      maximumPitch: 7 * DEGREE * motionScale,
      maximumYaw: 10 * DEGREE * motionScale,
      maximumPerspectiveScale: 0.05 * motionScale,
      centerX: width * 0.5, centerY: height * 0.5,
      inverseHalfWidth: 2 / Math.max(width, 1),
      inverseHalfHeight: 2 / Math.max(height, 1), cursorNormalization: 1,
    },
    sun: {
      x: width * 0.91,
      y: compact ? Math.max(height * 0.2, 120) : height * 0.17,
      radius: shortSide * 0.018,
      glowRadius: shortSide * (compact ? 0.36 : 0.43),
    },
    clouds: createClouds(width, height, compact, sprites.clouds),
    haze: createHazeLayers(width, height, sprites),
    distantHills: createDistantHills(width, height, compact, sprites.distantHills),
    foregroundTrees: createForegroundTrees(width, height, compact, sprites.foregroundTrees),
    riverLightMotes: createRiverLightMotes(width, height, compact),
    riverParticles: createRiverParticles(compact),
    risingRiverFragments: createRisingRiverFragments(width, height, compact),
    risingRiverFogPatches: createRisingRiverFogPatches(width, height, compact),
    risingRiverGlows: createRisingRiverGlows(width, height, compact),
    particles: createParticles(width, height, compact),
    projection: { x: 0, y: 0, scale: 1, alphaScale: 1 },
  };
}

function normalizeDeviceTilt(delta: number, range: number) {
  const magnitude = Math.abs(delta);
  if (magnitude <= DEVICE_TILT_DEAD_ZONE) return 0;
  return clamp(
    Math.sign(delta)
      * (magnitude - DEVICE_TILT_DEAD_ZONE)
      / Math.max(range - DEVICE_TILT_DEAD_ZONE, 1),
    -1,
    1,
  );
}

function getShortestAngleDelta(value: number, baseline: number) {
  return ((value - baseline + 540) % 360) - 180;
}

function getScreenRelativeDeviceTilt(beta: number, gamma: number) {
  const fallbackOrientation = (window as Window & { orientation?: number }).orientation;
  const rawAngle = window.screen.orientation?.angle ?? fallbackOrientation ?? 0;
  const angle = ((rawAngle % 360) + 360) % 360;
  if (angle === 90) return { x: beta, y: -gamma };
  if (angle === 180) return { x: -gamma, y: -beta };
  if (angle === 270) return { x: -beta, y: gamma };
  return { x: gamma, y: beta };
}

function createParallaxFrame(
  scene: AtmosphericScene,
  positionX: number,
  positionY: number,
): ParallaxFrame {
  const clampedX = clamp(positionX, -1, 1);
  const clampedY = clamp(positionY, -1, 1);
  const frame = scene.parallax;
  frame.positionX = clampedX;
  frame.positionY = clampedY;
  frame.cursorNormalization = 1 / Math.max(1, Math.abs(clampedX) + Math.abs(clampedY));
  return frame;
}

function getParallaxOffsetX(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionX * parallax.maximumOffsetX * clamp(depth, 0, 1);
}

function getParallaxOffsetY(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionY * parallax.maximumOffsetY * clamp(depth, 0, 1);
}

function projectAtDepth(
  parallax: ParallaxFrame,
  x: number,
  y: number,
  depthProfile: AtmosphericDepthProfile,
  output: DepthProjection,
  responseScale = 1,
) {
  const scaledResponse = clamp(responseScale, 0, 1);
  const normalizedX = clamp((x - parallax.centerX) * parallax.inverseHalfWidth, -1.2, 1.2);
  const normalizedY = clamp((y - parallax.centerY) * parallax.inverseHalfHeight, -1.2, 1.2);
  const cursorSide = clamp(
    (normalizedX * parallax.positionX + normalizedY * parallax.positionY)
      * parallax.cursorNormalization,
    -1,
    1,
  );
  const response = cursorSide
    * clamp(depthProfile.perspective, 0, 1)
    * scaledResponse;
  const scale = clamp(1 - response * parallax.maximumPerspectiveScale, 0.94, 1.06);
  output.x = parallax.centerX
    + (x - parallax.centerX) * scale
    + getParallaxOffsetX(parallax, depthProfile.translation * scaledResponse);
  output.y = parallax.centerY
    + (y - parallax.centerY) * scale
    + getParallaxOffsetY(parallax, depthProfile.translation * scaledResponse);
  output.scale = scale;
  output.alphaScale = clamp(1 - response * 0.09, 0.94, 1.06);
}

function drawDepthImage(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  depthProfile: AtmosphericDepthProfile,
  opacity: number,
  parallax: ParallaxFrame,
  rotation = 0,
) {
  if (opacity <= 0.001) return;
  projectAtDepth(
    parallax,
    x,
    y,
    depthProfile,
    scene.projection,
  );
  if (!isProjectedVisible(scene, width, height)) return;
  const response = clamp(depthProfile.tilt, 0, 1);
  const pitch = -parallax.positionY * parallax.maximumPitch * response;
  const yaw = parallax.positionX * parallax.maximumYaw * response;
  context.save();
  context.translate(scene.projection.x, scene.projection.y);
  context.transform(1, Math.sin(pitch) * 0.11, Math.sin(yaw) * 0.085, 1, 0, 0);
  context.rotate(rotation + (yaw - pitch) * 0.025);
  context.scale(scene.projection.scale, scene.projection.scale);
  context.globalAlpha = opacity * scene.projection.alphaScale;
  context.drawImage(image, -width * 0.5, -height * 0.5, width, height);
  context.restore();
}

function drawSky(context: CanvasRenderingContext2D, scene: AtmosphericScene, sprite: HTMLCanvasElement) {
  context.drawImage(sprite, 0, 0, scene.width, scene.height);
}

function drawAtmosphericWash(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: AtmosphericWashSprites,
  planes: FramePlanes,
) {
  const shortSide = Math.min(scene.width, scene.height);
  const farX = getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const farY = getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  mixRgbInto(RIGHT_GLOW_GOLD, activeColor, 0.3, planes.rightColor);
  drawRadialWash(context, tintWash(washes.right, planes.rightColor, planes.tintScratch),
    scene.width * 1.02 + farX, scene.height * 0.38 + farY,
    Math.max(scene.width * 0.6, scene.height * 0.72));
  drawRadialWash(context, tintWash(washes.lowerRight, planes.rightColor, planes.tintScratch),
    scene.width * 0.98 + farX, scene.height * 0.94 + farY, shortSide * 0.76);
  drawRadialWash(context, tintWash(washes.accent, activeColor, planes.tintScratch),
    scene.width * 0.08 + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.middleHaze.translation),
    scene.height * 0.69 + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.middleHaze.translation),
    shortSide * 0.86);
  drawRadialWash(context, washes.lavender,
    scene.width * 0.72 + farX, scene.height * 0.44 + farY, shortSide * 0.72);
  projectAtDepth(parallax, scene.sun.x, scene.sun.y, LIGHT_DEPTH_PROFILES.sun, scene.projection);
  drawRadialWash(context,
    tintWash(scene.compact ? washes.compactSunAccent : washes.sunAccent, activeColor, planes.tintScratch),
    scene.projection.x, scene.projection.y, scene.sun.glowRadius * 1.12);
}

function drawSun(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: AtmosphericSprites,
  parallax: ParallaxFrame,
) {
  const diameter = scene.sun.glowRadius * 2;
  drawDepthImage(context, scene, sprites.sun, scene.sun.x, scene.sun.y,
    diameter, diameter, LIGHT_DEPTH_PROFILES.sun, 0.92, parallax);
}

function drawHaze(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  layer: HazeLayerKind,
  parallax: ParallaxFrame,
) {
  for (const haze of scene.haze) {
    if (haze.layer !== layer) continue;
    const x = haze.x + Math.sin(time * 0.000025 + haze.phase) * haze.driftX;
    const y = haze.y + Math.cos(time * 0.000021 + haze.phase) * haze.driftY;
    const pulse = 0.96 + Math.sin(time * 0.000039 + haze.phase * 1.7) * 0.04;
    drawDepthImage(
      context,
      scene,
      haze.sprite,
      x,
      y,
      haze.width,
      haze.height,
      haze.depthProfile,
      haze.opacity * pulse,
      parallax,
    );
  }
}

function drawDistantHills(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  parallax: ParallaxFrame,
) {
  for (const hill of scene.distantHills) {
    drawDepthImage(
      context,
      scene,
      hill.sprite,
      hill.x,
      hill.y,
      hill.width,
      hill.height,
      hill.depthProfile,
      hill.opacity,
      parallax,
    );
  }
}

function drawForegroundTrees(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  parallax: ParallaxFrame,
) {
  drawDepthImage(
    context,
    scene,
    scene.foregroundTrees.sprite,
    scene.foregroundTrees.x,
    scene.foregroundTrees.y,
    scene.foregroundTrees.width,
    scene.foregroundTrees.height,
    scene.foregroundTrees.depthProfile,
    scene.foregroundTrees.opacity,
    parallax,
  );
}

function drawForegroundGlowTint(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: AtmosphericWashSprites,
  planes: FramePlanes,
) {
  mixRgbInto(FOREGROUND_GLOW_GOLD, activeColor, 0.34, planes.foregroundColor);
  projectAtDepth(parallax, scene.width * 1.06, scene.height * 0.8,
    LIGHT_DEPTH_PROFILES.foregroundTrees, scene.projection);
  drawRadialWash(context, tintWash(washes.tint, planes.foregroundColor, planes.tintScratch),
    scene.projection.x, scene.projection.y, Math.max(scene.width * 0.72, scene.height * 0.78));
}

function drawRiverGlow(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  parallax: ParallaxFrame,
  washes: AtmosphericWashSprites,
) {
  const centerY = scene.height * (scene.compact ? 0.92 : 0.91);
  const lobes = scene.compact ? COMPACT_RIVER_GLOW_LOBES : DESKTOP_RIVER_GLOW_LOBES;
  context.save();
  context.beginPath();
  context.rect(0, 0, scene.width * RIVER_GLOW_FLOW_BOUNDARY_X, scene.height);
  context.clip();
  projectAtDepth(parallax, scene.width * 0.33, centerY,
    LIGHT_DEPTH_PROFILES.riverGlow, scene.projection);
  const bedWidth = scene.width * 1.16;
  const bedHeight = scene.height * (scene.compact ? 0.128 : 0.116);
  context.globalAlpha = scene.projection.alphaScale;
  context.drawImage(washes.riverBed, scene.projection.x - bedWidth * 0.5,
    scene.projection.y - bedHeight * 0.5, bedWidth, bedHeight);
  for (const lobe of lobes) {
    const flowDistance = Math.max((RIVER_GLOW_FLOW_BOUNDARY_X + lobe.halfWidth) * scene.width, 1);
    const progress = positiveModulo(lobe.phase + time * 0.001 * lobe.speed / flowDistance, 1);
    const flowOpacity = lobe.opacity * smoothstep(0, 0.16, progress) * (1 - smoothstep(0.9, 1, progress));
    if (flowOpacity <= 0.001) continue;
    const centerX = -lobe.halfWidth + (RIVER_GLOW_FLOW_BOUNDARY_X + lobe.halfWidth) * progress;
    projectAtDepth(parallax, scene.width * centerX, centerY + scene.height * lobe.verticalOffset,
      LIGHT_DEPTH_PROFILES.riverGlow, scene.projection);
    const width = scene.width * lobe.halfWidth * 2;
    const height = scene.height * lobe.halfHeight * 2;
    if (!isProjectedVisible(scene, width, height)) continue;
    context.globalAlpha = flowOpacity * scene.projection.alphaScale;
    context.drawImage(washes.riverLobe, scene.projection.x - width * 0.5,
      scene.projection.y - height * 0.5, width, height);
  }
  context.restore();
}

function mixRgbInto(a: Rgb, b: Rgb, amount: number, output: Rgb) {
  for (let index = 0; index < 3; index += 1) {
    output[index] = a[index] + (b[index] - a[index]) * amount;
  }
}

function isProjectedVisible(scene: AtmosphericScene, width: number, height: number) {
  // Conservative radius includes rotation and the small image-plane shear.
  const radius = Math.hypot(width, height) * scene.projection.scale * 0.6;
  return scene.projection.x + radius >= 0
    && scene.projection.x - radius <= scene.width
    && scene.projection.y + radius >= 0
    && scene.projection.y - radius <= scene.height;
}

function setSpriteTransform(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  rotation: number,
  pitch: number,
  yaw: number,
  scaleX: number,
  scaleY: number,
) {
  // Compose DPR × translate × shear × rotate × scale without matrix objects.
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const shearX = Math.sin(yaw) * 0.085;
  const shearY = Math.sin(pitch) * 0.11;
  const dpr = scene.pixelRatio;
  context.setTransform(
    dpr * (cosine + shearX * sine) * scaleX,
    dpr * (shearY * cosine + sine) * scaleX,
    dpr * (-sine + shearX * cosine) * scaleY,
    dpr * (-shearY * sine + cosine) * scaleY,
    scene.projection.x * dpr,
    scene.projection.y * dpr,
  );
}

function getCloudX(scene: AtmosphericScene, cloud: Cloud, time: number) {
  const margin = 120;
  const minimum = -cloud.width * 0.5 - margin;
  const span = scene.width + cloud.width + margin * 2;
  const travel = cloud.direction * cloud.speed * time * 0.001;
  return minimum + positiveModulo(cloud.x - minimum + travel, span);
}

function drawClouds(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  layer: CloudLayerKind,
  parallax: ParallaxFrame,
) {
  for (const cloud of scene.clouds) {
    if (cloud.layer !== layer) continue;
    const x = getCloudX(scene, cloud, time);
    const y = cloud.y + Math.sin(time * 0.00007 + cloud.phase) * scene.height * 0.006;
    const rotation = Math.sin(time * 0.000031 + cloud.phase) * 0.008;
    drawDepthImage(
      context,
      scene,
      cloud.sprite,
      x,
      y,
      cloud.width,
      cloud.height,
      cloud.depthProfile,
      cloud.opacity,
      parallax,
      rotation,
    );
  }
}

function drawRisingRiverFogPatches(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: RisingRiverFogPatchSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  context.save();
  context.globalCompositeOperation = 'source-over';

  for (const patch of scene.risingRiverFogPatches) {
    const progress = positiveModulo(patch.phase + time / patch.duration, 1);
    const fadeIn = smoothstep(0, 0.14, progress);
    const fadeOut = 1 - smoothstep(0.62, 1, progress);
    const opacity = patch.opacity * fadeIn * fadeOut;
    if (opacity <= 0.001) continue;

    const sway = Math.sin(
      progress * TAU * patch.swayCycles + patch.phase * TAU,
    ) * patch.sway * scene.motionScale;
    const x = patch.sourceX
      + patch.horizontalDrift * progress * scene.motionScale
      + sway;
    const y = patch.sourceY - patch.riseDistance * progress;
    const growthProgress = smoothstep(0, 1, progress);

    drawDepthImage(
      context,
      scene,
      sprites[patch.spriteIndex],
      x,
      y,
      patch.width * (1 + patch.growthX * growthProgress),
      patch.height * (1 + patch.growthY * growthProgress),
      patch.depthProfile,
      opacity,
      parallax,
    );
  }
  context.restore();
}

function drawRiverLightMotes(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: RiverLightMoteSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  const motionSeconds = time * 0.001 * scene.motionScale;
  context.save();
  context.globalCompositeOperation = 'source-over';
  context.imageSmoothingEnabled = true;

  for (const mote of scene.riverLightMotes) {
    const x = mote.x + Math.sin(
      motionSeconds * mote.hoverSpeed + mote.phase,
    ) * mote.driftX;
    const y = mote.y + Math.cos(
      motionSeconds * mote.hoverSpeed * 0.83 + mote.phase * 1.37,
    ) * mote.driftY;
    projectAtDepth(
      parallax,
      x,
      y,
      mote.depthProfile,
      scene.projection,
    );

    const twinkleInput = 0.5 + Math.sin(
      motionSeconds * mote.twinkleSpeed + mote.phase * 1.7,
    ) * 0.5;
    const twinkle = 0.62 + smoothstep(0, 1, twinkleInput) * 0.38;
    const scaleInput = 0.5 + Math.sin(
      motionSeconds * mote.twinkleSpeed * 0.83 + mote.phase * 0.91,
    ) * 0.5;
    const size = mote.size
      * scene.projection.scale
      * (0.94 + smoothstep(0, 1, scaleInput) * 0.12);
    const halfSize = size * 0.5;
    if (
      scene.projection.x < -halfSize
      || scene.projection.x > scene.width + halfSize
      || scene.projection.y < -halfSize
      || scene.projection.y > scene.height + halfSize
    ) continue;

    context.globalAlpha = mote.opacity
      * twinkle
      * scene.projection.alphaScale;
    context.drawImage(
      sprites.atlas,
      mote.shapeIndex * sprites.cellSize,
      mote.toneIndex * sprites.cellSize,
      sprites.cellSize,
      sprites.cellSize,
      scene.projection.x - halfSize,
      scene.projection.y - halfSize,
      size,
      size,
    );
  }

  context.restore();
}

function drawRisingRiverGlows(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: RisingRiverGlowSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  context.save();
  context.globalCompositeOperation = 'source-over';

  for (const glow of scene.risingRiverGlows) {
    const progress = positiveModulo(glow.phase + time / glow.duration, 1);
    const fadeIn = smoothstep(0, 0.12, progress);
    const fadeOut = 1 - smoothstep(0.55, 1, progress);
    const opacity = glow.opacity * fadeIn * fadeOut;
    if (opacity <= 0.001) continue;
    const sway = Math.sin(
      progress * TAU * glow.swayCycles + glow.phase * TAU,
    ) * glow.sway * scene.motionScale;
    const x = glow.sourceX + glow.horizontalDrift * progress * scene.motionScale + sway;
    const y = glow.sourceY - glow.riseDistance * progress;
    const growth = 1 + glow.growth * smoothstep(0, 0.72, progress);
    const rotation = glow.rotation
      + glow.rotationDrift * progress * scene.motionScale
      + Math.sin(progress * TAU + glow.phase * TAU) * 0.018 * scene.motionScale;

    drawDepthImage(
      context,
      scene,
      sprites[glow.spriteIndex],
      x,
      y,
      glow.width * growth,
      glow.height * growth,
      glow.depthProfile,
      opacity,
      parallax,
      rotation,
    );
  }
  context.restore();
}

function drawRisingRiverFragmentAtlasCell(
  context: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  cellSize: number,
  shapeIndex: number,
  colorIndex: number,
  destinationSize: number,
  alpha: number,
) {
  if (alpha <= 0.001) return;
  context.globalAlpha = alpha;
  context.drawImage(
    atlas,
    shapeIndex * cellSize,
    colorIndex * cellSize,
    cellSize,
    cellSize,
    -destinationSize * 0.5,
    -destinationSize * 0.5,
    destinationSize,
    destinationSize,
  );
}

function drawRisingRiverFragments(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: RisingRiverFragmentSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  const colorCycleDuration = RISING_RIVER_FRAGMENT_COLOR_FADE_MS
    * RISING_RIVER_FRAGMENT_COLOR_POOL.length;

  context.save();
  for (const fragment of scene.risingRiverFragments) {
    const progress = positiveModulo(fragment.phase + time / fragment.duration, 1);
    // A linear ascent keeps the vertical field evenly populated. The opacity
    // envelope still softens both ends of the loop, so recycling remains
    // invisible without compressing most fragments near the river or ceiling.
    const riseProgress = progress;
    const fadeIn = smoothstep(0, 0.1, progress);
    const fadeOut = 1 - smoothstep(0.88, 1, progress);

    const sway = Math.sin(
      progress * TAU * fragment.swayCycles + fragment.tumblePhase,
    ) * fragment.sway * scene.motionScale;
    const x = fragment.sourceX
      + fragment.horizontalDrift * riseProgress
      + sway;
    const y = fragment.sourceY - fragment.riseDistance * riseProgress;
    // The foreground forest is intentionally translucent. Hide fragments at
    // their source until they clear the canopy so they still read as emerging
    // from behind it instead of being painted inside the trees.
    const canopyReveal = 1 - smoothstep(
      scene.height * 0.77,
      scene.height * 0.92,
      y,
    );
    const opacity = fragment.opacity * fadeIn * fadeOut * canopyReveal;
    if (opacity <= 0.001) continue;
    const depthResponse = 1 - smoothstep(0, 1, riseProgress) * 0.45;
    projectAtDepth(
      parallax,
      x,
      y,
      fragment.depthProfile,
      scene.projection,
      depthResponse,
    );
    const offscreenMargin = fragment.baseSize * 2.5;
    if (
      scene.projection.x < -offscreenMargin
      || scene.projection.x > scene.width + offscreenMargin
      || scene.projection.y < -offscreenMargin
      || scene.projection.y > scene.height + offscreenMargin
    ) continue;

    const geometricScale = 1
      - (1 - fragment.terminalScale) * riseProgress;
    const tumbleClock = time * 0.001 * fragment.tumbleSpeed * scene.motionScale
      + fragment.tumblePhase;
    const aspectScale = 0.28 + 0.72 * (0.5 + Math.sin(tumbleClock) * 0.5);
    const rotation = fragment.rotation
      + time * 0.001 * fragment.rotationSpeed * scene.motionScale
      + Math.sin(tumbleClock * 0.73) * 0.1;
    const tiltResponse = clamp(fragment.depthProfile.tilt * depthResponse, 0, 1);
    const pitch = -parallax.positionY * parallax.maximumPitch * tiltResponse;
    const yaw = parallax.positionX * parallax.maximumYaw * tiltResponse;
    const destinationSize = fragment.baseSize * 1.72;

    const colorClock = positiveModulo(
      time + fragment.colorPhaseMs,
      colorCycleDuration,
    );
    const colorSegment = Math.floor(
      colorClock / RISING_RIVER_FRAGMENT_COLOR_FADE_MS,
    );
    const colorProgress = (
      colorClock - colorSegment * RISING_RIVER_FRAGMENT_COLOR_FADE_MS
    ) / RISING_RIVER_FRAGMENT_COLOR_FADE_MS;
    const colorBlend = smoothstep(0, 1, colorProgress);
    const currentColor = fragment.colorSequence[colorSegment];
    const nextColor = fragment.colorSequence[
      (colorSegment + 1) % fragment.colorSequence.length
    ];
    const luminousTransitionWeight = (currentColor === RISING_RIVER_FRAGMENT_WHITE_INDEX
      ? 1 - colorBlend
      : 0)
      + (nextColor === RISING_RIVER_FRAGMENT_WHITE_INDEX ? colorBlend : 0);
    const finalOpacity = clamp(
      opacity * scene.projection.alphaScale,
      0,
      0.95,
    );
    const nextAlpha = finalOpacity * colorBlend;
    const currentAlpha = finalOpacity * (1 - colorBlend)
      / Math.max(1 - nextAlpha, 0.001);

    setSpriteTransform(
      context, scene, rotation + (yaw - pitch) * 0.025, pitch, yaw,
      scene.projection.scale * geometricScale * aspectScale,
      scene.projection.scale * geometricScale,
    );

    if (
      fragment.transitionGlowVariant >= 0
      && luminousTransitionWeight > 0.001
    ) {
      const isWhiteGlow = fragment.transitionGlowVariant === 0;
      const glowAlpha = finalOpacity
        * luminousTransitionWeight
        * fragment.haloStrength
        * (isWhiteGlow ? 0.42 : 0.34);
      context.globalCompositeOperation = 'source-over';
      if (glowAlpha > 0.003) {
        drawRisingRiverFragmentAtlasCell(
          context,
          sprites.transitionGlowAtlas,
          sprites.cellSize,
          fragment.shapeIndex,
          fragment.transitionGlowVariant,
          destinationSize * (isWhiteGlow ? 1.32 : 1.26),
          glowAlpha,
        );
      }
    }

    context.globalCompositeOperation = 'source-over';
    drawRisingRiverFragmentAtlasCell(
      context,
      sprites.colorAtlas,
      sprites.cellSize,
      fragment.shapeIndex,
      currentColor,
      destinationSize,
      currentAlpha,
    );
    drawRisingRiverFragmentAtlasCell(
      context,
      sprites.colorAtlas,
      sprites.cellSize,
      fragment.shapeIndex,
      nextColor,
      destinationSize,
      nextAlpha,
    );
  }
  context.restore();
}

function drawRiverParticles(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: RiverParticleSprites,
  time: number,
  parallax: ParallaxFrame,
  quality: AdaptiveQuality,
) {
  const entryMargin = 0.035;
  const travelSpan = RIVER_GLOW_FLOW_BOUNDARY_X + entryMargin * 2;
  const flowDistance = Math.max(scene.width * travelSpan, 1);
  const minimumY = scene.compact ? 0.72 : 0.69;
  const maximumY = scene.compact ? 0.91 : 0.89;

  context.save();
  context.beginPath();
  context.rect(0, 0, scene.width * RIVER_GLOW_FLOW_BOUNDARY_X, scene.height);
  context.clip();

  for (const particle of scene.riverParticles) {
    const qualityAlpha = qualityOpacity(particle.qualityRank, quality.triangleWeights);
    if (qualityAlpha <= 0.001) continue;
    const progress = positiveModulo(
      particle.phase
        + time * 0.001 * particle.speed * scene.motionScale / flowDistance,
      1,
    );
    const turbulenceTime = time * particle.driftSpeed * scene.motionScale
      + particle.driftPhase;
    const x = scene.width * (-entryMargin + travelSpan * progress)
      + Math.sin(turbulenceTime * 0.83) * particle.horizontalDrift * scene.motionScale;
    const y = scene.height * (particle.y - particle.lift * progress)
      + Math.cos(turbulenceTime) * particle.verticalDrift * scene.motionScale;
    const normalizedX = x / Math.max(scene.width, 1);
    const fadeIn = smoothstep(-entryMargin, 0.015, normalizedX);
    const fadeOut = 1 - smoothstep(
      RIVER_GLOW_FLOW_BOUNDARY_X - 0.04,
      RIVER_GLOW_FLOW_BOUNDARY_X,
      normalizedX,
    );
    const verticalProgress = clamp(
      (particle.y - minimumY) / Math.max(maximumY - minimumY, 0.0001),
      0,
      1,
    );
    const verticalTaper = 0.68 + 0.32
      * smoothstep(0, 0.18, verticalProgress)
      * (1 - smoothstep(0.82, 1, verticalProgress));
    const shimmer = 0.88 + Math.sin(time * 0.00072 + particle.driftPhase) * 0.12;
    const opacity = particle.opacity * fadeIn * fadeOut * verticalTaper * shimmer * qualityAlpha;
    if (opacity <= 0.001) continue;

    projectAtDepth(
      parallax,
      x,
      y,
      particle.depthProfile,
      scene.projection,
    );

    const spriteScale = particle.spriteIndex === 1 ? 5.4 : particle.spriteIndex === 0 ? 4 : 3.8;
    const spriteSize = particle.size * spriteScale;
    if (!isProjectedVisible(scene, spriteSize * particle.depthScale, spriteSize * particle.depthScale)) continue;
    const rotation = particle.rotation
      + time * 0.001 * particle.rotationSpeed * scene.motionScale
      + Math.sin(turbulenceTime * 0.7) * 0.12;
    const depthTilt = clamp(particle.depthProfile.tilt, 0, 1);
    const pitch = -parallax.positionY * parallax.maximumPitch * depthTilt;
    const yaw = parallax.positionX * parallax.maximumYaw * depthTilt;
    const depthScale = scene.projection.scale * particle.depthScale;
    setSpriteTransform(context, scene, rotation, pitch, yaw, depthScale, depthScale);
    context.globalAlpha = opacity * scene.projection.alphaScale;
    context.drawImage(
      sprites[particle.spriteIndex],
      -spriteSize * 0.5,
      -spriteSize * 0.5,
      spriteSize,
      spriteSize,
    );
  }
  context.restore();
}

function drawParticles(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  sprites: AtmosphericParticleSprites,
  parallax: ParallaxFrame,
  quality: AdaptiveQuality,
) {
  const margin = 24;
  const span = scene.width + margin * 2;
  context.save();
  for (const particle of scene.particles) {
    const qualityAlpha = qualityOpacity(particle.qualityRank, quality.particleWeights);
    if (qualityAlpha <= 0.001) continue;
    const x = -margin + positiveModulo(
      particle.x + margin + particle.speed * time * 0.001
        + Math.sin(time * 0.00013 + particle.phase) * particle.drift, span);
    const y = particle.y + Math.cos(time * 0.00011 + particle.phase) * particle.drift * 0.6;
    projectAtDepth(parallax, x, y, particle.depthProfile, scene.projection);
    const size = particle.size * scene.projection.scale;
    const spriteSize = size * 8;
    if (!isProjectedVisible(scene, spriteSize, spriteSize)) continue;
    const shimmer = 0.68 + Math.sin(time * 0.0011 + particle.phase) * 0.2;
    const opacity = shimmer * scene.projection.alphaScale * qualityAlpha;
    if (opacity <= 0.001) continue;
    context.globalAlpha = opacity;
    context.drawImage(sprites.atlas, particle.colorIndex * 64, 0, 64, 64,
      scene.projection.x - spriteSize * 0.5, scene.projection.y - spriteSize * 0.5,
      spriteSize, spriteSize);
  }
  context.restore();
}

function drawEdgeGlow(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: AtmosphericWashSprites,
  planes: FramePlanes,
) {
  const shortSide = Math.min(scene.width, scene.height);
  drawRadialWash(context, tintWash(washes.edge, activeColor, planes.tintScratch),
    getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.nearHaze.translation),
    scene.height + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.nearHaze.translation),
    shortSide * 0.9);
  drawRadialWash(context, washes.cyan,
    scene.width + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation),
    getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation), shortSide * 0.72);
}

function preparePlane(plane: CachedPlane, scene: AtmosphericScene, clear: boolean) {
  const { context, canvas } = plane;
  context.setTransform(canvas.width / scene.width, 0, 0, canvas.height / scene.height, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  if (clear) context.clearRect(0, 0, scene.width, scene.height);
}

function updateFramePlanes(
  planes: FramePlanes,
  scene: AtmosphericScene,
  sprites: AtmosphericSprites,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  const colorChanged = !planes.valid
    || planes.color[0] !== activeColor[0]
    || planes.color[1] !== activeColor[1]
    || planes.color[2] !== activeColor[2];
  const cameraChanged = !planes.valid
    || planes.cameraX !== parallax.positionX || planes.cameraY !== parallax.positionY;
  if (!colorChanged && !cameraChanged) return;
  preparePlane(planes.sky, scene, false);
  drawSky(planes.sky.context, scene, sprites.washes.sky);
  drawAtmosphericWash(planes.sky.context, scene, activeColor, parallax, sprites.washes, planes);
  preparePlane(planes.edge, scene, true);
  drawEdgeGlow(planes.edge.context, scene, activeColor, parallax, sprites.washes, planes);
  preparePlane(planes.tint, scene, true);
  drawForegroundGlowTint(planes.tint.context, scene, activeColor, parallax, sprites.washes, planes);
  if (colorChanged) {
    const particleTint = sprites.particles.tint;
    const red = COOL_PARTICLE[0] + (activeColor[0] - COOL_PARTICLE[0]) * 0.18;
    const green = COOL_PARTICLE[1] + (activeColor[1] - COOL_PARTICLE[1]) * 0.18;
    const blue = COOL_PARTICLE[2] + (activeColor[2] - COOL_PARTICLE[2]) * 0.18;
    if (particleTint[0] !== red || particleTint[1] !== green || particleTint[2] !== blue) {
      particleTint[0] = red;
      particleTint[1] = green;
      particleTint[2] = blue;
      paintAtmosphericParticleCell(sprites.particles.context, 2, particleTint);
    }
    planes.color[0] = activeColor[0];
    planes.color[1] = activeColor[1];
    planes.color[2] = activeColor[2];
  }
  planes.cameraX = parallax.positionX;
  planes.cameraY = parallax.positionY;
  planes.valid = true;
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: AtmosphericSprites,
  time: number,
  activeColor: Rgb,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  planes: FramePlanes,
  quality: AdaptiveQuality,
) {
  const motionTime = reducedMotion ? 0 : time;
  updateFramePlanes(planes, scene, sprites, activeColor, parallax);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  // The opaque sky replaces clearing; one CSS pixel of overscan covers DPR seams.
  context.drawImage(planes.sky.canvas, -1, -1, scene.width + 2, scene.height + 2);
  drawSun(context, scene, sprites, parallax);
  drawRiverGlow(context, scene, motionTime, parallax, sprites.washes);
  drawHaze(context, scene, motionTime, 'far', parallax);
  drawClouds(context, scene, motionTime, 'far', parallax);
  drawDistantHills(context, scene, parallax);
  drawRisingRiverFragments(
    context,
    scene,
    sprites.risingRiverFragments,
    motionTime,
    parallax,
  );
  drawHaze(context, scene, motionTime, 'middle', parallax);
  drawClouds(context, scene, motionTime, 'middle', parallax);
  drawRisingRiverFogPatches(
    context,
    scene,
    sprites.risingRiverFogPatches,
    motionTime,
    parallax,
  );
  drawRisingRiverGlows(context, scene, sprites.risingRiverGlows, motionTime, parallax);
  drawRiverLightMotes(context, scene, sprites.riverLightMotes, motionTime, parallax);
  drawRiverParticles(context, scene, sprites.riverParticles, motionTime, parallax, quality);
  drawParticles(context, scene, motionTime, sprites.particles, parallax, quality);
  drawHaze(context, scene, motionTime, 'near', parallax);
  drawClouds(context, scene, motionTime, 'foreground', parallax);
  context.globalAlpha = 1;
  context.drawImage(planes.edge.canvas, 0, 0, scene.width, scene.height);
  drawForegroundTrees(context, scene, parallax);
  context.globalCompositeOperation = 'color';
  context.drawImage(planes.tint.canvas, 0, 0, scene.width, scene.height);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
}

export default function RenderLightMode({
  activeColor,
  session,
  deviceOrientationSession,
}: RenderLightModeProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetColorRef = useRef<Rgb>([...DEFAULT_ACTIVE_COLOR]);
  const redrawStaticSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetColorRef.current = resolveActiveColor(activeColor);
    redrawStaticSceneRef.current?.();
  }, [activeColor]);

  useEffect(() => {
    const background = backgroundRef.current;
    const canvas = canvasRef.current;
    if (!background || !canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const sprites = getAtmosphericSprites();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const parallaxPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const deviceOrientationConstructor = (
      window as typeof window & { DeviceOrientationEvent?: DeviceOrientationEventConstructor }
    ).DeviceOrientationEvent;
    const snapshotCandidate = session.readSnapshot();
    const restoredSnapshot = snapshotCandidate
      && snapshotCandidate.version === RENDERER_SNAPSHOT_VERSION
      && Number.isFinite(snapshotCandidate.capturedAtMs)
      && Number.isFinite(snapshotCandidate.sceneTimeMs)
      && snapshotCandidate.sceneTimeMs >= 0
      && Number.isFinite(snapshotCandidate.color.transitionElapsedMs)
      && snapshotCandidate.color.transitionElapsedMs >= 0
      && isRendererRgbSnapshot(snapshotCandidate.color.current)
      && isRendererRgbSnapshot(snapshotCandidate.color.from)
      && isRendererRgbSnapshot(snapshotCandidate.color.target)
      && isRendererCameraSnapshot(snapshotCandidate.camera)
      ? snapshotCandidate
      : null;
    const restoreTimestamp = Date.now();
    const inactiveElapsed = restoredSnapshot
      ? Math.max(0, restoreTimestamp - restoredSnapshot.capturedAtMs)
      : 0;
    const restoreRgb = (color: readonly number[]): Rgb => [
      clamp(color[0], 0, 255),
      clamp(color[1], 0, 255),
      clamp(color[2], 0, 255),
    ];
    const restoredTransitionElapsed = restoredSnapshot
      ? clamp(
          restoredSnapshot.color.transitionElapsedMs + inactiveElapsed,
          0,
          SECTION_COLOR_DURATION_MS,
        )
      : 0;
    const restoredTransitionProgress = restoredTransitionElapsed
      / SECTION_COLOR_DURATION_MS;
    const restoredTransitionEase = 1 - (1 - restoredTransitionProgress) ** 3;
    const restoredFromColor = restoredSnapshot
      ? restoreRgb(restoredSnapshot.color.from)
      : [...targetColorRef.current] as Rgb;
    const restoredTargetColor = restoredSnapshot
      ? restoreRgb(restoredSnapshot.color.target)
      : [...targetColorRef.current] as Rgb;
    const caughtUpColor: Rgb = restoredSnapshot
      ? [
          restoredFromColor[0]
            + (restoredTargetColor[0] - restoredFromColor[0]) * restoredTransitionEase,
          restoredFromColor[1]
            + (restoredTargetColor[1] - restoredFromColor[1]) * restoredTransitionEase,
          restoredFromColor[2]
            + (restoredTargetColor[2] - restoredFromColor[2]) * restoredTransitionEase,
        ]
      : [...targetColorRef.current] as Rgb;
    const restoredTargetIsCurrent = restoredSnapshot
      && targetColorRef.current.every(
        (channel, index) => Math.abs(channel - restoredTargetColor[index]) <= 0.01,
      );
    let disposed = false;
    let scene: AtmosphericScene | null = null;
    let planes: FramePlanes | null = null;
    let sceneCoarsePointer = coarsePointer.matches;
    const quality = createAdaptiveQuality(performance.now());
    let animationFrame = 0;
    let resizeFrame = 0;
    let resizePendingWhileHidden = false;
    let lastPaintTime = 0;
    let lastDeliveredPaintTime = 0;
    let previousAnimationTime = 0;
    let refreshInterval = 1000 / 60;
    let previousTime = performance.now();
    let sceneTime = restoredSnapshot
      ? restoredSnapshot.sceneTimeMs + inactiveElapsed
      : 0;
    let reducedMotion = motionPreference.matches;
    const canRestorePointerCamera = !reducedMotion && parallaxPointer.matches;
    const canRestoreTiltCamera = !reducedMotion
      && coarsePointer.matches
      && !parallaxPointer.matches;
    let targetParallaxX = canRestorePointerCamera && restoredSnapshot
      ? clamp(restoredSnapshot.camera.targetX, -1, 1)
      : 0;
    let targetParallaxY = canRestorePointerCamera && restoredSnapshot
      ? clamp(restoredSnapshot.camera.targetY, -1, 1)
      : 0;
    let currentParallaxX = (canRestorePointerCamera || canRestoreTiltCamera)
      && restoredSnapshot
      ? clamp(restoredSnapshot.camera.currentX, -1, 1)
      : 0;
    let currentParallaxY = (canRestorePointerCamera || canRestoreTiltCamera)
      && restoredSnapshot
      ? clamp(restoredSnapshot.camera.currentY, -1, 1)
      : 0;
    let deviceTiltListening = false;
    let deviceTiltBaselineX: number | null = null;
    let deviceTiltBaselineY: number | null = null;
    let tiltPermissionGestureArmed = false;
    let observedPermissionRequest: Promise<'granted' | 'denied'> | null = null;
    const sharedOrientationStatus = deviceOrientationSession.getStatus();
    let deviceOrientationPermission: DeviceOrientationPermissionState =
      !deviceOrientationConstructor
        ? 'unavailable'
        : typeof deviceOrientationConstructor.requestPermission === 'function'
          ? sharedOrientationStatus === 'granted'
            || sharedOrientationStatus === 'denied'
            || sharedOrientationStatus === 'requesting'
            ? sharedOrientationStatus
            : 'prompt'
          : 'granted';
    const currentColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : caughtUpColor;
    const transitionFromColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : restoredTargetIsCurrent
        ? restoredFromColor
        : [...caughtUpColor];
    const transitionTargetColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : restoredTargetIsCurrent
        ? restoredTargetColor
        : [...targetColorRef.current];
    let colorTransitionStart = reducedMotion
      ? sceneTime
      : restoredTargetIsCurrent
        ? sceneTime - restoredTransitionElapsed
        : sceneTime;

    const resetDeviceTiltCalibration = () => {
      deviceTiltBaselineX = null;
      deviceTiltBaselineY = null;
      if (!parallaxPointer.matches) {
        targetParallaxX = 0;
        targetParallaxY = 0;
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (
        disposed
        || reducedMotion
        || document.hidden
        || parallaxPointer.matches
        || !coarsePointer.matches
        || event.beta === null
        || event.gamma === null
      ) {
        return;
      }
      const tilt = getScreenRelativeDeviceTilt(event.beta, event.gamma);
      if (deviceTiltBaselineX === null || deviceTiltBaselineY === null) {
        deviceTiltBaselineX = tilt.x;
        deviceTiltBaselineY = tilt.y;
        targetParallaxX = 0;
        targetParallaxY = 0;
        return;
      }
      targetParallaxX = normalizeDeviceTilt(
        getShortestAngleDelta(tilt.x, deviceTiltBaselineX),
        DEVICE_TILT_RANGE_X,
      );
      targetParallaxY = normalizeDeviceTilt(
        getShortestAngleDelta(tilt.y, deviceTiltBaselineY),
        DEVICE_TILT_RANGE_Y,
      );
    };

    const startDeviceTilt = () => {
      if (
        disposed
        || deviceTiltListening
        || deviceOrientationPermission !== 'granted'
        || reducedMotion
        || document.hidden
        || parallaxPointer.matches
        || !coarsePointer.matches
      ) {
        return;
      }
      resetDeviceTiltCalibration();
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
      deviceTiltListening = true;
    };

    const stopDeviceTilt = () => {
      if (deviceTiltListening) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        deviceTiltListening = false;
      }
      resetDeviceTiltCalibration();
    };

    const observePermissionRequest = (
      request: Promise<'granted' | 'denied'>,
    ) => {
      if (observedPermissionRequest === request) return;
      observedPermissionRequest = request;
      void request.then((permission) => {
        if (disposed) return;
        deviceOrientationPermission = permission;
        if (permission === 'granted') startDeviceTilt();
      });
    };

    const handleTiltPermissionGesture = () => {
      if (
        disposed
        || deviceOrientationPermission !== 'prompt'
        || !deviceOrientationConstructor?.requestPermission
      ) {
        return;
      }
      tiltPermissionGestureArmed = false;
      window.removeEventListener('pointerdown', handleTiltPermissionGesture);
      deviceOrientationPermission = 'requesting';
      observePermissionRequest(deviceOrientationSession.requestPermission(
        () => deviceOrientationConstructor.requestPermission!(),
      ));
    };

    const armTiltPermissionGesture = () => {
      if (
        disposed
        || tiltPermissionGestureArmed
        || deviceOrientationPermission !== 'prompt'
      ) {
        return;
      }
      window.addEventListener('pointerdown', handleTiltPermissionGesture, { passive: true });
      tiltPermissionGestureArmed = true;
    };

    const disarmTiltPermissionGesture = () => {
      if (!tiltPermissionGestureArmed) return;
      window.removeEventListener('pointerdown', handleTiltPermissionGesture);
      tiltPermissionGestureArmed = false;
    };

    const configureDeviceTilt = () => {
      const shouldUseDeviceTilt = Boolean(deviceOrientationConstructor)
        && coarsePointer.matches
        && !parallaxPointer.matches
        && !reducedMotion
        && !document.hidden;
      if (!shouldUseDeviceTilt) {
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        return;
      }
      if (deviceOrientationPermission === 'granted') {
        disarmTiltPermissionGesture();
        startDeviceTilt();
      } else if (deviceOrientationPermission === 'prompt') {
        armTiltPermissionGesture();
      } else if (deviceOrientationPermission === 'requesting') {
        const pendingRequest = deviceOrientationSession.getPendingRequest();
        if (pendingRequest) {
          observePermissionRequest(pendingRequest);
        } else {
          deviceOrientationSession.recoverOrphanedRequest();
          deviceOrientationPermission = 'prompt';
          armTiltPermissionGesture();
        }
      }
    };

    const updateColor = () => {
      const target = targetColorRef.current;
      const targetChanged = Math.abs(target[0] - transitionTargetColor[0]) > 0.01
        || Math.abs(target[1] - transitionTargetColor[1]) > 0.01
        || Math.abs(target[2] - transitionTargetColor[2]) > 0.01;
      if (targetChanged) {
        for (let index = 0; index < 3; index += 1) {
          transitionFromColor[index] = currentColor[index];
          transitionTargetColor[index] = target[index];
        }
        colorTransitionStart = sceneTime;
      }
      if (reducedMotion) {
        for (let index = 0; index < 3; index += 1) currentColor[index] = target[index];
        return;
      }
      const progress = clamp(
        (sceneTime - colorTransitionStart) / SECTION_COLOR_DURATION_MS,
        0,
        1,
      );
      const eased = 1 - (1 - progress) ** 3;
      for (let index = 0; index < 3; index += 1) {
        currentColor[index] = transitionFromColor[index]
          + (transitionTargetColor[index] - transitionFromColor[index]) * eased;
      }
    };

    const paint = (time: number, scheduledElapsed = 0, frameInterval = 0) => {
      if (!scene || !planes || disposed || document.hidden) return;
      const elapsed = reducedMotion ? 0 : clamp(time - previousTime, 0, 64);
      previousTime = time;
      if (!reducedMotion) sceneTime += elapsed;
      updateColor();
      if (
        reducedMotion
        || (!parallaxPointer.matches && !deviceTiltListening)
      ) {
        currentParallaxX = 0;
        currentParallaxY = 0;
      } else {
        const ease = 1 - Math.exp(-elapsed / PARALLAX_EASE_MS);
        currentParallaxX += (targetParallaxX - currentParallaxX) * ease;
        currentParallaxY += (targetParallaxY - currentParallaxY) * ease;
        if (Math.abs(targetParallaxX - currentParallaxX) < 0.00001) currentParallaxX = targetParallaxX;
        if (Math.abs(targetParallaxY - currentParallaxY) < 0.00001) currentParallaxY = targetParallaxY;
      }
      if (!reducedMotion) updateQualityWeights(quality, elapsed);
      const paintStart = performance.now();
      drawScene(
        context,
        scene,
        sprites,
        sceneTime,
        currentColor,
        reducedMotion,
        createParallaxFrame(scene, currentParallaxX, currentParallaxY),
        planes,
        quality,
      );
      if (!reducedMotion && frameInterval > 0) {
        recordQualityPaint(quality, time, performance.now() - paintStart, scheduledElapsed, frameInterval);
      }
    };

    const animate = (time: number) => {
      if (disposed || reducedMotion || document.hidden) return;
      const refreshElapsed = time - previousAnimationTime;
      previousAnimationTime = time;
      if (refreshElapsed >= 4 && refreshElapsed <= 25) {
        refreshInterval += (refreshElapsed - refreshInterval) * 0.1;
      }
      const profile = QUALITY_PROFILES[quality.tier];
      const frameInterval = 1000 / (coarsePointer.matches || window.innerWidth < 720
        ? profile.mobileFps : profile.desktopFps);
      const sinceLastPaint = time - lastPaintTime;
      // A small tolerance avoids halving delivery at nominal 60 Hz due to
      // fractional RAF timestamps. Keep the schedule phase, not paint duration.
      if (lastPaintTime === 0 || sinceLastPaint >= frameInterval - 0.25) {
        const deliveredElapsed = lastDeliveredPaintTime === 0
          ? frameInterval : time - lastDeliveredPaintTime;
        // Capped 45/27 FPS schedules naturally alternate vsync gaps. Discount
        // one refresh of quantization rather than treating those gaps as load.
        const scheduledElapsed = frameInterval + Math.max(
          0, deliveredElapsed - frameInterval - refreshInterval,
        );
        lastPaintTime = lastPaintTime === 0 ? time
          : lastPaintTime + Math.max(1, Math.floor((sinceLastPaint + 0.25) / frameInterval)) * frameInterval;
        lastDeliveredPaintTime = time;
        paint(time, scheduledElapsed, frameInterval);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousTime = performance.now();
      lastPaintTime = 0;
      lastDeliveredPaintTime = 0;
      previousAnimationTime = 0;
      if (disposed || document.hidden) return;
      if (reducedMotion) {
        paint(previousTime);
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      if (disposed) return;
      if (document.hidden) {
        resizePendingWhileHidden = true;
        return;
      }
      resizePendingWhileHidden = false;
      const width = Math.max(1, Math.round(background.clientWidth));
      const height = Math.max(1, Math.round(background.clientHeight));
      const dprLimit = coarsePointer.matches ? 1.25 : 1.5;
      const maxBackingPixels = coarsePointer.matches ? 3_000_000 : 6_000_000;
      const pixelBudgetRatio = Math.sqrt(maxBackingPixels / (width * height));
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit, pixelBudgetRatio);
      const backingWidth = Math.max(1, Math.round(width * dpr));
      const backingHeight = Math.max(1, Math.round(height * dpr));
      const geometryChanged = !scene || scene.width !== width || scene.height !== height
        || sceneCoarsePointer !== coarsePointer.matches;
      const backingChanged = canvas.width !== backingWidth || canvas.height !== backingHeight
        || scene?.pixelRatio !== dpr;
      if (!geometryChanged && !backingChanged) return;
      if (backingChanged) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (geometryChanged) {
        disposeFramePlanes(planes);
        planes = createFramePlanes(width, height);
        scene = createScene(width, height, coarsePointer.matches, sprites);
        sceneCoarsePointer = coarsePointer.matches;
      }
      if (scene) scene.pixelRatio = dpr;
      resetQualityMeasurements(quality, performance.now());
      lastPaintTime = lastDeliveredPaintTime = 0;
      paint(performance.now());
    };

    const scheduleResize = () => {
      if (disposed) return;
      if (document.hidden) {
        resizePendingWhileHidden = true;
        return;
      }
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    // ResizeObserver does not fire when only display density changes.
    // Re-arm the exact-resolution query without retaining obsolete listeners.
    let resolutionPreference = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    );
    const handleResolutionChange = () => {
      if (disposed) return;
      resolutionPreference.removeEventListener('change', handleResolutionChange);
      resolutionPreference = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      resolutionPreference.addEventListener('change', handleResolutionChange);
      scheduleResize();
    };

    const resetParallax = () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        reducedMotion
        || document.hidden
        || !parallaxPointer.matches
        || event.pointerType === 'touch'
      ) {
        return;
      }
      targetParallaxX = clamp(event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, -1, 1);
      targetParallaxY = clamp(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1, -1, 1);
    };

    const handleParallaxCapabilityChange = () => {
      resetParallax();
      configureDeviceTilt();
    };

    const handleCoarsePointerChange = () => {
      resetParallax();
      configureDeviceTilt();
      scheduleResize();
    };

    const handleScreenOrientationChange = () => {
      resetDeviceTiltCalibration();
    };

    const handleWindowBlur = () => {
      resetParallax();
      resetDeviceTiltCalibration();
    };

    const handleMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      quality.tier = 0;
      quality.triangleWeights.fill(1);
      quality.particleWeights.fill(1);
      resetQualityMeasurements(quality, performance.now());
      resetParallax();
      currentParallaxX = 0;
      currentParallaxY = 0;
      if (reducedMotion) {
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        for (let index = 0; index < 3; index += 1) {
          currentColor[index] = targetColorRef.current[index];
          transitionFromColor[index] = targetColorRef.current[index];
          transitionTargetColor[index] = targetColorRef.current[index];
        }
      }
      configureDeviceTilt();
      startAnimation();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        currentParallaxX = 0;
        currentParallaxY = 0;
        resetParallax();
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        return;
      }
      previousTime = performance.now();
      lastPaintTime = 0;
      lastDeliveredPaintTime = 0;
      resetQualityMeasurements(quality, previousTime);
      const appliedPendingResize = resizePendingWhileHidden;
      if (appliedPendingResize) resize();
      configureDeviceTilt();
      if (!reducedMotion || !appliedPendingResize) startAnimation();
    };

    redrawStaticSceneRef.current = () => {
      if (!reducedMotion || document.hidden || disposed) return;
      for (let index = 0; index < 3; index += 1) {
        currentColor[index] = targetColorRef.current[index];
        transitionFromColor[index] = targetColorRef.current[index];
        transitionTargetColor[index] = targetColorRef.current[index];
      }
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(background);
    motionPreference.addEventListener('change', handleMotionPreference);
    parallaxPointer.addEventListener('change', handleParallaxCapabilityChange);
    coarsePointer.addEventListener('change', handleCoarsePointerChange);
    resolutionPreference.addEventListener('change', handleResolutionChange);
    window.screen.orientation?.addEventListener('change', handleScreenOrientationChange);
    window.addEventListener('orientationchange', handleScreenOrientationChange);
    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', handleWindowBlur);
    document.documentElement.addEventListener('pointerleave', resetParallax);
    document.addEventListener('visibilitychange', handleVisibility);
    configureDeviceTilt();
    resize();
    if (!reducedMotion) startAnimation();

    return () => {
      session.writeSnapshot({
        version: RENDERER_SNAPSHOT_VERSION,
        capturedAtMs: Date.now(),
        sceneTimeMs: Math.max(0, sceneTime),
        color: {
          current: cloneRendererRgb(currentColor),
          from: cloneRendererRgb(transitionFromColor),
          target: cloneRendererRgb(transitionTargetColor),
          transitionElapsedMs: clamp(
            sceneTime - colorTransitionStart,
            0,
            SECTION_COLOR_DURATION_MS,
          ),
        },
        camera: {
          currentX: clamp(currentParallaxX, -1, 1),
          currentY: clamp(currentParallaxY, -1, 1),
          targetX: clamp(targetParallaxX, -1, 1),
          targetY: clamp(targetParallaxY, -1, 1),
        },
      });
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      motionPreference.removeEventListener('change', handleMotionPreference);
      parallaxPointer.removeEventListener('change', handleParallaxCapabilityChange);
      coarsePointer.removeEventListener('change', handleCoarsePointerChange);
      resolutionPreference.removeEventListener('change', handleResolutionChange);
      window.screen.orientation?.removeEventListener('change', handleScreenOrientationChange);
      window.removeEventListener('orientationchange', handleScreenOrientationChange);
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', handleWindowBlur);
      document.documentElement.removeEventListener('pointerleave', resetParallax);
      document.removeEventListener('visibilitychange', handleVisibility);
      disarmTiltPermissionGesture();
      stopDeviceTilt();
      redrawStaticSceneRef.current = null;
      disposeFramePlanes(planes);
      planes = null;
      scene = null;
      canvas.width = canvas.height = 0;
    };
  }, [deviceOrientationSession, session]);

  return (
    <div ref={backgroundRef} className="ambient-background light-atmosphere" aria-hidden="true">
      <canvas ref={canvasRef} className="light-atmosphere-canvas" aria-hidden="true" />
    </div>
  );
}
