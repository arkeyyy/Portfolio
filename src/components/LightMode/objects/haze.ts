import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { featherSprite, rgba } from '../core/colorCanvas';
import { createSeededRandom } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import {
  FOREGROUND_FOG_CYAN,
  LIGHT_DEPTH_PROFILES,
  SKY_CYAN,
  SKY_LAVENDER,
} from '../core/theme';

type HazeLayerKind = 'far' | 'middle' | 'near';
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

export type HazeSprites = {
  cyan: HTMLCanvasElement;
  foregroundCyan: HTMLCanvasElement;
  lavender: HTMLCanvasElement;
};

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

export function createHazeSprites(): HazeSprites {
  return {
    cyan: createHazeSprite(SKY_CYAN, 6311),
    foregroundCyan: createHazeSprite(FOREGROUND_FOG_CYAN, 6311),
    lavender: createHazeSprite(SKY_LAVENDER, 7411),
  };
}

function createHazeLayers(
  width: number,
  height: number,
  sprites: HazeSprites,
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
      opacity: 0.11,
      layer: 'far',
      sprite: sprites.cyan,
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
      opacity: 0.14,
      layer: 'middle',
      sprite: sprites.lavender,
    },
    {
      x: width * 0.14,
      y: height * 0.865,
      width: Math.max(width * 0.68, shortSide * 0.7),
      height: Math.max(height * 0.2, shortSide * 0.2),
      depthProfile: LIGHT_DEPTH_PROFILES.nearHaze,
      phase: 4.8,
      driftX: width * 0.021,
      driftY: height * 0.017,
      opacity: 0.29,
      layer: 'near',
      sprite: sprites.foregroundCyan,
    },
    {
      x: width * 0.42,
      y: height * 0.87,
      width: Math.max(width * 0.54, shortSide * 0.72),
      height: Math.max(height * 0.16, shortSide * 0.19),
      depthProfile: LIGHT_DEPTH_PROFILES.nearHaze,
      phase: 5.9,
      driftX: width * 0.016,
      driftY: height * 0.013,
      opacity: 0.2,
      layer: 'near',
      sprite: sprites.foregroundCyan,
    },
  ];
}

type HazeScene = ProjectionViewport & { haze: HazeLayer[] };

function drawHaze(
  context: CanvasRenderingContext2D,
  scene: HazeScene,
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

export type { HazeLayer, HazeLayerKind };
export { createHazeLayers, drawHaze };

