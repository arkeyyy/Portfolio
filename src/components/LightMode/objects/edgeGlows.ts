import type { FramePlanes } from '../core/framePlanes';
import type { ParallaxFrame, ProjectionViewport, Rgb } from '../core/contracts';
import {
  createRadialWashSprite,
  drawRadialWash,
  mixRgbInto,
} from '../core/colorCanvas';
import { tintWash } from '../core/framePlanes';
import {
  getParallaxOffsetX,
  getParallaxOffsetY,
  projectAtDepth,
} from '../core/parallax';
import { LIGHT_DEPTH_PROFILES, SKY_CYAN } from '../core/theme';

export type EdgeGlowSprites = {
  edge: HTMLCanvasElement;
  cyan: HTMLCanvasElement;
  tint: HTMLCanvasElement;
  goldCore: HTMLCanvasElement;
};

const FOREGROUND_GLOW_GOLD: Rgb = [239, 188, 128];

export function createEdgeGlowSprites(): EdgeGlowSprites {
  const white: Rgb = [255, 255, 255];
  return {
    edge: createRadialWashSprite(white, [[0, 0.06], [0.62, 0.02], [1, 0]]),
    cyan: createRadialWashSprite(SKY_CYAN, [[0, 0.045], [1, 0]]),
    tint: createRadialWashSprite(white, [[0, 0.105], [0.48, 0.07], [0.78, 0.015], [1, 0]]),
    goldCore: createRadialWashSprite(FOREGROUND_GLOW_GOLD, [[0, 0.04], [0.5, 0.016], [1, 0]]),
  };
}

function drawForegroundGlowTint(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: EdgeGlowSprites,
  planes: FramePlanes,
) {
  mixRgbInto(FOREGROUND_GLOW_GOLD, activeColor, 0.52, planes.foregroundColor);
  projectAtDepth(parallax, scene.width * 1.06, scene.height * 0.8,
    LIGHT_DEPTH_PROFILES.foregroundTrees, scene.projection);
  const radius = Math.max(scene.width * 0.72, scene.height * 0.78);
  drawRadialWash(context, tintWash(washes.tint, planes.foregroundColor, planes.tintScratch),
    scene.projection.x, scene.projection.y, radius);
  drawRadialWash(context, washes.goldCore,
    scene.projection.x, scene.projection.y, radius * 0.58);
}

function drawEdgeGlow(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: EdgeGlowSprites,
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

export { drawEdgeGlow, drawForegroundGlowTint };

