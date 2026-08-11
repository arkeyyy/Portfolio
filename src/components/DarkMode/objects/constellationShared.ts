import type {
  ConstellationHazePalette,
  ConstellationRenderTheme,
  CosmicRenderTheme,
  DepthFieldLayer,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { clamp, seededRandom, TAU } from '../core/math';
import { drawOnDepthFieldSurface, getDepthFieldSurface } from '../core/parallax';

export type ConstellationNodeSpec = {
  x: number;
  y: number;
  scale: number;
  phase: number;
  twinkleSpeed: number;
  colorIndex: 0 | 1;
};

export type ConstellationSprites = {
  cloud: HTMLCanvasElement;
  lines: HTMLCanvasElement;
  primaryStar: HTMLCanvasElement;
  secondaryStar: HTMLCanvasElement;
};

type ConstellationStarSizing = {
  ratio: number;
  compactMin: number;
  min: number;
  max: number;
};

export type Constellation = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  phase: number;
  motionScale: number;
  hazeScale: { width: number; height: number };
  starSizing: ConstellationStarSizing;
  nodes: readonly ConstellationNodeSpec[];
  sprites: ConstellationSprites;
};

const CONSTELLATION_SPRITE_PADDING_RATIO = 30 / 512;

function createConstellationCloudSprite(
  palette: ConstellationHazePalette,
  seedOffset: number,
  white: Rgb,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 560;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const drawMistField = (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    alpha: number,
  ) => {
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, rgba(white, alpha));
    gradient.addColorStop(0.34, rgba(white, alpha * 0.76));
    gradient.addColorStop(0.7, rgba(white, alpha * 0.24));
    gradient.addColorStop(1, rgba(white, 0));
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  };

  context.globalCompositeOperation = 'source-over';
  context.filter = 'blur(40px)';
  const broadFields = [
    [0.1, 0.7, 0.46, 0.46, -0.16, 0.2],
    [0.42, 0.48, 0.4, 0.42, 0.14, 0.17],
    [0.8, 0.24, 0.42, 0.36, 0.22, 0.15],
    [0.84, 0.76, 0.38, 0.34, -0.18, 0.13],
    [0.3, 0.16, 0.34, 0.3, 0.12, 0.11],
  ] as const;
  for (const [x, y, radiusX, radiusY, rotation, alpha] of broadFields) {
    drawMistField(
      canvas.width * x,
      canvas.height * y,
      canvas.width * radiusX,
      canvas.height * radiusY,
      rotation,
      alpha,
    );
  }

  context.filter = 'blur(22px)';
  for (let wisp = 0; wisp < 16; wisp += 1) {
    const seed = 43_900 + seedOffset + wisp * 31.9;
    drawMistField(
      canvas.width * (0.04 + seededRandom(seed + 1.1) * 0.92),
      canvas.height * (0.06 + seededRandom(seed + 2.9) * 0.88),
      canvas.width * (0.065 + seededRandom(seed + 4.7) * 0.075),
      canvas.height * (0.055 + seededRandom(seed + 6.5) * 0.11),
      (seededRandom(seed + 8.3) - 0.5) * 1.5,
      0.032 + seededRandom(seed + 10.1) * 0.043,
    );
  }

  context.globalCompositeOperation = 'destination-out';
  context.filter = 'blur(28px)';
  for (let cavity = 0; cavity < 5; cavity += 1) {
    const seed = 47_100 + seedOffset + cavity * 37.3;
    drawMistField(
      canvas.width * (0.2 + seededRandom(seed + 1.5) * 0.6),
      canvas.height * (0.18 + seededRandom(seed + 3.3) * 0.64),
      canvas.width * (0.08 + seededRandom(seed + 5.1) * 0.1),
      canvas.height * (0.09 + seededRandom(seed + 6.9) * 0.12),
      (seededRandom(seed + 8.7) - 0.5) * 1.4,
      0.1 + seededRandom(seed + 10.5) * 0.08,
    );
  }
  context.filter = 'none';

  context.globalCompositeOperation = 'source-in';
  const colorWash = context.createLinearGradient(
    0,
    canvas.height,
    canvas.width,
    0,
  );
  colorWash.addColorStop(0, rgba(palette[0], 1));
  colorWash.addColorStop(0.34, rgba(palette[1], 1));
  colorWash.addColorStop(0.68, rgba(palette[0], 1));
  colorWash.addColorStop(0.86, rgba(palette[2], 1));
  colorWash.addColorStop(1, rgba(palette[3], 1));
  context.fillStyle = colorWash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalCompositeOperation = 'destination-in';
  context.save();
  context.translate(canvas.width * 0.5, canvas.height * 0.5);
  context.scale(canvas.width * 0.52, canvas.height * 0.5);
  const edgeFade = context.createRadialGradient(0, 0, 0, 0, 0, 1);
  edgeFade.addColorStop(0, 'rgba(255, 255, 255, 1)');
  edgeFade.addColorStop(0.5, 'rgba(255, 255, 255, 0.92)');
  edgeFade.addColorStop(0.76, 'rgba(255, 255, 255, 0.54)');
  edgeFade.addColorStop(0.92, 'rgba(255, 255, 255, 0.12)');
  edgeFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = edgeFade;
  context.fillRect(-1, -1, 2, 2);
  context.restore();
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

function createConstellationLinesSprite(
  nodes: readonly ConstellationNodeSpec[],
  edges: readonly (readonly [number, number])[],
  primary: Rgb,
  secondary: Rgb,
  line: Rgb,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const padding = canvas.width * CONSTELLATION_SPRITE_PADDING_RATIO;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;
  const traceEdges = () => {
    context.beginPath();
    for (const [fromIndex, toIndex] of edges) {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      context.moveTo(padding + from.x * width, padding + from.y * height);
      context.lineTo(padding + to.x * width, padding + to.y * height);
    }
  };
  const glowColor = mixRgb(primary, secondary, 0.42);

  context.globalCompositeOperation = 'lighter';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.filter = 'blur(5px)';
  context.strokeStyle = rgba(glowColor, 0.16);
  context.lineWidth = 7;
  traceEdges();
  context.stroke();
  context.filter = 'blur(1.2px)';
  context.strokeStyle = rgba(primary, 0.28);
  context.lineWidth = 3;
  traceEdges();
  context.stroke();
  context.filter = 'none';
  context.strokeStyle = rgba(line, 0.62);
  context.lineWidth = 1.15;
  traceEdges();
  context.stroke();

  return canvas;
}

function createConstellationStarSprite(primary: Rgb, secondary: Rgb, white: Rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const center = canvas.width * 0.5;

  const halo = context.createRadialGradient(center, center, 0, center, center, 68);
  halo.addColorStop(0, rgba(white, 0.94));
  halo.addColorStop(0.08, rgba(primary, 0.72));
  halo.addColorStop(0.26, rgba(secondary, 0.28));
  halo.addColorStop(0.62, rgba(primary, 0.075));
  halo.addColorStop(1, rgba(primary, 0));
  context.fillStyle = halo;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const drawRay = (rotation: number, length: number, width: number, alpha: number) => {
    context.save();
    context.translate(center, center);
    context.rotate(rotation);
    const ray = context.createLinearGradient(-length, 0, length, 0);
    ray.addColorStop(0, rgba(primary, 0));
    ray.addColorStop(0.36, rgba(primary, alpha * 0.2));
    ray.addColorStop(0.5, rgba(white, alpha));
    ray.addColorStop(0.64, rgba(primary, alpha * 0.2));
    ray.addColorStop(1, rgba(primary, 0));
    context.fillStyle = ray;
    context.fillRect(-length, -width * 0.5, length * 2, width);
    context.restore();
  };

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(3px)';
  drawRay(0, 61, 4.2, 0.48);
  drawRay(Math.PI * 0.5, 61, 4.2, 0.48);
  drawRay(Math.PI * 0.25, 39, 2.5, 0.24);
  drawRay(-Math.PI * 0.25, 39, 2.5, 0.24);
  context.filter = 'none';
  drawRay(0, 58, 1.8, 0.96);
  drawRay(Math.PI * 0.5, 58, 1.8, 0.96);
  drawRay(Math.PI * 0.25, 32, 1.05, 0.58);
  drawRay(-Math.PI * 0.25, 32, 1.05, 0.58);

  context.strokeStyle = rgba(secondary, 0.36);
  context.lineWidth = 2.2;
  context.beginPath();
  context.ellipse(center, center, 17, 4.5, -0.12, 0, TAU);
  context.stroke();

  const core = context.createRadialGradient(center, center, 0, center, center, 13);
  core.addColorStop(0, rgba(white, 1));
  core.addColorStop(0.18, rgba(white, 0.98));
  core.addColorStop(0.46, rgba(primary, 0.86));
  core.addColorStop(1, rgba(primary, 0));
  context.fillStyle = core;
  context.beginPath();
  context.arc(center, center, 13, 0, TAU);
  context.fill();
  context.fillStyle = rgba(white, 1);
  context.fillRect(center - 2, center - 2, 4, 4);
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

export function createConstellationSprites(
  nodes: readonly ConstellationNodeSpec[],
  edges: readonly (readonly [number, number])[],
  primary: Rgb,
  secondary: Rgb,
  line: Rgb,
  white: Rgb,
  hazePalette: ConstellationHazePalette,
  hazeSeedOffset: number,
): ConstellationSprites {
  return {
    cloud: createConstellationCloudSprite(hazePalette, hazeSeedOffset, white),
    lines: createConstellationLinesSprite(nodes, edges, primary, secondary, line),
    primaryStar: createConstellationStarSprite(primary, secondary, white),
    secondaryStar: createConstellationStarSprite(secondary, primary, white),
  };
}

function getConstellationMotion(
  constellation: Constellation,
  time: number,
  reducedMotion: boolean,
): [number, number, number, number] {
  if (reducedMotion) {
    return [
      constellation.centerX,
      constellation.centerY,
      constellation.rotation,
      1,
    ];
  }

  const { motionScale } = constellation;
  const driftX = Math.sin(time * 0.000029 + constellation.phase) * 3.4 * motionScale;
  const driftY = Math.cos(time * 0.000023 + constellation.phase * 0.72)
    * 2.6
    * motionScale;
  const rotation = constellation.rotation
    + Math.sin(time * 0.000019 + constellation.phase) * 0.012 * motionScale;
  const pulseAmplitude = 0.015 * motionScale;
  const pulse = 1 - pulseAmplitude
    + Math.sin(time * 0.00031 + constellation.phase) * pulseAmplitude;
  return [
    constellation.centerX + driftX,
    constellation.centerY + driftY,
    rotation,
    pulse,
  ];
}

function getConstellationHazeMotion(
  constellation: Constellation,
  time: number,
  reducedMotion: boolean,
): [number, number, number, number] {
  const { motionScale } = constellation;
  const baseX = constellation.centerX - constellation.width * 0.08;
  const baseY = constellation.centerY + constellation.height * 0.06;
  const baseRotation = constellation.rotation * 0.22;
  if (reducedMotion) return [baseX, baseY, baseRotation, 1];

  const driftX = Math.sin(time * 0.000013 + constellation.phase * 0.63)
    * 4.2
    * motionScale;
  const driftY = Math.cos(time * 0.000011 + constellation.phase * 0.81)
    * 3.4
    * motionScale;
  const rotation = baseRotation
    + Math.sin(time * 0.000006 + constellation.phase) * 0.007 * motionScale;
  const pulseAmplitude = 0.008 * motionScale;
  const pulse = 1 - pulseAmplitude
    + Math.sin(time * 0.000073 + constellation.phase * 0.7) * pulseAmplitude;
  return [baseX + driftX, baseY + driftY, rotation, pulse];
}

export function drawConstellationCloud(
  context: CanvasRenderingContext2D,
  constellation: Constellation,
  time: number,
  renderTheme: CosmicRenderTheme,
  constellationTheme: ConstellationRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  layer: DepthFieldLayer,
) {
  const [centerX, centerY, rotation, pulse] = getConstellationHazeMotion(
    constellation,
    time,
    reducedMotion,
  );
  const surface = getDepthFieldSurface(parallax, centerX, centerY, layer);
  const cloudWidth = constellation.width * constellation.hazeScale.width * pulse;
  const cloudHeight = constellation.height * constellation.hazeScale.height * pulse;

  drawOnDepthFieldSurface(context, surface, () => {
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.globalAlpha = constellationTheme.cloudAlpha * surface.alphaScale;
    context.drawImage(
      constellation.sprites.cloud,
      -cloudWidth * 0.5,
      -cloudHeight * 0.5,
      cloudWidth,
      cloudHeight,
    );
    context.restore();
  });
}

export function drawConstellation(
  context: CanvasRenderingContext2D,
  constellation: Constellation,
  compact: boolean,
  time: number,
  renderTheme: CosmicRenderTheme,
  constellationTheme: ConstellationRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  layer: DepthFieldLayer,
) {
  const motionTime = reducedMotion ? 0 : time;
  const [centerX, centerY, rotation, pulse] = getConstellationMotion(
    constellation,
    time,
    reducedMotion,
  );
  const surface = getDepthFieldSurface(parallax, centerX, centerY, layer);
  const linePulse = reducedMotion
    ? 0.94
    : 0.94 + Math.sin(motionTime * 0.00043 + constellation.phase) * 0.06;
  const contentScale = 1 - CONSTELLATION_SPRITE_PADDING_RATIO * 2;
  const minimumStarSize = compact
    ? constellation.starSizing.compactMin
    : constellation.starSizing.min;
  const baseStarSize = clamp(
    constellation.width * constellation.starSizing.ratio,
    minimumStarSize,
    constellation.starSizing.max,
  );

  drawOnDepthFieldSurface(context, surface, () => {
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.globalAlpha = constellationTheme.lineAlpha * linePulse * surface.alphaScale;
    context.drawImage(
      constellation.sprites.lines,
      -constellation.width * 0.5,
      -constellation.height * 0.5,
      constellation.width,
      constellation.height,
    );

    for (const node of constellation.nodes) {
      const localX = (
        CONSTELLATION_SPRITE_PADDING_RATIO + node.x * contentScale - 0.5
      ) * constellation.width;
      const localY = (
        CONSTELLATION_SPRITE_PADDING_RATIO + node.y * contentScale - 0.5
      ) * constellation.height;
      const twinkle = reducedMotion
        ? 0.9
        : 0.88 + Math.sin(motionTime * node.twinkleSpeed + node.phase) * 0.12;
      const starSize = baseStarSize * node.scale * (0.96 + twinkle * 0.05) * pulse;
      const sprite = node.colorIndex === 0
        ? constellation.sprites.primaryStar
        : constellation.sprites.secondaryStar;
      context.globalAlpha = constellationTheme.starAlpha * twinkle * surface.alphaScale;
      context.drawImage(
        sprite,
        localX - starSize * 0.5,
        localY - starSize * 0.5,
        starSize,
        starSize,
      );
    }
    context.restore();
  });
}
