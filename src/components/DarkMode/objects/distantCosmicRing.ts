import type {
  CosmicRenderTheme,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { clamp } from '../core/math';
import { DEPTH_FIELD_LAYERS } from '../core/theme';
import {
  createSecondaryRingParticles,
  drawSecondaryRingParticles,
  drawSecondaryRingSystem,
} from './cosmicRingShared';
import type { SecondaryRingSystem } from './cosmicRingShared';

export function createDistantCosmicRing(
  width: number,
  height: number,
  compact: boolean,
): SecondaryRingSystem {
  return {
    centerX: width * (compact ? 0.86 : 0.9),
    centerY: height * (compact ? 0.16 : 0.13),
    radiusX: compact
      ? clamp(width * 0.27, 82, 126)
      : clamp(width * 0.18, 190, 300),
    radiusY: compact
      ? clamp(height * 0.065, 42, 68)
      : clamp(height * 0.085, 58, 102),
    tilt: -0.24,
    lanes: 2,
    laneSpacing: 0.08,
    dashSpeed: 0.0045,
    colorMix: 0.74,
    glintAngle: 5.2,
    glintSpeed: -0.000018,
    particles: createSecondaryRingParticles(
      compact ? 14 : 24,
      2,
      2400,
      1,
      0.000022,
      0.00001,
      0.5,
      1.2,
    ),
  };
}

export function drawDistantCosmicRing(
  context: CanvasRenderingContext2D,
  compact: boolean,
  pixelRatio: number,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  drawSecondaryRingSystem(
    context,
    compact,
    ring,
    time,
    activeColor,
    renderTheme.secondaryRings.distantAlpha,
    renderTheme.secondaryRings.dashAlpha * 0.72,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.distantRing,
  );
  drawSecondaryRingParticles(
    context,
    pixelRatio,
    ring,
    time,
    activeColor,
    renderTheme,
    0.72,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.distantRing,
  );
}
