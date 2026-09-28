import type { AtmosphericDepthProfile, Rgb } from './contracts';

const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const SKY_CYAN: Rgb = [114, 199, 232];
const FOREGROUND_FOG_CYAN: Rgb = [92, 196, 238];
const SKY_LAVENDER: Rgb = [187, 179, 174];
const RIVER_LIGHT_BLUE: Rgb = [157, 205, 214];

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

export {
  DEFAULT_ACTIVE_COLOR,
  SKY_CYAN,
  FOREGROUND_FOG_CYAN,
  SKY_LAVENDER,
  RIVER_LIGHT_BLUE,
  LIGHT_DEPTH_PROFILES,
  PARTICLE_DEPTH_RANGE,
};

