import type { ConstellationHazePalette, Rgb } from '../core/contracts';
import { clamp } from '../core/math';
import {
  createConstellationSprites,
} from './constellationShared';
import type {
  Constellation,
  ConstellationNodeSpec,
  ConstellationSprites,
} from './constellationShared';

const LIBRA_BLUE: Rgb = [94, 205, 255];
const LIBRA_GREEN: Rgb = [80, 231, 181];
const LIBRA_WHITE: Rgb = [250, 253, 255];
const LIBRA_LINE: Rgb = [155, 220, 248];
const LIBRA_HAZE_SCALE = { width: 3.05, height: 2.05 } as const;
const LIBRA_HAZE_PALETTE: ConstellationHazePalette = [
  [72, 142, 184],
  [76, 82, 148],
  [68, 128, 132],
  [74, 160, 132],
];
const LIBRA_NODES: readonly ConstellationNodeSpec[] = [
  { x: 0.5, y: 0.03, scale: 0.86, phase: 0.4, twinkleSpeed: 0.00112, colorIndex: 0 },
  { x: 0.33, y: 0.31, scale: 0.72, phase: 2.1, twinkleSpeed: 0.00136, colorIndex: 1 },
  { x: 0.19, y: 0.38, scale: 0.76, phase: 4.7, twinkleSpeed: 0.00102, colorIndex: 0 },
  { x: 0.02, y: 0.46, scale: 1.05, phase: 1.35, twinkleSpeed: 0.00124, colorIndex: 0 },
  { x: 0.98, y: 0.26, scale: 1.16, phase: 3.25, twinkleSpeed: 0.00108, colorIndex: 1 },
  { x: 0.9, y: 0.73, scale: 0.88, phase: 5.35, twinkleSpeed: 0.00131, colorIndex: 0 },
  { x: 0.53, y: 0.9, scale: 0.96, phase: 2.9, twinkleSpeed: 0.00117, colorIndex: 1 },
  { x: 0.53, y: 0.99, scale: 0.7, phase: 0.9, twinkleSpeed: 0.00143, colorIndex: 0 },
];
const LIBRA_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [0, 5],
  [4, 5],
  [5, 6],
  [6, 7],
];

export function createLibraSprites() {
  return createConstellationSprites(
    LIBRA_NODES,
    LIBRA_EDGES,
    LIBRA_BLUE,
    LIBRA_GREEN,
    LIBRA_LINE,
    LIBRA_WHITE,
    LIBRA_HAZE_PALETTE,
    0,
  );
}

export function createLibra(
  width: number,
  height: number,
  compact: boolean,
  sprites: ConstellationSprites,
): Constellation {
  const libraWidth = compact
    ? clamp(width * 0.34, 118, 150)
    : clamp(width * 0.12, 145, 190);
  return {
    centerX: width * (compact ? 0.24 : 0.17),
    centerY: height * (compact ? 0.26 : 0.245),
    width: libraWidth,
    height: libraWidth * (compact ? 1.05 : 1.08),
    rotation: compact ? -0.04 : -0.055,
    phase: 3.35,
    motionScale: 1,
    hazeScale: LIBRA_HAZE_SCALE,
    starSizing: { ratio: 0.22, compactMin: 26, min: 32, max: 46 },
    nodes: LIBRA_NODES,
    sprites,
  };
}
