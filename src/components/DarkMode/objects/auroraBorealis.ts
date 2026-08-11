import type {
  CosmicRenderTheme,
  DarkSceneViewport,
  OrbitGeometry,
  Rgb,
} from '../core/contracts';
import {
  createTintCanvas,
  mixRgb,
  updateCloudTint,
} from '../core/colorCanvas';
import { seededRandom } from '../core/math';
import {
  DEFAULT_ACTIVE_COLOR,
  FOREGROUND_CLOUD_PURPLE,
} from '../core/theme';

export type AuroraSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  purple: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  lastActiveColor: string;
};

function createAuroraAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 340;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(9px)';
  for (let ribbon = 0; ribbon < 14; ribbon += 1) {
    const seed = ribbon * 19.7 + 310;
    const position = (ribbon + 0.22 + seededRandom(seed) * 0.56) / 14;
    const x = canvas.width * (0.04 + position * 0.91);
    const orbitX = -0.48 + position * 1.4;
    const ellipseHeight = Math.sqrt(Math.max(0, 1 - orbitX * orbitX));
    const baseY = canvas.height * (0.54 + (1 - ellipseHeight) * 0.68);
    const ribbonHeight = Math.min(
      baseY - canvas.height * 0.04,
      canvas.height * (0.24 + seededRandom(seed + 1.7) * 0.48),
    );
    const topY = baseY - ribbonHeight;
    const halfWidth = 10 + seededRandom(seed + 3.1) * 27;
    const wave = (seededRandom(seed + 5.3) - 0.5) * halfWidth * 1.4;
    const coreAlpha = 0.055 + seededRandom(seed + 7.1) * 0.075;
    const gradient = context.createLinearGradient(0, topY, 0, baseY);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.28, `rgba(255, 255, 255, ${coreAlpha * 0.35})`);
    gradient.addColorStop(0.7, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${coreAlpha * 0.16})`);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(x - halfWidth * 0.42, baseY);
    context.bezierCurveTo(
      x - halfWidth,
      topY + ribbonHeight * 0.68,
      x - halfWidth * 0.2 + wave,
      topY + ribbonHeight * 0.22,
      x + wave * 0.45,
      topY,
    );
    context.bezierCurveTo(
      x + halfWidth * 0.22 + wave,
      topY + ribbonHeight * 0.3,
      x + halfWidth,
      topY + ribbonHeight * 0.7,
      x + halfWidth * 0.42,
      baseY,
    );
    context.closePath();
    context.fill();
  }

  context.filter = 'blur(1.5px)';
  for (let ray = 0; ray < 30; ray += 1) {
    const seed = ray * 23.9 + 780;
    const position = (ray + seededRandom(seed)) / 30;
    const x = canvas.width * (0.045 + position * 0.9);
    const orbitX = -0.48 + position * 1.4;
    const ellipseHeight = Math.sqrt(Math.max(0, 1 - orbitX * orbitX));
    const baseY = canvas.height * (0.54 + (1 - ellipseHeight) * 0.68);
    const rayHeight = Math.min(
      baseY - canvas.height * 0.04,
      canvas.height * (0.16 + seededRandom(seed + 2.3) * 0.5),
    );
    const topY = baseY - rayHeight;
    const rayWidth = 0.8 + seededRandom(seed + 4.7) * 2.2;
    const rayAlpha = 0.045 + seededRandom(seed + 6.1) * 0.085;
    const gradient = context.createLinearGradient(0, topY, 0, baseY);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.36, `rgba(255, 255, 255, ${rayAlpha * 0.45})`);
    gradient.addColorStop(0.78, `rgba(255, 255, 255, ${rayAlpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(x - rayWidth * 0.5, topY, rayWidth, rayHeight);
  }
  context.filter = 'none';

  context.globalCompositeOperation = 'destination-in';
  const horizontalFade = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horizontalFade.addColorStop(0.08, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const verticalFade = context.createLinearGradient(0, 0, 0, canvas.height);
  verticalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  verticalFade.addColorStop(0.12, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

export function createAuroraSprites(): AuroraSprites | null {
  const alpha = createAuroraAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const purpleTint = createTintCanvas(alpha, FOREGROUND_CLOUD_PURPLE);
  if (!activeTint.context || !purpleTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    purple: purpleTint.canvas,
    activeContext: activeTint.context,
    lastActiveColor: '',
  };
}

function updateAuroraTint(aurora: AuroraSprites, color: Rgb) {
  aurora.lastActiveColor = updateCloudTint(
    aurora.active,
    aurora.activeContext,
    aurora.alpha,
    color,
    aurora.lastActiveColor,
  );
}

export function drawAuroraBorealis(
  context: CanvasRenderingContext2D,
  aurora: AuroraSprites,
  orbit: OrbitGeometry,
  viewport: DarkSceneViewport,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  updateAuroraTint(
    aurora,
    mixRgb(activeColor, renderTheme.neutralStarColor, 0.08),
  );
  const motionTime = reducedMotion ? 0 : time;
  const auroraWidth = orbit.radiusX * (viewport.compact ? 1.36 : 1.38);
  const auroraHeight = Math.min(
    viewport.height * (viewport.compact ? 0.26 : 0.38),
    viewport.compact ? 220 : 340,
  );
  const localX = -orbit.radiusX * (viewport.compact ? 0.48 : 0.46);
  const localY = -orbit.radiusY * 0.92 - auroraHeight * 0.54;
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000044 + 0.8) * 10;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000036 + 1.7) * 5;
  const opacityPulse = reducedMotion
    ? 0.86
    : 0.8 + Math.sin(motionTime * 0.00018 + 0.4) * 0.14;
  const stretch = reducedMotion ? 1 : 1 + Math.sin(motionTime * 0.000027 + 2.1) * 0.018;
  const shear = reducedMotion ? 0 : Math.sin(motionTime * 0.000052 + 1.2) * 0.025;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(orbit.centerX, orbit.centerY);
  context.rotate(orbit.tilt);
  context.globalAlpha = renderTheme.aurora.purpleAlpha * opacityPulse;
  context.drawImage(
    aurora.purple,
    localX - driftX * 0.45,
    localY + driftY * 0.4,
    auroraWidth * 1.025,
    auroraHeight * 1.035,
  );

  context.save();
  context.translate(localX + driftX, localY + driftY);
  context.transform(stretch, 0, shear, 1, 0, 0);
  context.globalAlpha = renderTheme.aurora.activeAlpha * opacityPulse;
  context.drawImage(aurora.active, 0, 0, auroraWidth, auroraHeight);
  context.restore();
  context.restore();
}
