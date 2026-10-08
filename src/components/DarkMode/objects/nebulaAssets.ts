import type { Rgb } from '../core/contracts';
import {
  createTintCanvas,
  getNebulaAccentColor,
  mixRgb,
  updateCloudTint,
} from '../core/colorCanvas';
import { seededRandom } from '../core/math';
import {
  CLOUD_ACCENT,
  DEFAULT_ACTIVE_COLOR,
  FOREGROUND_CLOUD_PURPLE,
} from '../core/theme';
import {
  createNebulaFilamentSprites,
  type NebulaFilamentSprites,
} from './nebulaFilaments';

export type NebulaSprites = {
  filaments: NebulaFilamentSprites;
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  purple: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  accentContext: CanvasRenderingContext2D;
  lastActiveColor: string;
  lastAccentColor: string;
};

function textureNebulaAlpha(context: CanvasRenderingContext2D, width: number, height: number) {
  // Three seeded scales make the gas uneven without changing its envelope.
  // Modify this mask only: dark channels subtract nebula light, never paint
  // black across objects that happen to sit behind or in front of it.
  const grids = [
    { columns: 13, rows: 9, weight: 0.44 },
    { columns: 35, rows: 19, weight: 0.34 },
    { columns: 79, rows: 43, weight: 0.22 },
  ].map((grid, octave) => ({
    ...grid,
    values: Float32Array.from(
      { length: grid.columns * grid.rows },
      (_, index) => seededRandom(45_310 + octave * 2_309 + index * 13.7),
    ),
  }));
  const pixels = context.getImageData(0, 0, width, height);
  // Sample at two-pixel intervals; the finest gas features span ~10px, so this
  // preserves texture while avoiding four redundant noise evaluations.
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const alphaIndex = (y * width + x) * 4 + 3;
      if (pixels.data[alphaIndex] === 0) continue;
      let detail = 0;
      for (const grid of grids) {
        const gx = x / width * (grid.columns - 1);
        const gy = y / height * (grid.rows - 1);
        const ix = Math.floor(gx);
        const iy = Math.floor(gy);
        const fx = gx - ix;
        const fy = gy - iy;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const topLeft = grid.values[iy * grid.columns + ix];
        const bottomLeft = grid.values[(iy + 1) * grid.columns + ix];
        const top = topLeft + (grid.values[iy * grid.columns + ix + 1] - topLeft) * sx;
        const bottom = bottomLeft
          + (grid.values[(iy + 1) * grid.columns + ix + 1] - bottomLeft) * sx;
        detail += (top + (bottom - top) * sy) * grid.weight;
      }
      const density = 0.5 + detail;
      pixels.data[alphaIndex] *= density;
      pixels.data[alphaIndex + 4] *= density;
      pixels.data[alphaIndex + width * 4] *= density;
      pixels.data[alphaIndex + width * 4 + 4] *= density;
    }
  }
  context.putImageData(pixels, 0, 0);

  context.globalCompositeOperation = 'destination-out';
  context.lineCap = 'round';
  context.filter = 'blur(5px)';
  for (let channel = 0; channel < 7; channel += 1) {
    const seed = 47_120 + channel * 47.3;
    const startX = width * (0.17 + seededRandom(seed) * 0.16);
    const endX = width * (0.65 + seededRandom(seed + 1.9) * 0.14);
    const baseY = height * (0.28 + seededRandom(seed + 3.1) * 0.4);
    const bend = (seededRandom(seed + 5.7) - 0.5) * height * 0.25;
    context.strokeStyle = `rgba(0, 0, 0, ${0.17 + seededRandom(seed + 7.9) * 0.16})`;
    context.lineWidth = 3 + seededRandom(seed + 9.1) * 7;
    context.beginPath();
    context.moveTo(startX, baseY);
    context.bezierCurveTo(
      width * 0.39, baseY + bend,
      width * 0.54, baseY - bend * 0.7,
      endX, baseY + bend * 0.3,
    );
    context.stroke();
  }
  context.filter = 'none';
  context.globalCompositeOperation = 'source-over';
}

function createNebulaAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 380;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(18px)';
  for (let index = 0; index < 6; index += 1) {
    const y = canvas.height * (0.34 + index * 0.055);
    const bend = (seededRandom(index * 4.7 + 20) - 0.5) * canvas.height * 0.34;
    context.strokeStyle = `rgba(255, 255, 255, ${0.07 + index * 0.008})`;
    context.lineWidth = 18 + seededRandom(index * 6.3 + 21) * 22;
    context.beginPath();
    context.moveTo(canvas.width * 0.08, y);
    context.bezierCurveTo(
      canvas.width * 0.3,
      y - bend,
      canvas.width * 0.62,
      y + bend,
      canvas.width * 0.92,
      y - bend * 0.25,
    );
    context.stroke();
  }

  context.filter = 'blur(11px)';
  for (let index = 0; index < 34; index += 1) {
    const broadLayer = index < 10;
    const x = canvas.width * (0.12 + seededRandom(index * 5.1 + 1) * 0.76);
    const y = canvas.height * (0.2 + seededRandom(index * 7.7 + 2) * 0.62);
    const radius = canvas.width * (
      broadLayer
        ? 0.13 + seededRandom(index * 9.3 + 3) * 0.07
        : 0.035 + seededRandom(index * 9.3 + 3) * 0.065
    );
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const coreAlpha = broadLayer
      ? 0.11 + seededRandom(index * 11.9 + 4) * 0.1
      : 0.16 + seededRandom(index * 11.9 + 4) * 0.14;
    gradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(0.28, `rgba(255, 255, 255, ${coreAlpha * 0.68})`);
    gradient.addColorStop(0.66, `rgba(255, 255, 255, ${coreAlpha * 0.14})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.filter = 'none';

  textureNebulaAlpha(context, canvas.width, canvas.height);

  // Fade the procedural texture to zero before it reaches the bitmap edges.
  // This prevents the softly blurred cloud from revealing its rectangular bounds.
  context.globalCompositeOperation = 'destination-in';
  const horizontalFade = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horizontalFade.addColorStop(0.16, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(0.84, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const verticalFade = context.createLinearGradient(0, 0, 0, canvas.height);
  verticalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  verticalFade.addColorStop(0.18, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(0.82, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

export function createNebulaSprites(): NebulaSprites | null {
  const alpha = createNebulaAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const accentTint = createTintCanvas(alpha, CLOUD_ACCENT);
  const purpleTint = createTintCanvas(alpha, FOREGROUND_CLOUD_PURPLE);
  if (!activeTint.context || !accentTint.context || !purpleTint.context) return null;

  return {
    filaments: createNebulaFilamentSprites(),
    alpha,
    active: activeTint.canvas,
    accent: accentTint.canvas,
    purple: purpleTint.canvas,
    activeContext: activeTint.context,
    accentContext: accentTint.context,
    lastActiveColor: '',
    lastAccentColor: '',
  };
}

function updateActiveNebulaTint(sprites: NebulaSprites, color: Rgb) {
  sprites.lastActiveColor = updateCloudTint(
    sprites.active,
    sprites.activeContext,
    sprites.alpha,
    color,
    sprites.lastActiveColor,
  );
}

function updateAccentNebulaTint(sprites: NebulaSprites, color: Rgb) {
  sprites.lastAccentColor = updateCloudTint(
    sprites.accent,
    sprites.accentContext,
    sprites.alpha,
    color,
    sprites.lastAccentColor,
  );
}

export function updateNebulaSpriteTints(sprites: NebulaSprites, activeColor: Rgb) {
  const accentColor = getNebulaAccentColor(activeColor);
  updateActiveNebulaTint(sprites, mixRgb(activeColor, accentColor, 0.16));
  updateAccentNebulaTint(sprites, accentColor);
}
