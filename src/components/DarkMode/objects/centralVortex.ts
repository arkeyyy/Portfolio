import type { CosmicRenderTheme, Rgb } from '../core/contracts';
import {
  createTintCanvas,
  drawStar,
  getNebulaAccentColor,
  mixRgb,
  rgba,
  updateCloudTint,
} from '../core/colorCanvas';
import { seededRandom, snapToPixel, TAU } from '../core/math';
import {
  CLOUD_ACCENT,
  DEFAULT_ACTIVE_COLOR,
} from '../core/theme';
import type { SecondaryRingSystem } from './cosmicRingShared';

const VORTEX_STAR_WHITE: Rgb = [246, 249, 255];

export type VortexSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  accentContext: CanvasRenderingContext2D;
  lastActiveColor: string;
  lastAccentColor: string;
};

export type VortexStar = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  phase: number;
};

export type Vortex = {
  sprites: VortexSprites;
  stars: VortexStar[];
};

export type VortexViewport = {
  compact: boolean;
  pixelRatio: number;
};

function createVortexAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;

  context.save();
  context.translate(centerX, centerY);
  context.globalCompositeOperation = 'lighter';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.filter = 'blur(7px)';
  for (let arm = 0; arm < 12; arm += 1) {
    const seed = 6100 + arm * 31.7;
    const phase = (arm / 12) * TAU + (seededRandom(seed) - 0.5) * 0.24;
    const turns = 1.2 + seededRandom(seed + 2.3) * 0.55;
    context.strokeStyle = `rgba(255, 255, 255, ${0.038 + seededRandom(seed + 4.9) * 0.045})`;
    context.lineWidth = 12 + seededRandom(seed + 7.1) * 18;
    context.beginPath();
    for (let point = 0; point < 74; point += 1) {
      const progress = point / 73;
      const angle = phase + progress * turns * TAU;
      const wobble = Math.sin(progress * TAU * 3 + seed) * (2 + progress * 4);
      const radius = 18 + progress * 224 + wobble;
      const x = Math.cos(angle) * radius * 1.48;
      const y = Math.sin(angle) * radius * 0.9;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  context.filter = 'blur(0.75px)';
  for (let filament = 0; filament < 38; filament += 1) {
    const seed = 7200 + filament * 43.9;
    const phase = seededRandom(seed + 1.1) * TAU;
    const turns = 1.15 + seededRandom(seed + 3.7) * 0.9;
    const startRadius = 12 + seededRandom(seed + 5.9) * 34;
    const reach = 158 + seededRandom(seed + 8.3) * 88;
    context.strokeStyle = `rgba(255, 255, 255, ${0.085 + seededRandom(seed + 10.7) * 0.15})`;
    context.lineWidth = 0.85 + seededRandom(seed + 12.1) * 3.3;
    context.setLineDash([
      16 + seededRandom(seed + 14.3) * 34,
      5 + seededRandom(seed + 16.7) * 15,
      3 + seededRandom(seed + 18.9) * 12,
      8 + seededRandom(seed + 21.1) * 22,
    ]);
    context.lineDashOffset = seededRandom(seed + 23.7) * 80;
    context.beginPath();
    for (let point = 0; point < 82; point += 1) {
      const progress = point / 81;
      const angle = phase + progress * turns * TAU;
      const ripple = Math.sin(progress * TAU * 4 + seed) * (1.2 + progress * 3.4);
      const radius = startRadius + progress * reach + ripple;
      const x = Math.cos(angle) * radius * 1.48;
      const y = Math.sin(angle) * radius * 0.9;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
  context.setLineDash([]);

  context.filter = 'blur(1px)';
  for (let knot = 0; knot < 24; knot += 1) {
    const seed = 8600 + knot * 47.3;
    const progress = 0.18 + seededRandom(seed + 1.9) * 0.74;
    const angle = seededRandom(seed + 4.1) * TAU + progress * TAU * 1.6;
    const radius = 24 + progress * 215;
    const x = Math.cos(angle) * radius * 1.48;
    const y = Math.sin(angle) * radius * 0.9;
    const knotRadius = 2 + seededRandom(seed + 6.7) * 6;
    const gradient = context.createRadialGradient(x, y, 0, x, y, knotRadius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.12 + seededRandom(seed + 8.9) * 0.13})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(
      x - knotRadius,
      y - knotRadius,
      knotRadius * 2,
      knotRadius * 2,
    );
  }
  context.restore();

  context.globalCompositeOperation = 'destination-in';
  const edgeFade = context.createRadialGradient(
    centerX,
    centerY,
    12,
    centerX,
    centerY,
    canvas.width * 0.49,
  );
  edgeFade.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
  edgeFade.addColorStop(0.1, 'rgba(255, 255, 255, 0.82)');
  edgeFade.addColorStop(0.28, 'rgba(255, 255, 255, 1)');
  edgeFade.addColorStop(0.76, 'rgba(255, 255, 255, 0.88)');
  edgeFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = edgeFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';

  return canvas;
}

export function createVortexSprites(): VortexSprites | null {
  const alpha = createVortexAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const accentTint = createTintCanvas(alpha, CLOUD_ACCENT);
  if (!activeTint.context || !accentTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    accent: accentTint.canvas,
    activeContext: activeTint.context,
    accentContext: accentTint.context,
    lastActiveColor: '',
    lastAccentColor: '',
  };
}

function createVortexStars(count: number) {
  return Array.from({ length: count }, (_, index): VortexStar => {
    const seed = 9400 + index * 41.3;
    const radius = 0.12 + seededRandom(seed + 1.7) * 0.62;
    return {
      angle: seededRandom(seed + 3.9) * TAU,
      radius,
      speed: 0.000014 + (1 - radius) * 0.000026 + seededRandom(seed + 6.1) * 0.000008,
      size: 0.55 + seededRandom(seed + 8.7) * 1.2,
      phase: seededRandom(seed + 11.3) * TAU,
    };
  });
}

export function createVortex(sprites: VortexSprites, compact: boolean): Vortex {
  return {
    sprites,
    stars: createVortexStars(compact ? 24 : 46),
  };
}

function updateVortexTints(vortex: VortexSprites, activeColor: Rgb, accentColor: Rgb) {
  vortex.lastActiveColor = updateCloudTint(
    vortex.active,
    vortex.activeContext,
    vortex.alpha,
    activeColor,
    vortex.lastActiveColor,
  );
  vortex.lastAccentColor = updateCloudTint(
    vortex.accent,
    vortex.accentContext,
    vortex.alpha,
    accentColor,
    vortex.lastAccentColor,
  );
}

export function drawVortex(
  context: CanvasRenderingContext2D,
  vortex: Vortex,
  innerRing: SecondaryRingSystem,
  viewport: VortexViewport,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const accentColor = getNebulaAccentColor(activeColor);
  updateVortexTints(
    vortex.sprites,
    mixRgb(activeColor, accentColor, 0.12),
    accentColor,
  );
  const motionTime = reducedMotion ? 0 : time;
  const vortexWidth = innerRing.radiusX * (viewport.compact ? 1.3 : 1.45);
  const vortexHeight = innerRing.radiusY * (viewport.compact ? 1.2 : 1.35);
  const activeRotation = reducedMotion ? 0.18 : 0.18 + motionTime * 0.000050;
  const accentRotation = reducedMotion ? -0.24 : -0.24 + motionTime * 0.000023;
  const opacityPulse = reducedMotion
    ? 0.92
    : 0.86 + Math.sin(motionTime * 0.00015 + 0.6) * 0.1;
  const scalePulse = reducedMotion
    ? 1
    : 1 + Math.sin(motionTime * 0.000035 + 1.8) * 0.018;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(innerRing.centerX, innerRing.centerY);
  context.rotate(innerRing.tilt);
  context.beginPath();
  context.ellipse(0, 0, vortexWidth * 0.52, vortexHeight * 0.52, 0, 0, TAU);
  context.clip();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  const coreRadius = vortexWidth * 0.31;
  const coreGlow = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
  coreGlow.addColorStop(
    0,
    rgba(mixRgb(activeColor, accentColor, 0.44), renderTheme.vortex.coreAlpha),
  );
  coreGlow.addColorStop(0.46, rgba(accentColor, renderTheme.vortex.coreAlpha * 0.55));
  coreGlow.addColorStop(1, rgba(accentColor, 0));
  context.fillStyle = coreGlow;
  context.fillRect(-coreRadius, -coreRadius, coreRadius * 2, coreRadius * 2);
  context.restore();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  context.rotate(accentRotation);
  context.scale(scalePulse * 1.035, scalePulse * 1.035);
  context.globalAlpha = renderTheme.vortex.accentAlpha * opacityPulse;
  context.drawImage(
    vortex.sprites.accent,
    -vortexWidth * 0.53,
    -vortexWidth * 0.53,
    vortexWidth * 1.06,
    vortexWidth * 1.06,
  );
  context.restore();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  context.rotate(activeRotation);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.vortex.activeAlpha * opacityPulse;
  context.drawImage(
    vortex.sprites.active,
    -vortexWidth * 0.5,
    -vortexWidth * 0.5,
    vortexWidth,
    vortexWidth,
  );
  context.restore();
  context.restore();

  const cosTilt = Math.cos(innerRing.tilt);
  const sinTilt = Math.sin(innerRing.tilt);
  for (const star of vortex.stars) {
    const angle = star.angle + motionTime * star.speed;
    const localX = Math.cos(angle) * vortexWidth * 0.5 * star.radius;
    const localY = Math.sin(angle) * vortexHeight * 0.5 * star.radius;
    const x = snapToPixel(
      innerRing.centerX + localX * cosTilt - localY * sinTilt,
      viewport.pixelRatio,
    );
    const y = snapToPixel(
      innerRing.centerY + localX * sinTilt + localY * cosTilt,
      viewport.pixelRatio,
    );
    const twinkle = reducedMotion
      ? 0.78
      : 0.68 + Math.sin(time * 0.0015 + star.phase) * 0.26;
    const depth = 0.7 + star.radius * 0.3;
    drawStar(
      context,
      x,
      y,
      star.size * depth,
      VORTEX_STAR_WHITE,
      renderTheme.vortex.starAlpha * twinkle * depth,
    );
  }
}
