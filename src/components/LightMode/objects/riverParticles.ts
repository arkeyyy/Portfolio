import type { AdaptiveQuality } from '../core/adaptiveQuality';
import { qualityOpacity, qualityRank } from '../core/adaptiveQuality';
import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
} from '../core/contracts';
import { clamp, createSeededRandom, positiveModulo, smoothstep, TAU } from '../core/math';
import { isProjectedVisible, projectAtDepth, setSpriteTransform } from '../core/parallax';
import { RIVER_GLOW_FLOW_BOUNDARY_X } from './riverShared';

type RiverParticleSprites = readonly [
  HTMLCanvasElement,
  HTMLCanvasElement,
  HTMLCanvasElement,
];
type RiverParticle = {
  qualityRank: number;
  phase: number;
  speed: number;
  size: number;
  depthProfile: AtmosphericDepthProfile;
  depthScale: number;
  spriteIndex: 0 | 1 | 2;
  y: number;
  horizontalDrift: number;
  verticalDrift: number;
  driftSpeed: number;
  driftPhase: number;
  lift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

function createRiverParticleSprite(variant: 0 | 1 | 2) {
  const size = 64;
  const center = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const vertices = variant === 0
    ? [[0, -10], [9, 8], [-9, 8]]
    : variant === 1
      ? [[0, -13], [6, 10], [-6, 7]]
      : [[-3, -11], [11, 5], [-8, 9]];
  const traceTriangle = () => {
    context.beginPath();
    context.moveTo(center + vertices[0][0], center + vertices[0][1]);
    context.lineTo(center + vertices[1][0], center + vertices[1][1]);
    context.lineTo(center + vertices[2][0], center + vertices[2][1]);
    context.closePath();
  };

  context.save();
  context.filter = 'blur(5px)';
  context.fillStyle = 'rgba(255,255,255,0.34)';
  traceTriangle();
  context.fill();
  context.restore();

  context.fillStyle = 'rgba(255,255,255,0.92)';
  traceTriangle();
  context.fill();

  const highlight = context.createLinearGradient(
    center,
    center - 13,
    center,
    center + 10,
  );
  highlight.addColorStop(0, 'rgba(255,255,255,0.98)');
  highlight.addColorStop(1, 'rgba(255,255,255,0.54)');
  context.fillStyle = highlight;
  traceTriangle();
  context.fill();
  return canvas;
}

function createRiverParticleSprites(): RiverParticleSprites {
  return [
    createRiverParticleSprite(0),
    createRiverParticleSprite(1),
    createRiverParticleSprite(2),
  ];
}

function createRiverParticles(compact: boolean): RiverParticle[] {
  const count = compact ? 56 : 96;
  const random = createSeededRandom(compact ? 12457 : 17681);
  const minimumSize = compact ? 1.4 : 1.8;
  const maximumSize = compact ? 4.2 : 5.5;
  const minimumY = compact ? 0.72 : 0.69;
  const maximumY = compact ? 0.91 : 0.89;

  return Array.from({ length: count }, (_, index): RiverParticle => {
    const sizeRoll = random();
    const depthMix = random();
    const size = compact
      ? sizeRoll < 0.6
        ? 1.4 + random() * 1.2
        : sizeRoll < 0.9
          ? 2.6 + random() * 0.9
          : 3.5 + random() * 0.7
      : sizeRoll < 0.6
        ? 1.8 + random() * 1.2
        : sizeRoll < 0.9
          ? 3 + random() * 1.5
          : 4.5 + random() * 1;
    const spinDirection = random() < 0.5 ? -1 : 1;
    const fastTumble = random() < 0.15;
    return {
      qualityRank: qualityRank(index, 0x92bf),
      phase: positiveModulo(random() + index / count, 1),
      speed: 4.5 + random() * 4.5,
      size: clamp(size, minimumSize, maximumSize),
      depthProfile: {
        translation: 0.14 + depthMix * 0.28,
        perspective: 0.12 + depthMix * 0.3,
        tilt: 0.08 + depthMix * 0.3,
      },
      depthScale: 0.78 + depthMix * 0.42,
      spriteIndex: Math.floor(random() * 3) as 0 | 1 | 2,
      y: minimumY + (random() + random()) * 0.5 * (maximumY - minimumY),
      horizontalDrift: 2 + random() * 7,
      verticalDrift: 2 + random() * 5,
      driftSpeed: 0.00016 + random() * 0.00019,
      driftPhase: random() * TAU,
      lift: 0.008 + random() * 0.035,
      rotation: random() * TAU,
      rotationSpeed: spinDirection
        * (fastTumble ? 0.61 + random() * 0.35 : 0.14 + random() * 0.42),
      opacity: (0.46 + random() * 0.38) * (0.72 + depthMix * 0.28),
    };
  });
}

type RiverParticleScene = ProjectionViewport & {
  riverParticles: RiverParticle[];
};

function drawRiverParticles(
  context: CanvasRenderingContext2D,
  scene: RiverParticleScene,
  sprites: RiverParticleSprites,
  time: number,
  parallax: ParallaxFrame,
  quality: AdaptiveQuality,
) {
  const entryMargin = 0.035;
  const travelSpan = RIVER_GLOW_FLOW_BOUNDARY_X + entryMargin * 2;
  const flowDistance = Math.max(scene.width * travelSpan, 1);
  const minimumY = scene.compact ? 0.72 : 0.69;
  const maximumY = scene.compact ? 0.91 : 0.89;

  context.save();
  context.beginPath();
  context.rect(0, 0, scene.width * RIVER_GLOW_FLOW_BOUNDARY_X, scene.height);
  context.clip();

  for (const particle of scene.riverParticles) {
    const qualityAlpha = qualityOpacity(particle.qualityRank, quality.triangleWeights);
    if (qualityAlpha <= 0.001) continue;
    const progress = positiveModulo(
      particle.phase
        + time * 0.001 * particle.speed * scene.motionScale / flowDistance,
      1,
    );
    const turbulenceTime = time * particle.driftSpeed * scene.motionScale
      + particle.driftPhase;
    const x = scene.width * (-entryMargin + travelSpan * progress)
      + Math.sin(turbulenceTime * 0.83) * particle.horizontalDrift * scene.motionScale;
    const y = scene.height * (particle.y - particle.lift * progress)
      + Math.cos(turbulenceTime) * particle.verticalDrift * scene.motionScale;
    const normalizedX = x / Math.max(scene.width, 1);
    const fadeIn = smoothstep(-entryMargin, 0.015, normalizedX);
    const fadeOut = 1 - smoothstep(
      RIVER_GLOW_FLOW_BOUNDARY_X - 0.04,
      RIVER_GLOW_FLOW_BOUNDARY_X,
      normalizedX,
    );
    const verticalProgress = clamp(
      (particle.y - minimumY) / Math.max(maximumY - minimumY, 0.0001),
      0,
      1,
    );
    const verticalTaper = 0.68 + 0.32
      * smoothstep(0, 0.18, verticalProgress)
      * (1 - smoothstep(0.82, 1, verticalProgress));
    const shimmer = 0.88 + Math.sin(time * 0.00072 + particle.driftPhase) * 0.12;
    const opacity = particle.opacity * fadeIn * fadeOut * verticalTaper * shimmer * qualityAlpha;
    if (opacity <= 0.001) continue;

    projectAtDepth(
      parallax,
      x,
      y,
      particle.depthProfile,
      scene.projection,
    );

    const spriteScale = particle.spriteIndex === 1 ? 5.4 : particle.spriteIndex === 0 ? 4 : 3.8;
    const spriteSize = particle.size * spriteScale;
    if (!isProjectedVisible(scene, spriteSize * particle.depthScale, spriteSize * particle.depthScale)) continue;
    const rotation = particle.rotation
      + time * 0.001 * particle.rotationSpeed * scene.motionScale
      + Math.sin(turbulenceTime * 0.7) * 0.12;
    const depthTilt = clamp(particle.depthProfile.tilt, 0, 1);
    const pitch = -parallax.positionY * parallax.maximumPitch * depthTilt;
    const yaw = parallax.positionX * parallax.maximumYaw * depthTilt;
    const depthScale = scene.projection.scale * particle.depthScale;
    setSpriteTransform(context, scene, rotation, pitch, yaw, depthScale, depthScale);
    context.globalAlpha = opacity * scene.projection.alphaScale;
    context.drawImage(
      sprites[particle.spriteIndex],
      -spriteSize * 0.5,
      -spriteSize * 0.5,
      spriteSize,
      spriteSize,
    );
  }
  context.restore();
}

export type { RiverParticle, RiverParticleSprites };
export {
  createRiverParticleSprites,
  createRiverParticles,
  drawRiverParticles,
};

