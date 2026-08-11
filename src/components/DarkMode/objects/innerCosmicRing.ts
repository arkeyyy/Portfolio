import type {
  CosmicRenderTheme,
  OrbitGeometry,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { DEPTH_FIELD_LAYERS } from '../core/theme';
import {
  createSecondaryRingParticles,
  drawSecondaryRingParticles,
  drawSecondaryRingSystem,
} from './cosmicRingShared';
import type { SecondaryRingSystem } from './cosmicRingShared';

export function createInnerCosmicRing(
  mainOrbit: OrbitGeometry,
  compact: boolean,
): SecondaryRingSystem {
  return {
    centerX: mainOrbit.centerX,
    centerY: mainOrbit.centerY,
    radiusX: mainOrbit.radiusX * (compact ? 0.48 : 0.44),
    radiusY: mainOrbit.radiusY * (compact ? 0.52 : 0.48),
    tilt: mainOrbit.tilt - 0.045,
    lanes: 3,
    laneSpacing: 0.065,
    dashSpeed: -0.008,
    colorMix: 0.52,
    glintAngle: 3.8,
    glintSpeed: 0.000032,
    particles: createSecondaryRingParticles(
      compact ? 28 : 46,
      3,
      3600,
      -1,
      0.000028,
      0.000014,
      0.58,
      1.55,
    ),
  };
}

export function drawInnerCosmicRing(
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
    renderTheme.secondaryRings.innerAlpha,
    renderTheme.secondaryRings.dashAlpha,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.mainRing,
  );
  drawSecondaryRingParticles(
    context,
    pixelRatio,
    ring,
    time,
    activeColor,
    renderTheme,
    0.92,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.mainRing,
  );
}
