import type {
  CosmicRenderTheme,
  DepthFieldProjection,
  OrbitGeometry,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import {
  drawStar,
  getAnimatedStarColor,
  mixRgb,
  rgba,
} from '../core/colorCanvas';
import { seededRandom, TAU } from '../core/math';
import { projectAtParallaxDepth } from '../core/parallax';
import {
  CLOUD_ACCENT,
  DEPTH_FIELD_LAYERS,
  STAR_COLOR_FADE_MS,
} from '../core/theme';
import { traceProjectedOrbit } from './cosmicRingShared';
import type { RingParticle } from './cosmicRingShared';

export function createMainRingOrbit(
  width: number,
  height: number,
  compact: boolean,
): OrbitGeometry {
  return compact
    ? {
        centerX: width * 0.47,
        centerY: height * 0.7,
        radiusX: width * 0.91,
        radiusY: Math.max(height * 0.27, 125),
        tilt: 0.14,
      }
    : {
        centerX: width * 0.34,
        centerY: height * 0.82,
        radiusX: width * 0.76,
        radiusY: Math.max(height * 0.35, 210),
        tilt: 0.14,
      };
}

export function createMainRingParticles(compact: boolean): RingParticle[] {
  const count = compact ? 86 : 168;
  return Array.from(
    { length: count },
    (_, index): RingParticle => ({
      angle: seededRandom(index * 4.3 + 8) * TAU,
      size: 0.65 + seededRandom(index * 6.7 + 9) * 1.9,
      lane: Math.floor(seededRandom(index * 8.9 + 10) * 4),
      speed: 0.000026 + seededRandom(index * 10.1 + 11) * 0.000012,
      phase: seededRandom(index * 12.5 + 12) * TAU,
      colorSeed: index * 2.11 + 1.7,
      colorOffset: seededRandom(index * 14.3 + 13) * STAR_COLOR_FADE_MS,
    }),
  );
}

export function drawMainRingTrails(
  context: CanvasRenderingContext2D,
  compact: boolean,
  orbit: OrbitGeometry,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  context.save();

  for (let lane = 0; lane < 4; lane += 1) {
    const laneScale = 0.91 + lane * 0.052;
    const trailColor = mixRgb(activeColor, CLOUD_ACCENT, lane * 0.16);
    traceProjectedOrbit(
      context,
      compact,
      parallax,
      orbit,
      laneScale,
      DEPTH_FIELD_LAYERS.mainRing,
    );
    context.lineWidth = 0.65 + lane * 0.28;
    context.strokeStyle = rgba(
      trailColor,
      renderTheme.ringTrails.baseAlpha - lane * renderTheme.ringTrails.laneFalloff,
    );
    context.setLineDash([]);
    context.stroke();

    context.lineWidth = 1.05 + lane * 0.24;
    context.strokeStyle = rgba(trailColor, renderTheme.ringTrails.dashAlpha);
    context.setLineDash([
      orbit.radiusX * (0.17 + lane * 0.015),
      orbit.radiusX * 0.055,
      orbit.radiusX * 0.045,
      orbit.radiusX * 0.08,
    ]);
    context.lineDashOffset = -motionTime * (0.014 + lane * 0.002);
    context.stroke();
  }

  context.setLineDash([]);
  context.restore();
}

export function drawMainRingParticles(
  context: CanvasRenderingContext2D,
  orbit: OrbitGeometry,
  particles: readonly RingParticle[],
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const motionTime = reducedMotion ? 0 : time;
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const particle of particles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 0.91 + particle.lane * 0.052;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      DEPTH_FIELD_LAYERS.mainRing.translationDepth,
      DEPTH_FIELD_LAYERS.mainRing.perspectiveDepth,
      DEPTH_FIELD_LAYERS.mainRing.perspectiveStrength,
      projection,
    );
    const depth = (Math.sin(angle) + 1) * 0.5;
    const twinkle = reducedMotion
      ? 0.78
      : 0.68 + Math.sin(time * 0.0016 + particle.phase) * 0.3;
    const color = getAnimatedStarColor(
      particle.colorSeed,
      particle.colorOffset,
      motionTime,
      activeColor,
      renderTheme.neutralStarColor,
      0.82,
    );
    const alpha = renderTheme.ringParticleAlpha
      * (0.5 + depth * 0.5)
      * twinkle
      * projection.alphaScale;
    const size = particle.size * (0.84 + depth * 0.76) * projection.scale;
    drawStar(context, projection.x, projection.y, size, color, alpha);
  }
}
