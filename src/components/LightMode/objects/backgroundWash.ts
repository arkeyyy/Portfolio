import type { FramePlanes } from '../core/framePlanes';
import type { ParallaxFrame, ProjectionViewport, Rgb } from '../core/contracts';
import { createRadialWashSprite, drawRadialWash, mixRgbInto } from '../core/colorCanvas';
import { getParallaxOffsetX, getParallaxOffsetY } from '../core/parallax';
import { LIGHT_DEPTH_PROFILES, SKY_LAVENDER } from '../core/theme';
import { tintWash } from '../core/framePlanes';

export type BackgroundWashSprites = {
  sky: HTMLCanvasElement;
  lavender: HTMLCanvasElement;
  right: HTMLCanvasElement;
  lowerRight: HTMLCanvasElement;
  accent: HTMLCanvasElement;
};

const RIGHT_GLOW_GOLD: Rgb = [255, 235, 196];

export function createBackgroundWashSprites(): BackgroundWashSprites {
  const white: Rgb = [255, 255, 255];
  const sky = document.createElement('canvas');
  sky.width = 128;
  sky.height = 320;
  const context = sky.getContext('2d', { alpha: false })!;
  const gradient = context.createLinearGradient(0, 0, 0, sky.height);
  gradient.addColorStop(0, '#e5e1dc');
  gradient.addColorStop(0.44, '#e9e6dd');
  gradient.addColorStop(0.76, '#e3e2d8');
  gradient.addColorStop(1, '#d8d9cb');
  context.fillStyle = gradient;
  context.fillRect(0, 0, sky.width, sky.height);
  const dawn = context.createLinearGradient(0, sky.height * 0.65, sky.width, sky.height * 0.25);
  dawn.addColorStop(0, 'rgba(190,198,193,0.1)');
  dawn.addColorStop(0.45, 'rgba(247,235,213,0.08)');
  dawn.addColorStop(1, 'rgba(255,240,210,0.82)');
  context.fillStyle = dawn;
  context.fillRect(0, 0, sky.width, sky.height);
  return {
    sky,
    lavender: createRadialWashSprite(SKY_LAVENDER, [[0, 0.055], [1, 0]]),
    right: createRadialWashSprite(white, [[0, 0.11], [0.5, 0.045], [1, 0]]),
    lowerRight: createRadialWashSprite(white, [[0, 0.052], [1, 0]]),
    accent: createRadialWashSprite(white, [[0, 0.085], [0.48, 0.035], [1, 0]]),
  };
}

export function drawSky(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  sprite: HTMLCanvasElement,
) {
  context.drawImage(sprite, 0, 0, scene.width, scene.height);
}

export function drawAtmosphericWash(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  washes: BackgroundWashSprites,
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
}

