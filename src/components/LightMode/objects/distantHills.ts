import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { rgba } from '../core/colorCanvas';
import { createSeededRandom, smoothstep, TAU } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import { LIGHT_DEPTH_PROFILES } from '../core/theme';
import { sampleForestSkyline } from './landscapeShared';
import type { ForestSkylinePoint } from './landscapeShared';

type DistantHillSprites = {
  far: HTMLCanvasElement;
  middle: HTMLCanvasElement;
  near: HTMLCanvasElement;
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

function createDistantHillSprite(kind: keyof DistantHillSprites) {
  const width = 1200;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(kind === 'far' ? 8573 : kind === 'middle' ? 9257 : 10103);
  const isFar = kind === 'far';
  const isNear = kind === 'near';
  const ridge: ReadonlyArray<ForestSkylinePoint> = isFar
    ? [[-0.04, 0.17], [0.04, 0.19], [0.13, 0.25], [0.2, 0.34],
      [0.27, 0.47], [0.35, 0.53], [0.43, 0.58], [0.52, 0.66],
      [0.64, 0.7], [0.77, 0.73], [1.04, 0.78]]
    : isNear
      ? [[-0.04, 0.35], [0.06, 0.39], [0.15, 0.49], [0.24, 0.53],
        [0.33, 0.63], [0.43, 0.59], [0.51, 0.56], [0.59, 0.63],
        [0.69, 0.71], [0.8, 0.7], [1.04, 0.76]]
      : [[-0.04, 0.26], [0.05, 0.3], [0.13, 0.4], [0.24, 0.5],
        [0.32, 0.52], [0.41, 0.64], [0.51, 0.69], [0.6, 0.64],
        [0.71, 0.72], [0.85, 0.73], [1.04, 0.79]];
  const topColor: Rgb = isFar ? [150, 140, 143] : isNear ? [129, 128, 124] : [143, 137, 139];
  const bottomColor: Rgb = isFar ? [183, 181, 177] : isNear ? [158, 155, 147] : [168, 167, 162];

  // A continuous, irregular ridge instead of stacked circular hill masses.
  // Tiny canopy marks and long, soft folds are baked into each distance plane.
  context.beginPath();
  context.moveTo(-12, height);
  for (let x = -12; x <= width + 12; x += 3) {
    const u = x / width;
    const ripple = Math.sin(u * 87 + 0.8) * 0.0028
      + Math.sin(u * 217) * 0.0018 + (random() - 0.5) * 0.003;
    context.lineTo(x, height * (sampleForestSkyline(ridge, u) + ripple));
  }
  context.lineTo(width + 12, height);
  context.closePath();
  context.save();
  context.clip();
  const stone = context.createLinearGradient(0, 0, width * 0.24, height);
  stone.addColorStop(0, rgba(topColor, 0.92));
  stone.addColorStop(0.6, rgba(bottomColor, 0.9));
  stone.addColorStop(1, rgba([213, 207, 194], 0.28));
  context.fillStyle = stone;
  context.fillRect(0, 0, width, height);

  for (let fold = 0; fold < 18; fold += 1) {
    const x = width * (random() * 0.84 - 0.08);
    const y = height * sampleForestSkyline(ridge, x / width);
    context.save();
    context.filter = 'blur(6px)';
    context.fillStyle = rgba(fold % 3 === 0 ? [239, 231, 216] : [82, 89, 89], fold % 3 === 0 ? 0.1 : 0.045);
    context.beginPath();
    context.moveTo(x, y + 3);
    context.bezierCurveTo(x + width * 0.08, y + height * 0.1,
      x + width * 0.12, y + height * 0.35, x + width * 0.25, height);
    context.lineTo(x + width * 0.32, height);
    context.bezierCurveTo(x + width * 0.14, y + height * 0.27,
      x + width * 0.12, y + height * 0.12, x + width * 0.025, y);
    context.fill();
    context.restore();
  }
  for (let mark = 0; mark < 2900; mark += 1) {
    const x = random() * width;
    const ridgeY = height * sampleForestSkyline(ridge, x / width);
    const y = ridgeY + Math.pow(random(), 1.5) * (height - ridgeY);
    const nearEdge = 1 - smoothstep(0, height * 0.45, y - ridgeY);
    context.fillStyle = rgba(mark % 4 === 0 ? [244, 238, 223] : [77, 87, 85],
      (0.012 + random() * 0.035) * (0.4 + nearEdge * 0.6));
    context.beginPath();
    context.ellipse(x, y, 0.6 + random() * 3.8, 0.5 + random() * 2.1, -0.5, 0, TAU);
    context.fill();
  }
  for (let ribbon = 0; ribbon < 6; ribbon += 1) {
    const y = height * (0.42 + ribbon * 0.084);
    context.save();
    context.filter = 'blur(9px)';
    context.strokeStyle = rgba([238, 232, 220], 0.16 - ribbon * 0.014);
    context.lineWidth = 7 + ribbon * 2;
    context.beginPath();
    context.moveTo(-20, y);
    context.bezierCurveTo(width * 0.19, y - 22, width * 0.35, y + 54, width * 0.8, y + 30);
    context.stroke();
    context.restore();
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = 'destination-in';
  const dissolve = context.createLinearGradient(0, 0, width, 0);
  dissolve.addColorStop(0, 'rgba(255,255,255,1)');
  dissolve.addColorStop(0.38, 'rgba(255,255,255,0.84)');
  dissolve.addColorStop(0.67, 'rgba(255,255,255,0.28)');
  dissolve.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = dissolve;
  context.fillRect(0, 0, width, height);
  context.restore();

  if (isFar) {
    // Sun-bleached escarpment: a quiet counterweight to the left valley.
    context.save();
    context.beginPath();
    context.moveTo(width, height * 0.02);
    context.lineTo(width * 0.91, height * 0.065);
    context.lineTo(width * 0.8, height * 0.09);
    context.lineTo(width * 0.758, height * 0.12);
    context.lineTo(width * 0.746, height * 0.15);
    context.lineTo(width * 0.756, height * 0.177);
    context.lineTo(width * 0.81, height * 0.19);
    context.lineTo(width * 0.827, height * 0.27);
    context.lineTo(width * 0.805, height * 0.32);
    context.lineTo(width * 0.85, height * 0.34);
    context.lineTo(width * 0.8, height * 0.39);
    context.lineTo(width * 0.73, height * 0.47);
    context.lineTo(width * 0.65, height * 0.54);
    context.lineTo(width * 0.63, height);
    context.lineTo(width, height);
    context.closePath();
    context.clip();
    const cliff = context.createLinearGradient(0, 0, 0, height * 0.85);
    cliff.addColorStop(0, 'rgba(182,164,127,0.18)');
    cliff.addColorStop(0.38, 'rgba(187,171,141,0.09)');
    cliff.addColorStop(1, 'rgba(220,207,180,0)');
    context.fillStyle = cliff;
    context.fillRect(0, 0, width, height);
    for (let seam = 0; seam < 22; seam += 1) {
      const y = height * (0.12 + seam * 0.031);
      context.strokeStyle = 'rgba(149,138,114,0.035)';
      context.lineWidth = 0.5 + random() * 1.5;
      context.beginPath();
      context.moveTo(width * (0.7 + random() * 0.1), y);
      context.bezierCurveTo(width * 0.86, y + 4, width * 0.91, y - 12, width, y - 18);
      context.stroke();
    }
    context.restore();
  }
  // Atmospheric softness belongs in the cached art, not in a frame filter.
  const softened = document.createElement('canvas');
  softened.width = width;
  softened.height = height;
  const softenedContext = softened.getContext('2d');
  if (!softenedContext) {
    softened.width = softened.height = 0;
    return canvas;
  }
  softenedContext.filter = isFar ? 'blur(3px)' : isNear ? 'blur(1.2px)' : 'blur(2px)';
  softenedContext.drawImage(canvas, 0, 0);
  canvas.width = canvas.height = 0;
  return softened;
}

export function createDistantHillSprites(): DistantHillSprites {
  return {
    far: createDistantHillSprite('far'),
    middle: createDistantHillSprite('middle'),
    near: createDistantHillSprite('near'),
  };
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
      opacity: 0.64,
      sprite: sprites.far,
    },
    {
      x: centerX - width * 0.015,
      y: height * (compact ? 0.67 : 0.64),
      width: hillWidth * 1.02,
      height: height * (compact ? 0.62 : 0.7),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.43,
      sprite: sprites.middle,
    },
    {
      x: centerX - width * 0.035,
      y: height * (compact ? 0.7 : 0.68),
      width: hillWidth * 1.04,
      height: height * (compact ? 0.58 : 0.62),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.48,
      sprite: sprites.near,
    },
  ];
}

type DistantHillScene = ProjectionViewport & { distantHills: DistantHillLayer[] };

function drawDistantHills(
  context: CanvasRenderingContext2D,
  scene: DistantHillScene,
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

export type { DistantHillLayer, DistantHillSprites };
export { createDistantHills, drawDistantHills };

