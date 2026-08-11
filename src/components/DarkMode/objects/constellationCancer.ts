import type { ConstellationHazePalette, Rgb } from '../core/contracts';
import { clamp } from '../core/math';
import { createConstellationSprites } from './constellationShared';
import type {
  Constellation,
  ConstellationNodeSpec,
  ConstellationSprites,
} from './constellationShared';

const CANCER_PINK: Rgb = [255, 139, 218];
const CANCER_PURPLE: Rgb = [187, 119, 255];
const CANCER_WHITE: Rgb = [252, 248, 255];
const CANCER_LINE: Rgb = [225, 172, 245];
const CANCER_HAZE_SCALE = { width: 3.4, height: 2.25 } as const;
const CANCER_HAZE_PALETTE: ConstellationHazePalette = [
  [145, 72, 129],
  [71, 68, 133],
  [99, 74, 153],
  [176, 76, 149],
];
const CANCER_NODES: readonly ConstellationNodeSpec[] = [
  { x: 0.4, y: 0.06, scale: 0.84, phase: 1.2, twinkleSpeed: 0.00088, colorIndex: 1 },
  { x: 0.44, y: 0.39, scale: 0.65, phase: 4.1, twinkleSpeed: 0.00102, colorIndex: 0 },
  { x: 0.42, y: 0.54, scale: 0.88, phase: 2.45, twinkleSpeed: 0.00094, colorIndex: 0 },
  { x: 0.28, y: 0.82, scale: 0.76, phase: 5.5, twinkleSpeed: 0.00108, colorIndex: 1 },
  { x: 0.72, y: 0.94, scale: 1, phase: 0.35, twinkleSpeed: 0.00082, colorIndex: 0 },
];
const CANCER_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 4],
];

export function createCancerSprites() {
  return createConstellationSprites(
    CANCER_NODES,
    CANCER_EDGES,
    CANCER_PINK,
    CANCER_PURPLE,
    CANCER_LINE,
    CANCER_WHITE,
    CANCER_HAZE_PALETTE,
    8_700,
  );
}

export function createCancer(
  width: number,
  height: number,
  compact: boolean,
  sprites: ConstellationSprites,
): Constellation {
  const cancerWidth = compact
    ? clamp(width * 0.275, 88, 110)
    : clamp(width * 0.092, 110, 144);
  return {
    centerX: compact ? width * 0.8 : width - cancerWidth * 0.68,
    centerY: height * (compact ? 0.51 : 0.49),
    width: cancerWidth,
    height: cancerWidth * 1.08,
    rotation: compact ? 0.045 : 0.06,
    phase: 5.15,
    motionScale: 0.58,
    hazeScale: CANCER_HAZE_SCALE,
    starSizing: { ratio: 0.2, compactMin: 18, min: 22, max: 30 },
    nodes: CANCER_NODES,
    sprites,
  };
}
