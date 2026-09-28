import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { featherSprite, rgba } from '../core/colorCanvas';
import { clamp, createSeededRandom, positiveModulo, TAU } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import { LIGHT_DEPTH_PROFILES, SKY_CYAN, SKY_LAVENDER } from '../core/theme';

type CloudLayerKind = 'far' | 'middle' | 'foreground';
type CloudSprites = {
  farA: HTMLCanvasElement;
  farB: HTMLCanvasElement;
  middleA: HTMLCanvasElement;
  middleB: HTMLCanvasElement;
  foreground: HTMLCanvasElement;
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
      index % 3 === 0 ? [177, 173, 174] as Rgb : [171, 185, 183] as Rgb,
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
    const tint = index % 3 === 0 ? [230, 230, 222] as Rgb : [255, 251, 238] as Rgb;
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

export function createCloudSprites(): CloudSprites {
  return {
    farA: createCloudSprite('far', 1103),
    farB: createCloudSprite('far', 2203),
    middleA: createCloudSprite('middle', 3301),
    middleB: createCloudSprite('middle', 4409),
    foreground: createCloudSprite('foreground', 5501),
  };
}

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

type CloudScene = ProjectionViewport & { clouds: Cloud[] };

function getCloudX(scene: CloudScene, cloud: Cloud, time: number) {
  const margin = 120;
  const minimum = -cloud.width * 0.5 - margin;
  const span = scene.width + cloud.width + margin * 2;
  const travel = cloud.direction * cloud.speed * time * 0.001;
  return minimum + positiveModulo(cloud.x - minimum + travel, span);
}

function drawClouds(
  context: CanvasRenderingContext2D,
  scene: CloudScene,
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

export type { Cloud, CloudLayerKind, CloudSprites };
export { createClouds, drawClouds };

