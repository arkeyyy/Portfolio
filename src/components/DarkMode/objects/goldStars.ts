import type {
  CosmicRenderTheme,
  DepthFieldProjection,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { clamp, seededRandom, smoothstep, TAU } from '../core/math';
import { projectAtParallaxDepth } from '../core/parallax';
import { DEPTH_FIELD_STAR_STRENGTH, PARALLAX_DEPTH } from '../core/theme';

export type GoldStar = {
  x: number;
  y: number;
  size: number;
  depth: number;
  phase: number;
  drift: number;
  fadeDuration: number;
  fadeRest: number;
  fadeOffset: number;
  fadeFloor: number;
};

function getGoldStarFade(star: GoldStar, time: number) {
  const cycleDuration = star.fadeDuration * 2 + star.fadeRest;
  const cycleTime = (time + star.fadeOffset) % cycleDuration;

  if (cycleTime < star.fadeDuration) {
    return 1 - (1 - star.fadeFloor) * smoothstep(cycleTime / star.fadeDuration);
  }

  if (cycleTime < star.fadeDuration * 2) {
    const progress = (cycleTime - star.fadeDuration) / star.fadeDuration;
    return star.fadeFloor + (1 - star.fadeFloor) * smoothstep(progress);
  }

  return 1;
}

export function createGoldStars(
  width: number,
  height: number,
  compact: boolean,
): GoldStar[] {
  const count = compact
    ? clamp(Math.round((width * height) / 2450), 138, 196)
    : clamp(Math.round((width * height) / 3300), 236, 372);

  return Array.from({ length: count }, (_, index): GoldStar => {
    const seed = 12_800 + index * 19.37;
    const layerSelector = seededRandom(seed + 1.9);
    const depth = layerSelector < 0.52
      ? 0.24 + seededRandom(seed + 2.5) * 0.22
      : layerSelector < 0.84
        ? 0.5 + seededRandom(seed + 2.5) * 0.2
        : 0.74 + seededRandom(seed + 2.5) * 0.24;
    const fadeDuration = 900 + seededRandom(seed + 11.3) * 900;
    const fadeRest = 1100 + seededRandom(seed + 13.7) * 4600;
    const fadeCycle = fadeDuration * 2 + fadeRest;

    return {
      x: seededRandom(seed + 3.7),
      y: seededRandom(seed + 5.1),
      size: 0.42 + depth * 0.86 + seededRandom(seed + 7.3) * 0.48,
      depth,
      phase: seededRandom(seed + 9.7) * TAU,
      drift: 2.5 + depth * 8,
      fadeDuration,
      fadeRest,
      fadeOffset: seededRandom(seed + 15.1) * fadeCycle,
      fadeFloor: 0.06 + seededRandom(seed + 17.9) * 0.14,
    };
  });
}

export function drawGoldStars(
  context: CanvasRenderingContext2D,
  stars: readonly GoldStar[],
  width: number,
  height: number,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const deepGold: Rgb = [232, 183, 82];
  const warmGold: Rgb = [255, 218, 132];
  const warmWhite: Rgb = [255, 246, 218];
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const star of stars) {
    const baseX = star.x * width
      + Math.sin(motionTime * 0.00016 + star.phase) * star.drift;
    const baseY = star.y * height
      + Math.cos(motionTime * 0.00012 + star.phase) * star.drift * 0.65;
    projectAtParallaxDepth(
      parallax,
      baseX,
      baseY,
      star.depth * PARALLAX_DEPTH.goldStars,
      star.depth,
      DEPTH_FIELD_STAR_STRENGTH.gold,
      projection,
    );
    const sparkle = reducedMotion
      ? 0.82
      : 0.72 + Math.sin(time * 0.00155 + star.phase) * 0.2;
    const fade = getGoldStarFade(star, motionTime);
    const alpha = renderTheme.goldStarAlpha
      * (0.52 + star.depth * 0.48)
      * sparkle
      * fade
      * projection.alphaScale;
    const size = star.size * (0.88 + sparkle * 0.16) * projection.scale;
    const color = mixRgb(deepGold, warmGold, star.depth);

    // A few luminous foreground seeds catch tapered rays. Let their intensity
    // follow the existing twinkle continuously instead of switching a cross on.
    const glint = star.depth > 0.86
      ? smoothstep(clamp((sparkle - 0.72) / 0.2, 0, 1))
      : 0;
    if (glint > 0.01) {
      const arm = size * 2.15;
      const waist = size * 0.13;
      context.fillStyle = rgba(color, alpha * glint * 0.3);
      context.beginPath();
      context.moveTo(projection.x, projection.y - arm * 1.18);
      context.lineTo(projection.x + waist, projection.y - waist);
      context.lineTo(projection.x + arm, projection.y);
      context.lineTo(projection.x + waist, projection.y + waist);
      context.lineTo(projection.x, projection.y + arm * 1.18);
      context.lineTo(projection.x - waist, projection.y + waist);
      context.lineTo(projection.x - arm, projection.y);
      context.lineTo(projection.x - waist, projection.y - waist);
      context.closePath();
      context.fill();
    }

    const coreSize = Math.max(0.48, size * 0.64);
    if (star.depth > 0.5) {
      context.fillStyle = rgba(color, alpha * 0.22);
      context.beginPath();
      context.arc(projection.x, projection.y, size * 0.98, 0, TAU);
      context.fill();
    }
    context.fillStyle = rgba(warmWhite, alpha * (0.74 + star.depth * 0.26));
    context.fillRect(
      projection.x - coreSize * 0.5,
      projection.y - coreSize * 0.5,
      coreSize,
      coreSize,
    );
  }
}
