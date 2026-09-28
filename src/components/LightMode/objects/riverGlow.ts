import type { ParallaxFrame, ProjectionViewport } from '../core/contracts';
import { createRadialWashSprite, mixRgb } from '../core/colorCanvas';
import { positiveModulo, smoothstep } from '../core/math';
import { isProjectedVisible, projectAtDepth } from '../core/parallax';
import { LIGHT_DEPTH_PROFILES, RIVER_LIGHT_BLUE, SKY_CYAN } from '../core/theme';
import { RIVER_GLOW_FLOW_BOUNDARY_X } from './riverShared';

type RiverGlowLobe = Readonly<{
  phase: number;
  halfWidth: number;
  halfHeight: number;
  opacity: number;
  speed: number;
  verticalOffset: number;
}>;
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

export type RiverGlowSprites = {
  bed: HTMLCanvasElement;
  lobe: HTMLCanvasElement;
};

export function createRiverGlowSprites(): RiverGlowSprites {
  const riverColor = mixRgb(RIVER_LIGHT_BLUE, SKY_CYAN, 0.58);
  return {
    bed: createRadialWashSprite(
      riverColor,
      [[0, 0.32], [0.48, 0.14], [0.82, 0.028], [1, 0]],
      512,
      256,
    ),
    lobe: createRadialWashSprite(
      riverColor,
      [[0, 0.52], [0.42, 0.24], [0.76, 0.055], [1, 0]],
      512,
      256,
    ),
  };
}

function drawRiverGlow(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  time: number,
  parallax: ParallaxFrame,
  washes: RiverGlowSprites,
) {
  const centerY = scene.height * (scene.compact ? 0.9 : 0.865);
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
  context.drawImage(washes.bed, scene.projection.x - bedWidth * 0.5,
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
    context.drawImage(washes.lobe, scene.projection.x - width * 0.5,
      scene.projection.y - height * 0.5, width, height);
  }
  context.restore();
}

export { drawRiverGlow };

