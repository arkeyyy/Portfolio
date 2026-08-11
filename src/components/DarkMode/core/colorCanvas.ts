import type { Rgb } from './contracts';
import { clamp, seededRandom, smoothstep, TAU } from './math';
import {
  ABOUT_CLOUD_ACCENT,
  BRAND_STAR_COLORS,
  CLOUD_ACCENT,
  DEFAULT_ACTIVE_COLOR,
  STAR_COLOR_FADE_MS,
} from './theme';

export function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha})`;
}

export function mixRgb(first: Rgb, second: Rgb, amount: number): Rgb {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
}

export function getNebulaAccentColor(activeColor: Rgb) {
  const distanceFromAbout = Math.hypot(
    activeColor[0] - DEFAULT_ACTIVE_COLOR[0],
    activeColor[1] - DEFAULT_ACTIVE_COLOR[1],
    activeColor[2] - DEFAULT_ACTIVE_COLOR[2],
  );
  const aboutInfluence = smoothstep(clamp(1 - distanceFromAbout / 105, 0, 1));
  return mixRgb(CLOUD_ACCENT, ABOUT_CLOUD_ACCENT, aboutInfluence);
}

function getPaletteColor(index: number, activeColor: Rgb): Rgb {
  return index === 0
    ? activeColor
    : BRAND_STAR_COLORS[(index - 1) % BRAND_STAR_COLORS.length];
}

export function getAnimatedStarColor(
  seed: number,
  offset: number,
  time: number,
  activeColor: Rgb,
  neutralColor: Rgb,
  tintStrength: number,
) {
  const localTime = time + offset;
  const segment = Math.floor(localTime / STAR_COLOR_FADE_MS);
  const progress = smoothstep((localTime % STAR_COLOR_FADE_MS) / STAR_COLOR_FADE_MS);
  const paletteSize = BRAND_STAR_COLORS.length + 1;
  const fromIndex = Math.floor(seededRandom(seed * 31.7 + segment * 17.3) * paletteSize);
  const toIndex = Math.floor(seededRandom(seed * 31.7 + (segment + 1) * 17.3) * paletteSize);
  const transitioningColor = mixRgb(
    getPaletteColor(fromIndex, activeColor),
    getPaletteColor(toIndex, activeColor),
    progress,
  );
  return mixRgb(neutralColor, transitioningColor, tintStrength);
}

export function createTintCanvas(alphaCanvas: HTMLCanvasElement, color: Rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = alphaCanvas.width;
  canvas.height = alphaCanvas.height;
  const context = canvas.getContext('2d');
  if (!context) return { canvas, context: null };

  context.drawImage(alphaCanvas, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(color, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return { canvas, context };
}

export function updateCloudTint(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  alpha: HTMLCanvasElement,
  color: Rgb,
  lastColor: string,
) {
  const quantizedColor: Rgb = [
    Math.round(color[0] / 12) * 12,
    Math.round(color[1] / 12) * 12,
    Math.round(color[2] / 12) * 12,
  ];
  const colorKey = `${quantizedColor[0]}-${quantizedColor[1]}-${quantizedColor[2]}`;
  if (colorKey === lastColor) return lastColor;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  context.drawImage(alpha, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(quantizedColor, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return colorKey;
}

export function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: Rgb,
  alpha: number,
) {
  if (size > 1.75) {
    context.fillStyle = rgba(color, alpha * 0.12);
    context.beginPath();
    context.arc(x, y, size * 2.7, 0, TAU);
    context.fill();
  }

  const coreSize = Math.max(0.55, size * 0.68);
  if (size > 1.15) {
    const armLength = size * 1.9;
    const armWidth = Math.max(0.38, coreSize * 0.35);
    context.fillStyle = rgba(color, alpha * 0.3);
    context.fillRect(x - armLength, y - armWidth * 0.5, armLength * 2, armWidth);
    context.fillRect(x - armWidth * 0.5, y - armLength, armWidth, armLength * 2);
  }

  context.fillStyle = rgba(color, alpha);
  context.fillRect(x - coreSize * 0.5, y - coreSize * 0.5, coreSize, coreSize);
}
