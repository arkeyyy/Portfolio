import type {
  CosmicRenderTheme,
  DepthFieldLayer,
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
import { seededRandom, snapToPixel, TAU } from '../core/math';
import {
  getParallaxOffsetX,
  getParallaxOffsetY,
  projectAtParallaxDepth,
} from '../core/parallax';
import { FOREGROUND_CLOUD_PURPLE, STAR_COLOR_FADE_MS } from '../core/theme';

export type RingParticle = {
  angle: number;
  size: number;
  lane: number;
  speed: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
};

export type SecondaryRingSystem = OrbitGeometry & {
  lanes: number;
  laneSpacing: number;
  dashSpeed: number;
  colorMix: number;
  glintAngle: number;
  glintSpeed: number;
  particles: RingParticle[];
};

export function createSecondaryRingParticles(
  count: number,
  lanes: number,
  seedOffset: number,
  direction: 1 | -1,
  speedMin: number,
  speedRange: number,
  sizeMin: number,
  sizeRange: number,
) {
  return Array.from({ length: count }, (_, index): RingParticle => {
    const seed = seedOffset + index * 29.3;
    return {
      angle: seededRandom(seed + 1.1) * TAU,
      size: sizeMin + seededRandom(seed + 3.7) * sizeRange,
      lane: Math.floor(seededRandom(seed + 5.9) * lanes),
      speed: direction * (speedMin + seededRandom(seed + 7.3) * speedRange),
      phase: seededRandom(seed + 9.7) * TAU,
      colorSeed: seed * 0.37,
      colorOffset: seededRandom(seed + 11.9) * STAR_COLOR_FADE_MS,
    };
  });
}

export function traceProjectedOrbit(
  context: CanvasRenderingContext2D,
  compact: boolean,
  parallax: ParallaxFrame,
  orbit: OrbitGeometry,
  laneScale: number,
  layer: DepthFieldLayer,
) {
  if (Math.abs(parallax.positionX) + Math.abs(parallax.positionY) < 0.001) {
    context.beginPath();
    context.ellipse(
      orbit.centerX + getParallaxOffsetX(parallax, layer.translationDepth),
      orbit.centerY + getParallaxOffsetY(parallax, layer.translationDepth),
      orbit.radiusX * laneScale,
      orbit.radiusY * laneScale,
      orbit.tilt,
      0,
      TAU,
    );
    return;
  }

  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const segmentCount = compact ? 56 : 80;
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  context.beginPath();
  for (let segment = 0; segment <= segmentCount; segment += 1) {
    const angle = segment / segmentCount * TAU;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      layer.translationDepth,
      layer.perspectiveDepth,
      layer.perspectiveStrength,
      projection,
    );
    if (segment === 0) context.moveTo(projection.x, projection.y);
    else context.lineTo(projection.x, projection.y);
  }
  context.closePath();
}

export function drawSecondaryRingSystem(
  context: CanvasRenderingContext2D,
  compact: boolean,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  baseAlpha: number,
  dashAlpha: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  depthLayer: DepthFieldLayer,
) {
  const motionTime = reducedMotion ? 0 : time;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);
  const centerLane = (ring.lanes - 1) * 0.5;

  context.save();
  context.lineCap = 'round';

  for (let lane = 0; lane < ring.lanes; lane += 1) {
    const laneOffset = lane - centerLane;
    const laneScale = 1 + laneOffset * ring.laneSpacing;
    const laneAlpha = 1 - Math.abs(laneOffset) * 0.11;
    traceProjectedOrbit(context, compact, parallax, ring, laneScale, depthLayer);

    context.setLineDash([]);
    context.lineWidth = 0.55 + lane * 0.16;
    context.strokeStyle = rgba(ringColor, baseAlpha * laneAlpha);
    context.stroke();

    context.setLineDash([
      ring.radiusX * 0.42,
      ring.radiusX * 0.17,
      ring.radiusX * 0.07,
      ring.radiusX * 0.26,
    ]);
    context.lineDashOffset = -motionTime * ring.dashSpeed + lane * ring.radiusX * 0.13;
    context.lineWidth = 0.9 + lane * 0.12;
    context.strokeStyle = rgba(ringColor, dashAlpha * laneAlpha);
    context.stroke();
  }

  context.setLineDash([]);
  const glintAngle = ring.glintAngle + motionTime * ring.glintSpeed;
  const localGlintX = Math.cos(glintAngle) * ring.radiusX;
  const localGlintY = Math.sin(glintAngle) * ring.radiusY;
  const cosTilt = Math.cos(ring.tilt);
  const sinTilt = Math.sin(ring.tilt);
  const glintProjection: DepthFieldProjection = {
    x: 0,
    y: 0,
    scale: 1,
    alphaScale: 1,
  };
  projectAtParallaxDepth(
    parallax,
    ring.centerX + localGlintX * cosTilt - localGlintY * sinTilt,
    ring.centerY + localGlintX * sinTilt + localGlintY * cosTilt,
    depthLayer.translationDepth,
    depthLayer.perspectiveDepth,
    depthLayer.perspectiveStrength,
    glintProjection,
  );
  const glintPulse = reducedMotion
    ? 0.72
    : 0.64 + Math.sin(time * 0.0011 + ring.glintAngle) * 0.24;
  drawStar(
    context,
    glintProjection.x,
    glintProjection.y,
    1.25 * glintProjection.scale,
    ringColor,
    dashAlpha * 3.2 * glintPulse * glintProjection.alphaScale,
  );
  context.restore();
}

export function drawSecondaryRingParticles(
  context: CanvasRenderingContext2D,
  pixelRatio: number,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  opacityScale: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  depthLayer: DepthFieldLayer,
) {
  const motionTime = reducedMotion ? 0 : time;
  const cosTilt = Math.cos(ring.tilt);
  const sinTilt = Math.sin(ring.tilt);
  const centerLane = (ring.lanes - 1) * 0.5;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const particle of ring.particles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 1 + (particle.lane - centerLane) * ring.laneSpacing;
    const localX = Math.cos(angle) * ring.radiusX * laneScale;
    const localY = Math.sin(angle) * ring.radiusY * laneScale;
    const x = ring.centerX + localX * cosTilt - localY * sinTilt;
    const y = ring.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      depthLayer.translationDepth,
      depthLayer.perspectiveDepth,
      depthLayer.perspectiveStrength,
      projection,
    );
    const depth = (Math.sin(angle) + 1) * 0.5;
    const twinkle = reducedMotion
      ? 0.76
      : 0.64 + Math.sin(time * 0.00145 + particle.phase) * 0.28;
    const animatedColor = getAnimatedStarColor(
      particle.colorSeed,
      particle.colorOffset,
      motionTime,
      activeColor,
      renderTheme.neutralStarColor,
      0.76,
    );
    const color = mixRgb(animatedColor, ringColor, 0.24);
    const alpha = renderTheme.secondaryRings.particleAlpha
      * opacityScale
      * (0.52 + depth * 0.48)
      * twinkle
      * projection.alphaScale;
    const size = particle.size * (0.78 + depth * 0.58) * projection.scale;
    drawStar(
      context,
      snapToPixel(projection.x, pixelRatio),
      snapToPixel(projection.y, pixelRatio),
      size,
      color,
      alpha,
    );
  }
}
