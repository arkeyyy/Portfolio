import type { Rgb } from './contracts';
import { clamp } from './math';
import { DEFAULT_ACTIVE_COLOR } from './theme';

function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${clamp(alpha, 0, 1)})`;
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const mix = clamp(amount, 0, 1);
  return [
    from[0] + (to[0] - from[0]) * mix,
    from[1] + (to[1] - from[1]) * mix,
    from[2] + (to[2] - from[2]) * mix,
  ];
}

function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  if (shortHex) {
    return shortHex.slice(1).map((channel) => Number.parseInt(channel + channel, 16)) as Rgb;
  }

  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (longHex) {
    return longHex.slice(1).map((channel) => Number.parseInt(channel, 16)) as Rgb;
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(color);
  if (!rgb) return null;
  return [
    clamp(Number(rgb[1]), 0, 255),
    clamp(Number(rgb[2]), 0, 255),
    clamp(Number(rgb[3]), 0, 255),
  ];
}

function resolveActiveColor(value: string): Rgb {
  let resolved = value.trim();
  const variable = /^var\(\s*(--[\w-]+)(?:\s*,[^)]+)?\s*\)$/.exec(resolved);
  if (variable && typeof document !== 'undefined') {
    resolved = getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  }
  return parseColor(resolved) ?? [...DEFAULT_ACTIVE_COLOR];
}

function featherSprite(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.filter = 'none';
  context.globalCompositeOperation = 'destination-in';
  const horizontal = context.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, 'rgba(255,255,255,0)');
  horizontal.addColorStop(0.1, 'rgba(255,255,255,1)');
  horizontal.addColorStop(0.9, 'rgba(255,255,255,1)');
  horizontal.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, width, height);

  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, 'rgba(255,255,255,0)');
  vertical.addColorStop(0.12, 'rgba(255,255,255,1)');
  vertical.addColorStop(0.86, 'rgba(255,255,255,1)');
  vertical.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function createRadialWashSprite(
  color: Rgb,
  stops: readonly (readonly [number, number])[],
  width = 256,
  height = 256,
  innerRadius = 0,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.translate(width * 0.5, height * 0.5);
  context.scale(width * 0.5, height * 0.5);
  const gradient = context.createRadialGradient(0, 0, innerRadius, 0, 0, 1);
  for (const [position, alpha] of stops) gradient.addColorStop(position, rgba(color, alpha));
  context.fillStyle = gradient;
  context.fillRect(-1, -1, 2, 2);
  return canvas;
}

function drawRadialWash(context: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number, radius: number) {
  context.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
}

function mixRgbInto(a: Rgb, b: Rgb, amount: number, output: Rgb) {
  for (let index = 0; index < 3; index += 1) {
    output[index] = a[index] + (b[index] - a[index]) * amount;
  }
}

export {
  rgba,
  mixRgb,
  mixRgbInto,
  parseColor,
  resolveActiveColor,
  featherSprite,
  createRadialWashSprite,
  drawRadialWash,
};

