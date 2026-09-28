import type { AdaptiveQuality } from '../core/adaptiveQuality';
import { qualityOpacity, qualityRank } from '../core/adaptiveQuality';
import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { createSeededRandom, positiveModulo, TAU } from '../core/math';
import { isProjectedVisible, projectAtDepth } from '../core/parallax';
import { DEFAULT_ACTIVE_COLOR, PARTICLE_DEPTH_RANGE } from '../core/theme';

type AtmosphericParticle = {
  qualityRank: number;
  x: number;
  y: number;
  size: number;
  depthProfile: AtmosphericDepthProfile;
  phase: number;
  drift: number;
  speed: number;
  colorIndex: number;
};
type AtmosphericParticleSprites = {
  atlas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tint: Rgb;
};

const WARM_PARTICLE: Rgb = [255, 244, 220];
const COOL_PARTICLE: Rgb = [225, 246, 255];

function paintAtmosphericParticleCell(context: CanvasRenderingContext2D, index: number, color: Rgb) {
  const x = index * 64 + 32;
  context.clearRect(index * 64, 0, 64, 64);
  context.fillStyle = rgba(color, 0.12);
  context.beginPath();
  context.arc(x, 32, 20, 0, TAU);
  context.fill();
  context.fillStyle = rgba(color, 0.38);
  context.beginPath();
  context.ellipse(x, 32, 5.2, 8, 0, 0, TAU);
  context.fill();
}

function createAtmosphericParticleSprites(): AtmosphericParticleSprites {
  const atlas = document.createElement('canvas');
  atlas.width = 192;
  atlas.height = 64;
  const context = atlas.getContext('2d')!;
  const tint = mixRgb(COOL_PARTICLE, DEFAULT_ACTIVE_COLOR, 0.18);
  paintAtmosphericParticleCell(context, 0, WARM_PARTICLE);
  paintAtmosphericParticleCell(context, 1, COOL_PARTICLE);
  paintAtmosphericParticleCell(context, 2, tint);
  return { atlas, context, tint };
}

function createParticles(width: number, height: number, compact: boolean) {
  const count = compact ? 26 : 48;
  const random = createSeededRandom(compact ? 8111 : 9011);
  return Array.from({ length: count }, (_, index): AtmosphericParticle => {
    const x = random() * width;
    const y = random() * height;
    const size = (compact ? 0.45 : 0.55) + random() * (compact ? 1.05 : 1.35);
    const depthMix = random();
    return {
      qualityRank: qualityRank(index, 0x61a7),
      x,
      y,
      size,
      depthProfile: {
        translation: PARTICLE_DEPTH_RANGE.translation[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.translation[1] - PARTICLE_DEPTH_RANGE.translation[0]),
        perspective: PARTICLE_DEPTH_RANGE.perspective[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.perspective[1] - PARTICLE_DEPTH_RANGE.perspective[0]),
        tilt: 0,
      },
      phase: random() * TAU + index * 0.19,
      drift: 2 + random() * 7,
      speed: 0.55 + random() * 2.1,
      colorIndex: Math.floor(random() * 3),
    };
  });
}

export function updateAtmosphericParticleTint(
  sprites: AtmosphericParticleSprites,
  activeColor: Rgb,
) {
  const red = COOL_PARTICLE[0] + (activeColor[0] - COOL_PARTICLE[0]) * 0.18;
  const green = COOL_PARTICLE[1] + (activeColor[1] - COOL_PARTICLE[1]) * 0.18;
  const blue = COOL_PARTICLE[2] + (activeColor[2] - COOL_PARTICLE[2]) * 0.18;
  if (
    sprites.tint[0] === red
    && sprites.tint[1] === green
    && sprites.tint[2] === blue
  ) return;
  sprites.tint[0] = red;
  sprites.tint[1] = green;
  sprites.tint[2] = blue;
  paintAtmosphericParticleCell(sprites.context, 2, sprites.tint);
}

type AtmosphericParticleScene = ProjectionViewport & {
  particles: AtmosphericParticle[];
};

function drawParticles(
  context: CanvasRenderingContext2D,
  scene: AtmosphericParticleScene,
  time: number,
  sprites: AtmosphericParticleSprites,
  parallax: ParallaxFrame,
  quality: AdaptiveQuality,
) {
  const margin = 24;
  const span = scene.width + margin * 2;
  context.save();
  for (const particle of scene.particles) {
    const qualityAlpha = qualityOpacity(particle.qualityRank, quality.particleWeights);
    if (qualityAlpha <= 0.001) continue;
    const x = -margin + positiveModulo(
      particle.x + margin + particle.speed * time * 0.001
        + Math.sin(time * 0.00013 + particle.phase) * particle.drift, span);
    const y = particle.y + Math.cos(time * 0.00011 + particle.phase) * particle.drift * 0.6;
    projectAtDepth(parallax, x, y, particle.depthProfile, scene.projection);
    const size = particle.size * scene.projection.scale;
    const spriteSize = size * 8;
    if (!isProjectedVisible(scene, spriteSize, spriteSize)) continue;
    const shimmer = 0.68 + Math.sin(time * 0.0011 + particle.phase) * 0.2;
    const opacity = shimmer * scene.projection.alphaScale * qualityAlpha;
    if (opacity <= 0.001) continue;
    context.globalAlpha = opacity;
    context.drawImage(sprites.atlas, particle.colorIndex * 64, 0, 64, 64,
      scene.projection.x - spriteSize * 0.5, scene.projection.y - spriteSize * 0.5,
      spriteSize, spriteSize);
  }
  context.restore();
}

export type { AtmosphericParticle, AtmosphericParticleSprites };
export {
  createAtmosphericParticleSprites,
  createParticles,
  drawParticles,
};

