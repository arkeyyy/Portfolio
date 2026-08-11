import type { CosmicRenderTheme, Rgb } from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { seededRandom, TAU } from '../core/math';
import { DEEP_SPACE } from '../core/theme';
import type { SecondaryRingSystem } from './cosmicRingShared';

const CYCLONE_CLOUD_PURPLE: Rgb = [158, 86, 235];
const CYCLONE_CLOUD_PINK: Rgb = [255, 82, 198];
const CYCLONE_CLOUD_CYAN: Rgb = [105, 226, 255];
const CYCLONE_CLOUD_WHITE: Rgb = [255, 249, 255];
const CYCLONE_STAR_WHITE: Rgb = [246, 249, 255];

type DistantCycloneAlphaSprites = {
  purpleHaze: HTMLCanvasElement;
  cyanClouds: HTMLCanvasElement;
  whiteCrests: HTMLCanvasElement;
  pinkClouds: HTMLCanvasElement;
};

export type DistantCycloneSprites = DistantCycloneAlphaSprites & {
  sparkField: HTMLCanvasElement;
};

export type DistantCyclone = {
  sprites: DistantCycloneSprites;
  phase: number;
};

type CycloneBandSpec = {
  startAngle: number;
  span: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  centerX: number;
  centerY: number;
  puffSize: number;
  puffCount: number;
  gapOffset: number;
  gaps: readonly (readonly [number, number])[];
  crestSide: 1 | -1;
  pinkStrength: number;
};

const CYCLONE_CLOUD_ENVELOPE_SCALE = 1.075;
const CYCLONE_CLOUD_NORMAL_SCATTER = 1.1;
const CYCLONE_CLOUD_TANGENT_SCATTER = 0.62;
const CYCLONE_BAND_SPECS: readonly CycloneBandSpec[] = [
  {
    startAngle: 0.18,
    span: 2.55,
    radiusX: 154,
    radiusY: 104,
    rotation: 0.14,
    centerX: -9,
    centerY: 20,
    puffSize: 19,
    puffCount: 44,
    gapOffset: 4,
    gaps: [[0.16, 0.25], [0.78, 0.86]],
    crestSide: -1,
    pinkStrength: 0.3,
  },
  {
    startAngle: 3.45,
    span: 2.18,
    radiusX: 142,
    radiusY: 88,
    rotation: -0.33,
    centerX: 15,
    centerY: -20,
    puffSize: 16.5,
    puffCount: 40,
    gapOffset: 10,
    gaps: [[0.3, 0.5]],
    crestSide: 1,
    pinkStrength: 0.18,
  },
  {
    startAngle: -1.55,
    span: 2.25,
    radiusX: 112,
    radiusY: 94,
    rotation: 0.52,
    centerX: 24,
    centerY: 2,
    puffSize: 18,
    puffCount: 36,
    gapOffset: 1,
    gaps: [[0.58, 0.69]],
    crestSide: -1,
    pinkStrength: 0.36,
  },
  {
    startAngle: 0.88,
    span: 2.9,
    radiusX: 104,
    radiusY: 68,
    rotation: -0.48,
    centerX: -18,
    centerY: 8,
    puffSize: 20,
    puffCount: 38,
    gapOffset: 7,
    gaps: [[0.2, 0.31], [0.72, 0.79]],
    crestSide: 1,
    pinkStrength: 0.46,
  },
  {
    startAngle: -0.62,
    span: 3.5,
    radiusX: 68,
    radiusY: 50,
    rotation: 0.28,
    centerX: 2,
    centerY: -2,
    puffSize: 20,
    puffCount: 42,
    gapOffset: 13,
    gaps: [[0.36, 0.48]],
    crestSide: -1,
    pinkStrength: 0.72,
  },
];

function drawCycloneCloudPuff(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  stretchX: number,
  rotation: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(stretchX, 1);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, rgba(CYCLONE_STAR_WHITE, alpha));
  gradient.addColorStop(0.5, rgba(CYCLONE_STAR_WHITE, alpha * 0.88));
  gradient.addColorStop(0.78, rgba(CYCLONE_STAR_WHITE, alpha * 0.42));
  gradient.addColorStop(1, rgba(CYCLONE_STAR_WHITE, 0));
  context.fillStyle = gradient;
  context.fillRect(-radius, -radius, radius * 2, radius * 2);
  context.restore();
}

function applyCycloneSpriteFade(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;
  context.globalCompositeOperation = 'destination-in';
  const edgeFade = context.createRadialGradient(
    centerX,
    centerY,
    4,
    centerX,
    centerY,
    canvas.width * 0.49,
  );
  edgeFade.addColorStop(0, 'rgba(255, 255, 255, 1)');
  edgeFade.addColorStop(0.68, 'rgba(255, 255, 255, 0.96)');
  edgeFade.addColorStop(0.9, 'rgba(255, 255, 255, 0.56)');
  edgeFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = edgeFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
}

function getCycloneBandPoint(spec: CycloneBandSpec, progress: number) {
  const angle = spec.startAngle
    + progress * spec.span
    + Math.sin(progress * TAU * 2.4 + spec.gapOffset) * 0.04;
  const radiusWave = 1
    + Math.sin(progress * TAU * 3.1 + spec.gapOffset * 0.7) * 0.035;
  const localX = Math.cos(angle) * spec.radiusX * radiusWave;
  const localY = Math.sin(angle) * spec.radiusY * radiusWave;
  const cosRotation = Math.cos(spec.rotation);
  const sinRotation = Math.sin(spec.rotation);
  const tangentX = -Math.sin(angle) * spec.radiusX * cosRotation
    - Math.cos(angle) * spec.radiusY * sinRotation;
  const tangentY = -Math.sin(angle) * spec.radiusX * sinRotation
    + Math.cos(angle) * spec.radiusY * cosRotation;

  return {
    x: spec.centerX + localX * cosRotation - localY * sinRotation,
    y: spec.centerY + localX * sinRotation + localY * cosRotation,
    tangentAngle: Math.atan2(tangentY, tangentX),
  };
}

function createDistantCycloneAlphaSprites(): DistantCycloneAlphaSprites | null {
  const purpleHaze = document.createElement('canvas');
  const cyanClouds = document.createElement('canvas');
  const whiteCrests = document.createElement('canvas');
  const pinkClouds = document.createElement('canvas');
  const canvases = [purpleHaze, cyanClouds, whiteCrests, pinkClouds];
  for (const canvas of canvases) {
    canvas.width = 384;
    canvas.height = 384;
  }

  const hazeContext = purpleHaze.getContext('2d');
  const cyanContext = cyanClouds.getContext('2d');
  const crestContext = whiteCrests.getContext('2d');
  const pinkContext = pinkClouds.getContext('2d');
  if (!hazeContext || !cyanContext || !crestContext || !pinkContext) return null;
  const center = purpleHaze.width * 0.5;
  const contexts = [hazeContext, cyanContext, crestContext, pinkContext];
  for (const context of contexts) {
    context.save();
    context.translate(center, center);
    context.globalCompositeOperation = 'lighter';
  }
  hazeContext.filter = 'blur(5.5px)';
  cyanContext.filter = 'blur(2.8px)';
  crestContext.filter = 'blur(1px)';
  pinkContext.filter = 'blur(1.8px)';

  drawCycloneCloudPuff(hazeContext, 0, 0, 158, 0.07, 1, 0);
  for (const [bandIndex, spec] of CYCLONE_BAND_SPECS.entries()) {
    for (let puff = 0; puff < spec.puffCount; puff += 1) {
      const progress = puff / (spec.puffCount - 1);
      const gapPosition = (puff + spec.gapOffset) % 23;
      const explicitGap = spec.gaps.some(
        ([gapStart, gapEnd]) => progress >= gapStart && progress <= gapEnd,
      );
      if (gapPosition >= 15 && gapPosition <= 16 || explicitGap) continue;
      const seed = 14_200 + bandIndex * 827 + puff * 37.1;
      const point = getCycloneBandPoint(spec, progress);
      const puffRadius = spec.puffSize
        * (0.76 + seededRandom(seed + 2.7) * 0.58);
      const rotation = point.tangentAngle;
      const stretch = 1.12 + seededRandom(seed + 4.9) * 0.52;
      const normalAngle = rotation + spec.crestSide * Math.PI * 0.5;
      const normalScatter = (seededRandom(seed + 5.9) - 0.5)
        * puffRadius
        * CYCLONE_CLOUD_NORMAL_SCATTER;
      const tangentScatter = (seededRandom(seed + 6.4) - 0.5)
        * puffRadius
        * CYCLONE_CLOUD_TANGENT_SCATTER;
      const cloudX = point.x * CYCLONE_CLOUD_ENVELOPE_SCALE
        + Math.cos(normalAngle) * normalScatter
        + Math.cos(rotation) * tangentScatter;
      const cloudY = point.y * CYCLONE_CLOUD_ENVELOPE_SCALE
        + Math.sin(normalAngle) * normalScatter
        + Math.sin(rotation) * tangentScatter;

      drawCycloneCloudPuff(
        hazeContext,
        cloudX,
        cloudY,
        puffRadius * 1.72,
        0.075 + seededRandom(seed + 7.1) * 0.045,
        stretch,
        rotation,
      );
      drawCycloneCloudPuff(
        cyanContext,
        cloudX,
        cloudY,
        puffRadius,
        0.17 + seededRandom(seed + 9.3) * 0.14,
        stretch,
        rotation,
      );

      if (seededRandom(seed + 11.7) > 0.22) {
        const crestOffset = puffRadius * 0.22;
        drawCycloneCloudPuff(
          crestContext,
          cloudX + Math.cos(normalAngle) * crestOffset,
          cloudY + Math.sin(normalAngle) * crestOffset,
          puffRadius * (0.34 + seededRandom(seed + 13.9) * 0.3),
          0.4 + seededRandom(seed + 16.1) * 0.28,
          1.06 + seededRandom(seed + 18.3) * 0.3,
          rotation,
        );
      }

      if (seededRandom(seed + 20.7) < spec.pinkStrength) {
        drawCycloneCloudPuff(
          pinkContext,
          cloudX - Math.cos(normalAngle) * puffRadius * 0.16,
          cloudY - Math.sin(normalAngle) * puffRadius * 0.16,
          puffRadius * (0.56 + seededRandom(seed + 22.9) * 0.18),
          0.2 + seededRandom(seed + 25.1) * 0.24,
          stretch,
          rotation,
        );
      }
    }
  }

  for (let cloud = 0; cloud < 26; cloud += 1) {
    const seed = 19_400 + cloud * 47.3;
    const angle = seededRandom(seed) * TAU;
    const radius = 10 + Math.pow(seededRandom(seed + 2.3), 0.7) * 66;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.9;
    const puffRadius = 10 + seededRandom(seed + 4.7) * 15;
    drawCycloneCloudPuff(
      hazeContext,
      x,
      y,
      puffRadius * 1.35,
      0.11,
      1.08,
      angle,
    );
    drawCycloneCloudPuff(
      pinkContext,
      x,
      y,
      puffRadius,
      0.3 + seededRandom(seed + 7.1) * 0.28,
      1.04 + seededRandom(seed + 9.3) * 0.32,
      angle,
    );
    if (cloud % 3 === 0) {
      drawCycloneCloudPuff(
        crestContext,
        x,
        y,
        puffRadius * 0.38,
        0.62,
        1.08,
        angle,
      );
    }
  }

  for (const context of contexts) context.restore();
  for (const canvas of canvases) applyCycloneSpriteFade(canvas);
  return { purpleHaze, cyanClouds, whiteCrests, pinkClouds };
}

function createCycloneSparkFieldSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const center = canvas.width * 0.5;
  context.save();
  context.translate(center, center);
  context.globalCompositeOperation = 'lighter';

  const drawSpark = (x: number, y: number, seed: number, pathBound: boolean) => {
    const colorChoice = seededRandom(seed + 4.3);
    const color = colorChoice < 0.54
      ? CYCLONE_CLOUD_WHITE
      : colorChoice < 0.82
        ? CYCLONE_CLOUD_CYAN
        : CYCLONE_CLOUD_PINK;
    const size = (pathBound ? 0.64 : 0.42)
      + seededRandom(seed + 6.7) * (pathBound ? 2.7 : 1.9);
    const alpha = (pathBound ? 0.4 : 0.24)
      + seededRandom(seed + 8.9) * (pathBound ? 0.56 : 0.5);

    if (size > 1.65) {
      context.fillStyle = rgba(color, alpha * 0.12);
      context.beginPath();
      context.arc(x, y, size * 2.8, 0, TAU);
      context.fill();
    }
    context.fillStyle = rgba(color, alpha);
    context.fillRect(x - size * 0.5, y - size * 0.5, size, size);
    if (size > 2.2) {
      context.fillStyle = rgba(color, alpha * 0.44);
      context.fillRect(x - size * 1.4, y - 0.3, size * 2.8, 0.6);
      context.fillRect(x - 0.3, y - size * 1.4, 0.6, size * 2.8);
    }
  };

  for (const [bandIndex, spec] of CYCLONE_BAND_SPECS.entries()) {
    for (let spark = 0; spark < 56; spark += 1) {
      const seed = 22_300 + bandIndex * 1901 + spark * 31.7;
      const progress = seededRandom(seed);
      const point = getCycloneBandPoint(spec, progress);
      const normalAngle = point.tangentAngle + Math.PI * 0.5;
      const normalScatter = (seededRandom(seed + 2.1) - 0.5) * spec.puffSize * 3.35;
      const tangentScatter = (seededRandom(seed + 3.2) - 0.5) * spec.puffSize * 1.9;
      drawSpark(
        point.x * CYCLONE_CLOUD_ENVELOPE_SCALE
          + Math.cos(normalAngle) * normalScatter
          + Math.cos(point.tangentAngle) * tangentScatter,
        point.y * CYCLONE_CLOUD_ENVELOPE_SCALE
          + Math.sin(normalAngle) * normalScatter
          + Math.sin(point.tangentAngle) * tangentScatter,
        seed,
        true,
      );
    }
  }

  for (let spark = 0; spark < 170; spark += 1) {
    const seed = 34_800 + spark * 29.7;
    const angle = seededRandom(seed) * TAU;
    const radius = 20 + Math.pow(seededRandom(seed + 2.1), 0.7) * 172;
    drawSpark(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.94,
      seed,
      false,
    );
  }
  context.restore();
  applyCycloneSpriteFade(canvas);
  return canvas;
}

function createCycloneGradientTintCanvas(
  alphaCanvas: HTMLCanvasElement,
  colorStops: readonly (readonly [number, Rgb])[],
) {
  const canvas = document.createElement('canvas');
  canvas.width = alphaCanvas.width;
  canvas.height = alphaCanvas.height;
  const context = canvas.getContext('2d');
  if (!context) return { canvas, context: null };

  context.drawImage(alphaCanvas, 0, 0);
  context.globalCompositeOperation = 'source-in';
  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    Math.max(canvas.width, canvas.height) * 0.56,
  );
  for (const [offset, color] of colorStops) {
    gradient.addColorStop(offset, rgba(color, 1));
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return { canvas, context };
}

export function createDistantCycloneSprites(): DistantCycloneSprites | null {
  const alphaSprites = createDistantCycloneAlphaSprites();
  if (!alphaSprites) return null;
  const hazeTint = createCycloneGradientTintCanvas(
    alphaSprites.purpleHaze,
    [
      [0, mixRgb(CYCLONE_CLOUD_PINK, CYCLONE_CLOUD_PURPLE, 0.48)],
      [0.34, CYCLONE_CLOUD_PURPLE],
      [0.72, mixRgb(CYCLONE_CLOUD_PURPLE, CYCLONE_CLOUD_CYAN, 0.3)],
      [1, mixRgb(CYCLONE_CLOUD_PURPLE, DEEP_SPACE, 0.26)],
    ] as const,
  );
  const cyanTint = createCycloneGradientTintCanvas(
    alphaSprites.cyanClouds,
    [
      [0, mixRgb(CYCLONE_CLOUD_WHITE, CYCLONE_CLOUD_PINK, 0.18)],
      [0.26, mixRgb(CYCLONE_CLOUD_PINK, CYCLONE_CLOUD_PURPLE, 0.38)],
      [0.56, mixRgb(CYCLONE_CLOUD_CYAN, CYCLONE_CLOUD_WHITE, 0.18)],
      [0.82, mixRgb(CYCLONE_CLOUD_CYAN, CYCLONE_CLOUD_PURPLE, 0.22)],
      [1, mixRgb(CYCLONE_CLOUD_PURPLE, CYCLONE_CLOUD_CYAN, 0.5)],
    ] as const,
  );
  const crestTint = createCycloneGradientTintCanvas(
    alphaSprites.whiteCrests,
    [
      [0, CYCLONE_CLOUD_WHITE],
      [0.3, mixRgb(CYCLONE_CLOUD_WHITE, CYCLONE_CLOUD_PINK, 0.14)],
      [0.65, mixRgb(CYCLONE_CLOUD_WHITE, CYCLONE_CLOUD_CYAN, 0.22)],
      [1, mixRgb(CYCLONE_CLOUD_WHITE, CYCLONE_CLOUD_PURPLE, 0.34)],
    ] as const,
  );
  const pinkTint = createCycloneGradientTintCanvas(
    alphaSprites.pinkClouds,
    [
      [0, mixRgb(CYCLONE_CLOUD_WHITE, CYCLONE_CLOUD_PINK, 0.28)],
      [0.34, CYCLONE_CLOUD_PINK],
      [0.7, mixRgb(CYCLONE_CLOUD_PINK, CYCLONE_CLOUD_PURPLE, 0.38)],
      [1, mixRgb(CYCLONE_CLOUD_PURPLE, CYCLONE_CLOUD_CYAN, 0.18)],
    ] as const,
  );
  if (
    !hazeTint.context
    || !cyanTint.context
    || !crestTint.context
    || !pinkTint.context
  ) return null;

  return {
    purpleHaze: hazeTint.canvas,
    cyanClouds: cyanTint.canvas,
    whiteCrests: crestTint.canvas,
    pinkClouds: pinkTint.canvas,
    sparkField: createCycloneSparkFieldSprite(),
  };
}

export function createDistantCyclone(
  sprites: DistantCycloneSprites,
): DistantCyclone {
  return { sprites, phase: 2.45 };
}

export function drawDistantCyclone(
  context: CanvasRenderingContext2D,
  cyclone: DistantCyclone,
  ring: SecondaryRingSystem,
  compact: boolean,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const motionTime = reducedMotion ? 0 : time;
  const cycloneWidth = ring.radiusY * (compact ? 2.26 : 2.46);
  const cycloneForeshortening = compact ? 0.78 : 0.72;
  const cycloneHeight = cycloneWidth * cycloneForeshortening;
  const orientationDrift = reducedMotion
    ? 0
    : Math.sin(motionTime * 0.000012 + cyclone.phase) * 0.06;
  const hazeRotation = orientationDrift * 0.65;
  const cloudRotation = orientationDrift;
  const sparkRotation = orientationDrift * 1.15 + motionTime * 0.000003;
  const opacityPulse = reducedMotion
    ? 0.96
    : 0.96 + Math.sin(motionTime * 0.00007 + cyclone.phase) * 0.04;
  const scalePulse = reducedMotion
    ? 1
    : 1 + Math.sin(motionTime * 0.000025 + cyclone.phase) * 0.007;
  const corePulse = reducedMotion
    ? 1
    : 0.95 + Math.sin(motionTime * 0.00011 + cyclone.phase) * 0.05;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(ring.centerX, ring.centerY);
  context.rotate(ring.tilt);

  context.save();
  context.scale(1, cycloneHeight / cycloneWidth);
  context.rotate(hazeRotation);
  context.scale(scalePulse * 1.08, scalePulse * 1.08);
  context.globalAlpha = renderTheme.distantCyclone.hazeAlpha * opacityPulse;
  context.drawImage(
    cyclone.sprites.purpleHaze,
    -cycloneWidth * 0.5,
    -cycloneWidth * 0.5,
    cycloneWidth,
    cycloneWidth,
  );
  context.restore();

  context.save();
  context.scale(1, cycloneHeight / cycloneWidth);
  context.rotate(cloudRotation);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.distantCyclone.cyanAlpha * opacityPulse;
  context.drawImage(
    cyclone.sprites.cyanClouds,
    -cycloneWidth * 0.5,
    -cycloneWidth * 0.5,
    cycloneWidth,
    cycloneWidth,
  );
  context.restore();

  context.save();
  context.scale(1, cycloneHeight / cycloneWidth);
  const coreRadius = cycloneWidth * 0.25;
  const coreGlow = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
  coreGlow.addColorStop(
    0,
    rgba(
      CYCLONE_CLOUD_WHITE,
      renderTheme.distantCyclone.coreAlpha * corePulse,
    ),
  );
  coreGlow.addColorStop(
    0.14,
    rgba(
      CYCLONE_CLOUD_WHITE,
      renderTheme.distantCyclone.coreAlpha * corePulse * 0.92,
    ),
  );
  coreGlow.addColorStop(
    0.34,
    rgba(
      CYCLONE_CLOUD_PINK,
      renderTheme.distantCyclone.coreAlpha * corePulse * 0.76,
    ),
  );
  coreGlow.addColorStop(
    0.62,
    rgba(
      CYCLONE_CLOUD_PURPLE,
      renderTheme.distantCyclone.coreAlpha * corePulse * 0.2,
    ),
  );
  coreGlow.addColorStop(1, rgba(CYCLONE_CLOUD_PURPLE, 0));
  context.fillStyle = coreGlow;
  context.fillRect(-coreRadius, -coreRadius, coreRadius * 2, coreRadius * 2);
  context.restore();

  context.save();
  context.scale(1, cycloneHeight / cycloneWidth);
  context.rotate(cloudRotation);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.distantCyclone.pinkAlpha * opacityPulse;
  context.drawImage(
    cyclone.sprites.pinkClouds,
    -cycloneWidth * 0.5,
    -cycloneWidth * 0.5,
    cycloneWidth,
    cycloneWidth,
  );
  context.globalAlpha = renderTheme.distantCyclone.crestAlpha * opacityPulse;
  context.drawImage(
    cyclone.sprites.whiteCrests,
    -cycloneWidth * 0.5,
    -cycloneWidth * 0.5,
    cycloneWidth,
    cycloneWidth,
  );
  context.restore();

  context.save();
  context.scale(1, cycloneHeight / cycloneWidth);
  context.rotate(sparkRotation);
  context.scale(scalePulse * 1.04, scalePulse * 1.04);
  context.globalAlpha = renderTheme.distantCyclone.sparkAlpha * opacityPulse;
  context.drawImage(
    cyclone.sprites.sparkField,
    -cycloneWidth * 0.5,
    -cycloneWidth * 0.5,
    cycloneWidth,
    cycloneWidth,
  );
  context.restore();
  context.restore();
}
