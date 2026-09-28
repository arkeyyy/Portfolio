import type { FramePlanes } from '../core/framePlanes';
import type { ParallaxFrame, ProjectionViewport, Rgb } from '../core/contracts';
import { createRadialWashSprite, drawRadialWash } from '../core/colorCanvas';
import { drawDepthImage, projectAtDepth } from '../core/parallax';
import { tintWash } from '../core/framePlanes';
import { LIGHT_DEPTH_PROFILES } from '../core/theme';

type SunState = {
  x: number;
  y: number;
  radius: number;
  glowRadius: number;
};

export type SunSprites = {
  body: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  compactAccent: HTMLCanvasElement;
};

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

export function createSunSprites(): SunSprites {
  const white: Rgb = [255, 255, 255];
  const stops = [[0, 0.038], [0.58, 0.012], [1, 0]] as const;
  return {
    body: createSunSprite(),
    accent: createRadialWashSprite(white, stops, 256, 256, 0.018 / (0.43 * 1.12)),
    compactAccent: createRadialWashSprite(white, stops, 256, 256, 0.018 / (0.36 * 1.12)),
  };
}

export function createSun(width: number, height: number, compact: boolean): SunState {
  const shortSide = Math.min(width, height);
  return {
    x: width * 0.91,
    y: compact ? Math.max(height * 0.2, 120) : height * 0.17,
    radius: shortSide * 0.018,
    glowRadius: shortSide * (compact ? 0.36 : 0.43),
  };
}

type SunScene = ProjectionViewport & { sun: SunState };

export function drawSunAccent(
  context: CanvasRenderingContext2D,
  scene: SunScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
  sprites: SunSprites,
  planes: FramePlanes,
) {
  projectAtDepth(parallax, scene.sun.x, scene.sun.y, LIGHT_DEPTH_PROFILES.sun, scene.projection);
  drawRadialWash(
    context,
    tintWash(scene.compact ? sprites.compactAccent : sprites.accent,
      activeColor, planes.tintScratch),
    scene.projection.x,
    scene.projection.y,
    scene.sun.glowRadius * 1.12,
  );
}

export function drawSun(
  context: CanvasRenderingContext2D,
  scene: SunScene,
  sprites: SunSprites,
  parallax: ParallaxFrame,
) {
  const diameter = scene.sun.glowRadius * 2;
  drawDepthImage(context, scene, sprites.body, scene.sun.x, scene.sun.y,
    diameter, diameter, LIGHT_DEPTH_PROFILES.sun, 0.92, parallax);
}

export type { SunState };

