import type {
  CosmicRenderTheme,
  DepthFieldProjection,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { clamp, seededRandom, smoothstep, TAU } from '../core/math';
import { projectAtParallaxDepth } from '../core/parallax';
import {
  DEPTH_FIELD_STAR_STRENGTH,
  PARALLAX_DEPTH,
  STAR_COLOR_FADE_MS,
} from '../core/theme';

const FIELD_STAR_GOLD: Rgb = [255, 214, 122];
const FIELD_STAR_WHITE: Rgb = [255, 250, 244];

function getAnimatedFieldStarColor(seed: number, offset: number, time: number) {
  const localTime = time + offset;
  const segment = Math.floor(localTime / STAR_COLOR_FADE_MS);
  const progress = smoothstep((localTime % STAR_COLOR_FADE_MS) / STAR_COLOR_FADE_MS);
  const goldToWhite = seededRandom(seed * 19.7 + segment * 11.3) > 0.5;
  const startColor = goldToWhite ? FIELD_STAR_GOLD : FIELD_STAR_WHITE;
  const endColor = goldToWhite ? FIELD_STAR_WHITE : FIELD_STAR_GOLD;
  return mixRgb(startColor, endColor, progress);
}

export type FieldStar = {
  x: number;
  y: number;
  size: number;
  depth: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
  tintStrength: number;
};

export function createFieldStars(
  width: number,
  height: number,
  compact: boolean,
): FieldStar[] {
  const count = compact
    ? clamp(Math.round((width * height) / 4400), 98, 148)
    : clamp(Math.round((width * height) / 7200), 150, 245);

  return Array.from({ length: count }, (_, index): FieldStar => ({
    x: seededRandom(index * 3.1 + 1),
    y: seededRandom(index * 5.7 + 2),
    size: 0.28 + seededRandom(index * 7.9 + 3) * 2.15,
    depth: 0.28 + seededRandom(index * 9.1 + 4) * 0.72,
    phase: seededRandom(index * 11.3 + 5) * TAU,
    colorSeed: index * 1.73 + 0.41,
    colorOffset: seededRandom(index * 13.7 + 6) * STAR_COLOR_FADE_MS,
    tintStrength: 0.28 + seededRandom(index * 15.1 + 7) * 0.72,
  }));
}

export function drawFieldStars(
  context: CanvasRenderingContext2D,
  stars: readonly FieldStar[],
  width: number,
  height: number,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  for (const star of stars) {
    const baseX = star.x * width
      + Math.sin(motionTime * 0.00022 + star.phase) * 13 * star.depth;
    const baseY = star.y * height
      + Math.cos(motionTime * 0.00017 + star.phase) * 9 * star.depth;
    projectAtParallaxDepth(
      parallax,
      baseX,
      baseY,
      star.depth * PARALLAX_DEPTH.starField,
      star.depth,
      DEPTH_FIELD_STAR_STRENGTH.field,
      projection,
    );
    const twinkle = reducedMotion
      ? 0.72
      : 0.58 + Math.sin(time * 0.0013 + star.phase) * 0.28;
    const color = getAnimatedFieldStarColor(
      star.colorSeed,
      star.colorOffset,
      motionTime,
    );
    const alpha = renderTheme.fieldStarAlpha
      * star.depth
      * twinkle
      * projection.alphaScale;
    const coreSize = Math.max(
      0.46,
      star.size * (0.42 + star.depth * 0.28) * projection.scale,
    );
    // Most stars stay pinpoints. Only the closest bright seeds carry a
    // tapered diffraction cross, giving the field a clear magnitude hierarchy.
    const diffraction = star.size > 2.08 && star.depth > 0.72;
    if (diffraction) {
      const horizontalArm = coreSize * 3.3;
      const verticalArm = horizontalArm * 1.22;
      const waist = coreSize * 0.22;
      context.fillStyle = rgba(color, alpha * 0.36);
      context.beginPath();
      context.moveTo(projection.x, projection.y - verticalArm);
      context.lineTo(projection.x + waist, projection.y - waist);
      context.lineTo(projection.x + horizontalArm, projection.y);
      context.lineTo(projection.x + waist, projection.y + waist);
      context.lineTo(projection.x, projection.y + verticalArm);
      context.lineTo(projection.x - waist, projection.y + waist);
      context.lineTo(projection.x - horizontalArm, projection.y);
      context.lineTo(projection.x - waist, projection.y - waist);
      context.closePath();
      context.fill();
      context.fillStyle = rgba(color, alpha * 0.09);
      context.beginPath();
      context.arc(projection.x, projection.y, coreSize * 1.7, 0, TAU);
      context.fill();
    }

    context.fillStyle = rgba(color, alpha * (diffraction ? 1.65 : 1.12));
    context.fillRect(
      projection.x - coreSize * 0.5,
      projection.y - coreSize * 0.5,
      coreSize,
      coreSize,
    );
  }
}
