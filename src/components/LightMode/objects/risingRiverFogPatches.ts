import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { featherSprite, mixRgb, rgba } from '../core/colorCanvas';
import { createSeededRandom, positiveModulo, smoothstep, TAU } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import { RIVER_LIGHT_BLUE, SKY_CYAN } from '../core/theme';

type RisingRiverFogPatchSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];

type RisingRiverFogPatch = {
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
  riseDistance: number;
  phase: number;
  duration: number;
  horizontalDrift: number;
  sway: number;
  swayCycles: number;
  growthX: number;
  growthY: number;
  opacity: number;
  spriteIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};

function createRisingRiverFogPatchSprite(variant: 0 | 1 | 2) {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(18431 + variant * 2707);
  const riverColor = mixRgb(RIVER_LIGHT_BLUE, SKY_CYAN, 0.58);
  const highlightColor = mixRgb(riverColor, [232, 248, 252], 0.34);
  const drawFogLobe = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: Rgb,
    opacity: number,
  ) => {
    context.save();
    context.translate(width * x, height * y);
    context.scale(width * radiusX, height * radiusY);
    const fog = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    fog.addColorStop(0, rgba(color, opacity));
    fog.addColorStop(0.42, rgba(color, opacity * 0.62));
    fog.addColorStop(0.78, rgba(color, opacity * 0.2));
    fog.addColorStop(1, rgba(color, 0));
    context.fillStyle = fog;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };

  context.globalCompositeOperation = 'lighter';
  drawFogLobe(0.5, 0.63, 0.48, 0.29, riverColor, 0.52);
  drawFogLobe(
    0.47 + (variant - 1) * 0.025,
    0.52,
    0.39,
    0.22,
    riverColor,
    0.36,
  );

  const lobeCount = 6 + variant;
  for (let index = 0; index < lobeCount; index += 1) {
    const lane = lobeCount === 1 ? 0.5 : index / (lobeCount - 1);
    drawFogLobe(
      0.1 + lane * 0.8 + (random() - 0.5) * 0.055,
      0.46 + (random() - 0.5) * 0.19,
      0.13 + random() * 0.1,
      0.16 + random() * 0.12,
      random() > 0.46 ? highlightColor : riverColor,
      0.32 + random() * 0.22,
    );
  }

  featherSprite(context, width, height);
  return canvas;
}

function createRisingRiverFogPatchSprites(): RisingRiverFogPatchSprites {
  return [
    createRisingRiverFogPatchSprite(0),
    createRisingRiverFogPatchSprite(1),
    createRisingRiverFogPatchSprite(2),
  ];
}

function createRisingRiverFogPatches(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverFogPatch[] {
  const count = compact ? 5 : 8;
  const random = createSeededRandom(compact ? 25357 : 33791);
  const minimumWidth = compact ? 120 : 180;
  const maximumWidth = compact ? 220 : 360;
  const minimumHeight = compact ? 42 : 52;
  const maximumHeight = compact ? 82 : 115;
  const minimumOpacity = compact ? 0.08 : 0.07;
  const maximumOpacity = compact ? 0.14 : 0.13;

  return Array.from({ length: count }, (_, index): RisingRiverFogPatch => {
    const sourceY = height * (0.89 + random() * 0.05);
    const targetY = height * (0.42 + random() * 0.14);
    const depthMix = random();
    const corridorProgress = (index + random() * 0.42) / (count - 1 + 0.42);
    return {
      sourceX: width * (0.025 + corridorProgress * 0.69),
      sourceY,
      width: minimumWidth + random() * (maximumWidth - minimumWidth),
      height: minimumHeight + random() * (maximumHeight - minimumHeight),
      riseDistance: sourceY - targetY,
      phase: positiveModulo((index + random() * 0.35) / count, 1),
      duration: 52000 + random() * 30000,
      horizontalDrift: width * (0.05 + random() * 0.05),
      sway: 3 + random() * 5,
      swayCycles: 0.72 + random() * 0.68,
      growthX: 0.2 + random() * 0.15,
      growthY: 0.15 + random() * 0.15,
      opacity: minimumOpacity + random() * (maximumOpacity - minimumOpacity),
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      depthProfile: {
        translation: 0.04 + depthMix * 0.1,
        perspective: 0.035 + depthMix * 0.095,
        tilt: 0.02 + depthMix * 0.06,
      },
    };
  });
}

type RisingRiverFogPatchScene = ProjectionViewport & {
  risingRiverFogPatches: RisingRiverFogPatch[];
};

function drawRisingRiverFogPatches(
  context: CanvasRenderingContext2D,
  scene: RisingRiverFogPatchScene,
  sprites: RisingRiverFogPatchSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  context.save();
  context.globalCompositeOperation = 'source-over';

  for (const patch of scene.risingRiverFogPatches) {
    const progress = positiveModulo(patch.phase + time / patch.duration, 1);
    const fadeIn = smoothstep(0, 0.14, progress);
    const fadeOut = 1 - smoothstep(0.62, 1, progress);
    const opacity = patch.opacity * fadeIn * fadeOut;
    if (opacity <= 0.001) continue;

    const sway = Math.sin(
      progress * TAU * patch.swayCycles + patch.phase * TAU,
    ) * patch.sway * scene.motionScale;
    const x = patch.sourceX
      + patch.horizontalDrift * progress * scene.motionScale
      + sway;
    const y = patch.sourceY - patch.riseDistance * progress;
    const growthProgress = smoothstep(0, 1, progress);

    drawDepthImage(
      context,
      scene,
      sprites[patch.spriteIndex],
      x,
      y,
      patch.width * (1 + patch.growthX * growthProgress),
      patch.height * (1 + patch.growthY * growthProgress),
      patch.depthProfile,
      opacity,
      parallax,
    );
  }
  context.restore();
}

export type { RisingRiverFogPatch, RisingRiverFogPatchSprites };
export {
  createRisingRiverFogPatchSprites,
  createRisingRiverFogPatches,
  drawRisingRiverFogPatches,
};

