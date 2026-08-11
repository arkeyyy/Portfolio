import type { CosmicRenderTheme, ParallaxPose, Rgb } from '../core/contracts';
import { drawStar, rgba } from '../core/colorCanvas';
import { clamp, seededRandom, smoothstep, snapToPixel, TAU } from '../core/math';
import { applyParallaxPlaneTilt } from '../core/parallax';

const QUASAR_LIGHT_BLUE: Rgb = [112, 220, 255];
const QUASAR_PURPLE: Rgb = [178, 104, 255];

type QuasarLightParticle = {
  angle: number;
  phase: number;
  speed: number;
  direction: 1 | -1;
  size: number;
  colorIndex: 0 | 1;
};

export type Quasar = {
  centerX: number;
  centerY: number;
  size: number;
  phase: number;
  sprite: HTMLCanvasElement;
  particles: QuasarLightParticle[];
};

export function createQuasarSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const center = canvas.width * 0.5;

  const outerGlow = context.createRadialGradient(center, center, 0, center, center, 142);
  outerGlow.addColorStop(0, rgba(QUASAR_LIGHT_BLUE, 0.2));
  outerGlow.addColorStop(0.22, rgba(QUASAR_PURPLE, 0.13));
  outerGlow.addColorStop(0.58, rgba(QUASAR_LIGHT_BLUE, 0.035));
  outerGlow.addColorStop(1, rgba(QUASAR_PURPLE, 0));
  context.fillStyle = outerGlow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(center, center);
  context.rotate(-0.14);
  context.globalCompositeOperation = 'lighter';

  const jetGradient = context.createLinearGradient(0, -142, 0, 142);
  jetGradient.addColorStop(0, rgba(QUASAR_PURPLE, 0));
  jetGradient.addColorStop(0.32, rgba(QUASAR_LIGHT_BLUE, 0.1));
  jetGradient.addColorStop(0.49, 'rgba(245, 250, 255, 0.42)');
  jetGradient.addColorStop(0.51, 'rgba(245, 250, 255, 0.42)');
  jetGradient.addColorStop(0.68, rgba(QUASAR_LIGHT_BLUE, 0.1));
  jetGradient.addColorStop(1, rgba(QUASAR_PURPLE, 0));

  context.filter = 'blur(14px)';
  context.fillStyle = jetGradient;
  context.beginPath();
  context.moveTo(0, -148);
  context.lineTo(15, -13);
  context.lineTo(8, 13);
  context.lineTo(0, 148);
  context.lineTo(-8, 13);
  context.lineTo(-15, -13);
  context.closePath();
  context.fill();

  context.filter = 'blur(4px)';
  context.globalAlpha = 0.82;
  context.beginPath();
  context.moveTo(0, -138);
  context.lineTo(4.5, -8);
  context.lineTo(0, 0);
  context.lineTo(-4.5, -8);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(0, 138);
  context.lineTo(4.5, 8);
  context.lineTo(0, 0);
  context.lineTo(-4.5, 8);
  context.closePath();
  context.fill();

  context.globalAlpha = 1;
  context.filter = 'blur(11px)';
  context.strokeStyle = rgba(QUASAR_PURPLE, 0.3);
  context.lineWidth = 12;
  context.beginPath();
  context.ellipse(0, 0, 88, 15, 0, 0, TAU);
  context.stroke();

  context.filter = 'blur(3px)';
  context.strokeStyle = rgba(QUASAR_LIGHT_BLUE, 0.66);
  context.lineWidth = 4.5;
  context.beginPath();
  context.ellipse(0, 0, 83, 12, 0, 0, TAU);
  context.stroke();
  context.strokeStyle = rgba(QUASAR_PURPLE, 0.58);
  context.lineWidth = 2.2;
  context.beginPath();
  context.ellipse(0, 0, 62, 8, 0, 0, TAU);
  context.stroke();

  context.filter = 'none';
  const core = context.createRadialGradient(0, 0, 0, 0, 0, 23);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.16, rgba(QUASAR_LIGHT_BLUE, 0.96));
  core.addColorStop(0.5, rgba(QUASAR_PURPLE, 0.42));
  core.addColorStop(1, rgba(QUASAR_PURPLE, 0));
  context.fillStyle = core;
  context.beginPath();
  context.arc(0, 0, 23, 0, TAU);
  context.fill();
  context.restore();

  return canvas;
}

function createQuasarLightParticles(count: number) {
  return Array.from({ length: count }, (_, index): QuasarLightParticle => {
    const seed = 5200 + index * 37.1;
    return {
      angle: seededRandom(seed + 1.3) * TAU,
      phase: seededRandom(seed + 3.7),
      speed: 0.000035 + seededRandom(seed + 5.9) * 0.000024,
      direction: index % 2 === 0 ? 1 : -1,
      size: 0.55 + seededRandom(seed + 7.1) * 1.15,
      colorIndex: index % 3 === 0 ? 1 : 0,
    };
  });
}

export function createQuasar(
  width: number,
  height: number,
  compact: boolean,
  sprite: HTMLCanvasElement,
): Quasar {
  return {
    centerX: width * (compact ? 0.38 : 0.42),
    centerY: height * (compact ? 0.16 : 0.14),
    size: compact
      ? clamp(Math.min(width, height) * 0.26, 104, 144)
      : clamp(Math.min(width, height) * 0.24, 148, 212),
    phase: 1.7,
    sprite,
    particles: createQuasarLightParticles(compact ? 10 : 16),
  };
}

export function drawQuasar(
  context: CanvasRenderingContext2D,
  quasar: Quasar,
  pixelRatio: number,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  viewPose: ParallaxPose,
) {
  const motionTime = reducedMotion ? 0 : time;
  const pulse = reducedMotion
    ? 0.94
    : 0.92 + Math.sin(motionTime * 0.00135 + quasar.phase) * 0.08;
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000031 + 0.4) * 2.5;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000026 + 1.1) * 1.8;
  const centerX = quasar.centerX + driftX;
  const centerY = quasar.centerY + driftY;
  const rotation = -0.14 + Math.sin(viewPose.yaw) * 0.55;
  const discScaleY = clamp(0.29 + Math.sin(viewPose.pitch) * 0.5, 0.2, 0.4);

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(centerX, centerY);
  context.rotate(reducedMotion ? 0 : Math.sin(motionTime * 0.000021) * 0.018);
  applyParallaxPlaneTilt(context, viewPose, 0.6);
  context.globalAlpha = renderTheme.quasar.spriteAlpha * pulse;
  const spriteSize = quasar.size * (0.96 + pulse * 0.04);
  context.drawImage(
    quasar.sprite,
    -spriteSize * 0.5,
    -spriteSize * 0.5,
    spriteSize,
    spriteSize,
  );
  context.restore();

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(centerX, centerY);
  context.rotate(rotation);
  context.lineCap = 'round';
  for (let lens = 0; lens < 3; lens += 1) {
    const radius = quasar.size * (0.17 + lens * 0.055);
    const color = lens % 2 === 0 ? QUASAR_LIGHT_BLUE : QUASAR_PURPLE;
    const lensPulse = reducedMotion
      ? 0.82
      : 0.72 + Math.sin(motionTime * 0.001 + lens * 1.8) * 0.2;
    context.setLineDash([
      radius * (0.9 + lens * 0.12),
      radius * 0.46,
      radius * 0.18,
      radius * 0.62,
    ]);
    context.lineDashOffset = -motionTime * (0.004 + lens * 0.0015) * (lens % 2 === 0 ? 1 : -1);
    context.lineWidth = 0.65 + lens * 0.18;
    context.strokeStyle = rgba(
      color,
      renderTheme.quasar.lensAlpha * lensPulse * (1 - lens * 0.13),
    );
    context.beginPath();
    context.ellipse(0, 0, radius, radius * discScaleY, 0, 0, TAU);
    context.stroke();
  }
  context.setLineDash([]);
  context.restore();

  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.lineCap = 'round';
  for (const particle of quasar.particles) {
    const progress = (motionTime * particle.speed + particle.phase) % 1;
    const previousProgress = Math.max(0, progress - 0.075);
    const radialProgress = smoothstep(
      particle.direction === 1 ? progress : 1 - progress,
    );
    const previousRadialProgress = smoothstep(
      particle.direction === 1 ? previousProgress : 1 - previousProgress,
    );
    const radius = quasar.size * (0.075 + radialProgress * 0.34);
    const previousRadius = quasar.size * (0.075 + previousRadialProgress * 0.34);
    const angle = particle.angle + particle.direction * progress * TAU * 0.72;
    const previousAngle = particle.angle
      + particle.direction * previousProgress * TAU * 0.72;
    const localX = Math.cos(angle) * radius;
    const localY = Math.sin(angle) * radius * discScaleY;
    const previousLocalX = Math.cos(previousAngle) * previousRadius;
    const previousLocalY = Math.sin(previousAngle) * previousRadius * discScaleY;
    const x = snapToPixel(
      centerX + localX * cosRotation - localY * sinRotation,
      pixelRatio,
    );
    const y = snapToPixel(
      centerY + localX * sinRotation + localY * cosRotation,
      pixelRatio,
    );
    const previousX = centerX
      + previousLocalX * cosRotation
      - previousLocalY * sinRotation;
    const previousY = centerY
      + previousLocalX * sinRotation
      + previousLocalY * cosRotation;
    const color = particle.colorIndex === 0 ? QUASAR_LIGHT_BLUE : QUASAR_PURPLE;
    const fade = Math.sin(progress * Math.PI);
    const alpha = renderTheme.quasar.particleAlpha * fade;
    context.strokeStyle = rgba(color, alpha * 0.44);
    context.lineWidth = Math.max(0.5, particle.size * 0.52);
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(x, y);
    context.stroke();
    drawStar(context, x, y, particle.size, color, alpha * 0.86);
  }
  context.restore();
}
