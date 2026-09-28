import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { featherSprite, rgba } from '../core/colorCanvas';
import { clamp, createSeededRandom, positiveModulo, smoothstep, TAU } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import { RIVER_LIGHT_BLUE } from '../core/theme';

type RisingRiverGlowSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];

type RisingRiverGlow = {
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
  rotation: number;
  rotationDrift: number;
  growth: number;
  opacity: number;
  spriteIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};

function createRisingRiverGlowSprite(variant: 0 | 1 | 2) {
  const width = 256;
  const height = 384;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const variantOffset = variant === 0 ? -0.035 : variant === 1 ? 0.045 : 0;
  const variantLean = variant === 0 ? -0.08 : variant === 1 ? 0.1 : 0.025;
  const drawGlowLobe = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: Rgb,
    opacity: number,
  ) => {
    context.save();
    context.translate(width * x, height * y);
    context.rotate(variantLean);
    context.scale(width * radiusX, height * radiusY);
    const glow = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, rgba(color, opacity));
    glow.addColorStop(0.46, rgba(color, opacity * 0.48));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };

  context.globalCompositeOperation = 'lighter';
  drawGlowLobe(0.5 + variantOffset, 0.62, 0.42, 0.32, RIVER_LIGHT_BLUE, 0.72);
  drawGlowLobe(0.45 - variantOffset * 0.5, 0.46, 0.31, 0.29, [191, 228, 239], 0.65);
  drawGlowLobe(0.55 + variantOffset * 0.8, 0.3, 0.24, 0.25, [207, 239, 248], 0.55);
  drawGlowLobe(0.48 - variantOffset, 0.17, 0.16, 0.18, [224, 246, 252], 0.42);

  context.save();
  context.filter = 'blur(8px)';
  context.strokeStyle = 'rgba(230,248,255,0.6)';
  context.lineCap = 'round';
  context.lineWidth = variant === 2 ? 16 : 13;
  context.beginPath();
  context.moveTo(width * (0.47 + variantOffset), height * 0.78);
  context.bezierCurveTo(
    width * (0.34 - variantOffset),
    height * 0.6,
    width * (0.65 + variantOffset),
    height * 0.38,
    width * (0.48 - variantOffset * 0.5),
    height * 0.12,
  );
  context.stroke();
  context.restore();

  drawGlowLobe(0.5 + variantOffset * 0.4, 0.58, 0.18, 0.21, [244, 252, 255], 0.95);
  drawGlowLobe(0.47 - variantOffset * 0.5, 0.38, 0.12, 0.17, [250, 254, 255], 0.85);
  featherSprite(context, width, height);
  return canvas;
}

function createRisingRiverGlowSprites(): RisingRiverGlowSprites {
  return [
    createRisingRiverGlowSprite(0),
    createRisingRiverGlowSprite(1),
    createRisingRiverGlowSprite(2),
  ];
}

function createRisingRiverGlows(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverGlow[] {
  const count = compact ? 7 : 12;
  const random = createSeededRandom(compact ? 21401 : 29879);
  const minimumWidth = compact ? 28 : 42;
  const maximumWidth = compact ? 72 : 110;

  return Array.from({ length: count }, (_, index): RisingRiverGlow => {
    const glowWidth = minimumWidth + random() * (maximumWidth - minimumWidth);
    const sourceY = height * (0.9 + random() * 0.04);
    const targetY = height * (0.35 + random() * 0.15);
    const depthMix = random();
    return {
      sourceX: width * (0.035 + (random() + random()) * 0.345),
      sourceY,
      width: glowWidth,
      height: glowWidth * (1.45 + random() * 0.65),
      riseDistance: sourceY - targetY,
      phase: positiveModulo(index / count + random() * 0.16, 1),
      duration: 34000 + random() * 18000,
      horizontalDrift: width * (-0.025 + random() * 0.065),
      sway: clamp(width * (0.006 + random() * 0.012), 5, compact ? 13 : 22),
      swayCycles: 0.8 + random() * 0.8,
      rotation: (random() - 0.5) * 0.08,
      rotationDrift: (random() - 0.5) * 0.12,
      growth: 0.2 + random() * 0.15,
      opacity: 0.08 + random() * 0.14,
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      depthProfile: {
        translation: 0.07 + depthMix * 0.13,
        perspective: 0.06 + depthMix * 0.12,
        tilt: 0.03 + depthMix * 0.09,
      },
    };
  });
}

type RisingRiverGlowScene = ProjectionViewport & {
  risingRiverGlows: RisingRiverGlow[];
};

function drawRisingRiverGlows(
  context: CanvasRenderingContext2D,
  scene: RisingRiverGlowScene,
  sprites: RisingRiverGlowSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  context.save();
  context.globalCompositeOperation = 'source-over';

  for (const glow of scene.risingRiverGlows) {
    const progress = positiveModulo(glow.phase + time / glow.duration, 1);
    const fadeIn = smoothstep(0, 0.12, progress);
    const fadeOut = 1 - smoothstep(0.55, 1, progress);
    const opacity = glow.opacity * fadeIn * fadeOut;
    if (opacity <= 0.001) continue;
    const sway = Math.sin(
      progress * TAU * glow.swayCycles + glow.phase * TAU,
    ) * glow.sway * scene.motionScale;
    const x = glow.sourceX + glow.horizontalDrift * progress * scene.motionScale + sway;
    const y = glow.sourceY - glow.riseDistance * progress;
    const growth = 1 + glow.growth * smoothstep(0, 0.72, progress);
    const rotation = glow.rotation
      + glow.rotationDrift * progress * scene.motionScale
      + Math.sin(progress * TAU + glow.phase * TAU) * 0.018 * scene.motionScale;

    drawDepthImage(
      context,
      scene,
      sprites[glow.spriteIndex],
      x,
      y,
      glow.width * growth,
      glow.height * growth,
      glow.depthProfile,
      opacity,
      parallax,
      rotation,
    );
  }
  context.restore();
}

export type { RisingRiverGlow, RisingRiverGlowSprites };
export {
  createRisingRiverGlowSprites,
  createRisingRiverGlows,
  drawRisingRiverGlows,
};

