import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { rgba } from '../core/colorCanvas';
import { clamp, createSeededRandom, smoothstep, TAU } from '../core/math';
import { drawDepthImage } from '../core/parallax';
import { LIGHT_DEPTH_PROFILES } from '../core/theme';
import { sampleForestSkyline } from './landscapeShared';
import type { ForestSkylinePoint } from './landscapeShared';

type ForegroundTreeLine = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  opacity: number;
  sprite: HTMLCanvasElement;
};

const FOREGROUND_TREE_BLACK: Rgb = [36, 38, 34];
const FOREGROUND_TREE_WARM_BLACK: Rgb = [179, 150, 105];
const FOREGROUND_TREE_BACK: Rgb = [98, 99, 92];

type ForestFoliageZone = Readonly<{
  start: number;
  end: number;
  topStart: number;
  topEnd: number;
  baseY: number;
  count: number;
  minimumWidth: number;
  maximumWidth: number;
}>;

type ForestPineAnchor = Readonly<{
  x: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  variant: number;
  rotation?: number;
}>;

type ForestPaletteStop = Readonly<{
  offset: number;
  color: Rgb;
}>;


function createForestLayerCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawOrganicFoliageShape(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  random: () => number,
  opacity: number,
) {
  const pointCount = 8 + Math.floor(random() * 4);
  const points = Array.from({ length: pointCount }, (_, index) => {
    const angle = index / pointCount * TAU;
    const radius = 0.7 + random() * 0.32;
    return {
      x: centerX + Math.cos(angle) * radiusX * radius,
      y: centerY + Math.sin(angle) * radiusY * radius,
    };
  });
  const first = points[0];
  const last = points[points.length - 1];
  context.beginPath();
  context.moveTo((first.x + last.x) * 0.5, (first.y + last.y) * 0.5);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) * 0.5,
      (point.y + next.y) * 0.5,
    );
  }
  context.closePath();
  context.fillStyle = `rgba(255,255,255,${opacity})`;
  context.fill();
}

function createFoliageBrush(seed: number) {
  const width = 112;
  const height = 82;
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);

  drawOrganicFoliageShape(context, width * 0.5, height * 0.54, 31, 22, random, 0.9);
  for (let index = 0; index < 52; index += 1) {
    const angle = random() * TAU;
    const distance = Math.pow(random(), 0.82);
    drawOrganicFoliageShape(
      context,
      width * 0.5 + Math.cos(angle) * width * 0.34 * distance,
      height * 0.53 + Math.sin(angle) * height * 0.31 * distance,
      5 + random() * 13,
      3 + random() * 8,
      random,
      0.35 + random() * 0.45,
    );
  }

  for (let index = 0; index < 38; index += 1) {
    const angle = random() * TAU;
    drawOrganicFoliageShape(
      context,
      width * 0.5 + Math.cos(angle) * width * (0.3 + random() * 0.13),
      height * 0.53 + Math.sin(angle) * height * (0.27 + random() * 0.11),
      2.5 + random() * 6,
      1.5 + random() * 4,
      random,
      0.18 + random() * 0.34,
    );
  }
  return canvas;
}

function drawCanopyBranchSystem(
  context: CanvasRenderingContext2D,
  x: number,
  canopyY: number,
  canopyWidth: number,
  canopyHeight: number,
  random: () => number,
) {
  const lean = (random() - 0.5) * canopyWidth * 0.24;
  const baseY = canopyY + canopyHeight * (0.48 + random() * 0.42);
  const baseX = x - lean * (0.18 + random() * 0.2);
  context.save();
  context.strokeStyle = `rgba(255,255,255,${0.32 + random() * 0.16})`;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = Math.max(1, canopyWidth * (0.017 + random() * 0.009));
  context.beginPath();
  context.moveTo(baseX, baseY);
  context.quadraticCurveTo(
    x + lean * 0.18,
    canopyY + canopyHeight * 0.52,
    x + lean,
    canopyY + canopyHeight * 0.06,
  );
  context.stroke();

  const forkCount = 4 + Math.floor(random() * 3);
  for (let fork = 0; fork < forkCount; fork += 1) {
    const progress = 0.18 + random() * 0.5;
    const startY = baseY + (canopyY - baseY) * progress;
    const startX = baseX + (lean + x - baseX) * progress;
    const side = fork % 2 === 0 ? -1 : 1;
    const endX = x + canopyWidth * (0.16 + random() * 0.34) * side;
    const endY = canopyY - canopyHeight * (0.02 + random() * 0.3);
    context.globalAlpha = 0.56 + random() * 0.2;
    context.lineWidth = Math.max(0.65, canopyWidth * (0.007 + random() * 0.007));
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      startX + (endX - startX) * (0.38 + random() * 0.2),
      startY - canopyHeight * (0.06 + random() * 0.12),
      endX,
      endY,
    );
    context.stroke();

    const twigSide = random() < 0.5 ? -1 : 1;
    const twigStartX = startX + (endX - startX) * (0.56 + random() * 0.14);
    const twigStartY = startY + (endY - startY) * (0.56 + random() * 0.14);
    const twigEndX = twigStartX + canopyWidth * (0.07 + random() * 0.12) * twigSide;
    const twigEndY = twigStartY - canopyHeight * (0.08 + random() * 0.13);
    context.globalAlpha = 0.38 + random() * 0.18;
    context.lineWidth = Math.max(0.5, canopyWidth * (0.004 + random() * 0.004));
    context.beginPath();
    context.moveTo(twigStartX, twigStartY);
    context.quadraticCurveTo(
      twigStartX + (twigEndX - twigStartX) * 0.48,
      twigStartY - canopyHeight * 0.04,
      twigEndX,
      twigEndY,
    );
    context.stroke();
  }
  context.restore();
}

function createPineBrush(seed: number) {
  const width = 220;
  const height = 340;
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);
  const lean = (random() - 0.5) * width * 0.12;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(255,255,255,0.88)';
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(width * 0.49, height);
  context.quadraticCurveTo(width * 0.51, height * 0.45, width * 0.5 + lean, height * 0.025);
  context.stroke();

  const branchCount = 34;
  for (let tier = 0; tier < branchCount; tier += 1) {
    const progress = 0.025 + (tier + random() * 0.7) / branchCount * 0.91;
    const spineX = width * 0.5 + lean * (1 - progress);
    const y = height * progress;
    const envelope = width * (0.018 + Math.pow(progress, 0.72) * 0.44);
    for (const side of [-1, 1]) {
      const reach = envelope * (0.72 + random() * 0.28);
      const tipY = y + height * (0.015 + progress * 0.012) * (0.25 + random());
      context.strokeStyle = 'rgba(255,255,255,0.86)';
      context.lineWidth = 0.8 + progress * 2.5;
      context.beginPath();
      context.moveTo(spineX, y - 1);
      context.quadraticCurveTo(spineX + side * reach * 0.48, y + 5, spineX + side * reach, tipY);
      context.stroke();
      const clusters = 3 + Math.floor(progress * 5);
      for (let cluster = 0; cluster < clusters; cluster += 1) {
        const t = (cluster + 0.35 + random() * 0.5) / clusters;
        const x = spineX + side * reach * t;
        const cy = y + (tipY - y) * t + (random() - 0.5) * 7;
        const radiusX = (5 + progress * 10) * (0.65 + random() * 0.65);
        const radiusY = (3 + progress * 9) * (0.65 + random() * 0.5);
        drawOrganicFoliageShape(context, x, cy, radiusX, radiusY, random, 0.65 + random() * 0.32);
        // Fine sprays break up each branch edge without repeating a sawtooth.
        context.strokeStyle = 'rgba(255,255,255,0.72)';
        context.lineWidth = 0.65;
        for (let needle = 0; needle < 5; needle += 1) {
          const nx = x + (random() - 0.5) * radiusX * 1.5;
          const ny = cy + (random() - 0.5) * radiusY;
          context.beginPath();
          context.moveTo(nx - side * 2, ny + 2);
          context.lineTo(nx + side * (2 + random() * 5), ny - 2 - random() * 5);
          context.stroke();
        }
      }
    }
  }
  return canvas;
}

function createPineForestBand(
  seed: number,
  count: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
  baseY: number,
  minimumOpacity: number,
  maximumOpacity: number,
) {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, (_, index): ForestPineAnchor => {
    const horizontalStep = 1.1 / count;
    const x = -0.05
      + (index + 0.2 + random() * 0.6) * horizontalStep
      + (random() - 0.5) * horizontalStep * 0.52;
    const skylineY = sampleForestSkyline(skyline, x);
    const top = clamp(skylineY - 0.018 - random() * 0.092, 0.035, baseY - 0.16);
    const height = baseY + 0.08 + random() * 0.055 - top;
    return {
      x,
      top,
      width: height * (0.135 + random() * 0.078),
      height,
      opacity: minimumOpacity + random() * (maximumOpacity - minimumOpacity),
      variant: Math.floor(random() * 3),
      rotation: (random() - 0.5) * 0.035,
    };
  });
}

function drawForestCanopyUnderlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
  random: () => number,
) {
  const samples: Array<ForestSkylinePoint> = [];
  for (let segment = 0; segment < skyline.length - 1; segment += 1) {
    const start = skyline[segment];
    const end = skyline[segment + 1];
    const sampleCount = Math.max(3, Math.ceil((end[0] - start[0]) * 120));
    for (let index = 0; index < sampleCount; index += 1) {
      const mix = index / sampleCount;
      const easedMix = mix * mix * (3 - 2 * mix);
      const x = start[0] + (end[0] - start[0]) * mix;
      // Keep the opaque forest floor beneath the crown silhouettes. It must
      // never become a smooth hill-shaped edge in front of the tree branches.
      const baseY = start[1] + (end[1] - start[1]) * easedMix + 0.11;
      const ripple = Math.sin(x * 79) * 0.007 + Math.sin(x * 191 + 1.7) * 0.004;
      samples.push([x, baseY + ripple + (random() - 0.5) * 0.012]);
    }
  }
  const lastPoint = skyline[skyline.length - 1];
  samples.push([lastPoint[0], lastPoint[1] + 0.11]);

  context.save();
  const underlay = context.createLinearGradient(0, height * 0.18, 0, height);
  underlay.addColorStop(0, 'rgba(255,255,255,0.68)');
  underlay.addColorStop(0.55, 'rgba(255,255,255,0.92)');
  underlay.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = underlay;
  context.beginPath();
  context.moveTo(samples[0][0] * width, samples[0][1] * height);
  for (let index = 1; index < samples.length; index += 1) {
    context.lineTo(samples[index][0] * width, samples[index][1] * height);
  }
  context.lineTo(width * 1.08, height * 1.04);
  context.lineTo(width * -0.08, height * 1.04);
  context.closePath();
  context.fill();
  context.restore();
}

function drawForestBrush(
  context: CanvasRenderingContext2D,
  brush: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  opacity: number,
) {
  context.save();
  context.globalAlpha = opacity;
  context.translate(x, y);
  context.rotate(rotation);
  context.drawImage(brush, -width * 0.5, -height * 0.5, width, height);
  context.restore();
}

function drawForestFoliageField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  zones: ReadonlyArray<ForestFoliageZone>,
  random: () => number,
) {
  for (const zone of zones) {
    const lowerFoliageCount = Math.round(zone.count * 1.16);
    for (let index = 0; index < lowerFoliageCount; index += 1) {
      const horizontalMix = random();
      const top = zone.topStart + (zone.topEnd - zone.topStart) * horizontalMix;
      const lowerBandTop = Math.max(top + 0.15, zone.baseY - 0.23);
      const verticalMix = Math.pow(random(), 0.72);
      const x = width * (zone.start + (zone.end - zone.start) * horizontalMix);
      const y = height * (lowerBandTop + (zone.baseY - lowerBandTop) * verticalMix);
      const stampWidth = width * (
        zone.minimumWidth
        + random() * (zone.maximumWidth - zone.minimumWidth)
      ) * (0.84 + verticalMix * 0.44);
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        x,
        y,
        stampWidth,
        stampWidth * (0.62 + random() * 0.28),
        (random() - 0.5) * 0.5,
        0.38 + verticalMix * 0.38 + random() * 0.18,
      );
    }
  }
}

function drawForestBushRows(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  random: () => number,
  baseY: number,
) {
  const rowCount = 8;
  for (let row = 0; row < rowCount; row += 1) {
    const progress = row / (rowCount - 1);
    const count = 64 + row * 7;
    const rowY = baseY - 0.075 + progress * 0.39;
    const rowOffset = row % 2 === 0 ? 0.18 : 0.68;
    for (let index = 0; index < count; index += 1) {
      const x = width * ((index + rowOffset + (random() - 0.5) * 0.56) / count);
      const y = height * (
        rowY
        + Math.sin((index / count) * TAU * (2.2 + row * 0.17) + row) * 0.012
        + (random() - 0.5) * 0.024
      );
      const stampWidth = width * (0.018 + progress * 0.013 + random() * 0.015);
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        x,
        y,
        stampWidth,
        stampWidth * (0.68 + random() * 0.34),
        (random() - 0.5) * 0.42,
        0.48 + progress * 0.16 + random() * 0.25,
      );
    }
  }
}

function drawForestPines(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  anchors: ReadonlyArray<ForestPineAnchor>,
) {
  for (const anchor of anchors) {
    const pineWidth = width * anchor.width;
    const pineHeight = height * anchor.height;
    const brush = brushes[anchor.variant % brushes.length];
    context.save();
    context.globalAlpha = anchor.opacity;
    context.translate(width * anchor.x, height * anchor.top);
    context.rotate(anchor.rotation ?? 0);
    context.drawImage(brush, -pineWidth * 0.5, 0, pineWidth, pineHeight);
    context.restore();
  }
}

function drawPineUndergrowth(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  brushes: ReadonlyArray<HTMLCanvasElement>,
  pines: ReadonlyArray<ForestPineAnchor>,
  random: () => number,
) {
  for (const pine of pines) {
    if (random() > 0.62) continue;
    const pineX = width * pine.x;
    const pineTop = height * pine.top;
    const pineWidth = width * pine.width;
    const pineHeight = height * pine.height;
    const clusterX = pineX + (random() - 0.5) * pineWidth * 0.86;
    const clusterY = pineTop + pineHeight * (0.78 + random() * 0.13);
    const clusterWidth = Math.max(width * 0.016, pineWidth * (0.94 + random() * 0.82));
    const clusterHeight = Math.max(
      height * 0.024,
      pineHeight * (0.064 + random() * 0.042),
    );

    drawCanopyBranchSystem(
      context,
      clusterX,
      clusterY,
      clusterWidth,
      clusterHeight,
      random,
    );
    drawForestBrush(
      context,
      brushes[Math.floor(random() * brushes.length)],
      clusterX,
      clusterY,
      clusterWidth,
      clusterHeight,
      (random() - 0.5) * 0.34,
      0.34 + random() * 0.2,
    );

    const lobeCount = 3 + Math.floor(random() * 3);
    for (let lobe = 0; lobe < lobeCount; lobe += 1) {
      const side = lobe % 2 === 0 ? -1 : 1;
      drawForestBrush(
        context,
        brushes[Math.floor(random() * brushes.length)],
        clusterX + clusterWidth * side * (0.2 + random() * 0.22),
        clusterY + clusterHeight * (0.04 + random() * 0.18),
        clusterWidth * (0.34 + random() * 0.28),
        clusterHeight * (0.38 + random() * 0.3),
        (random() - 0.5) * 0.42,
        0.26 + random() * 0.2,
      );
    }
  }
}

function colorForestMask(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: ReadonlyArray<ForestPaletteStop>,
) {
  context.save();
  context.globalCompositeOperation = 'source-in';
  const gradient = context.createLinearGradient(0, 0, width, 0);
  for (const stop of stops) gradient.addColorStop(stop.offset, rgba(stop.color, 1));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function createForestLayer(
  width: number,
  height: number,
  seed: number,
  foliageBrushes: ReadonlyArray<HTMLCanvasElement>,
  pineBrushes: ReadonlyArray<HTMLCanvasElement>,
  zones: ReadonlyArray<ForestFoliageZone>,
  pines: ReadonlyArray<ForestPineAnchor>,
  palette: ReadonlyArray<ForestPaletteStop>,
  baseY: number,
  skyline: ReadonlyArray<ForestSkylinePoint>,
) {
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = createSeededRandom(seed);

  drawForestCanopyUnderlay(context, width, height, skyline, random);
  drawForestPines(context, width, height, pineBrushes, pines);
  drawPineUndergrowth(context, width, height, foliageBrushes, pines, random);
  drawForestFoliageField(context, width, height, foliageBrushes, zones, random);
  drawForestBushRows(context, width, height, foliageBrushes, random, baseY);

  colorForestMask(context, width, height, palette);
  return canvas;
}

function carveForestMist(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  strength: number,
) {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.translate(width * x, height * y);
  context.scale(1, height * radiusY / (width * radiusX));
  const radius = width * radiusX;
  const mist = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  mist.addColorStop(0, `rgba(0,0,0,${strength})`);
  mist.addColorStop(0.42, `rgba(0,0,0,${strength * 0.72})`);
  mist.addColorStop(0.78, `rgba(0,0,0,${strength * 0.2})`);
  mist.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = mist;
  context.fillRect(-radius, -radius, radius * 2, radius * 2);
  context.restore();
}

function createForegroundTreesSprite() {
  const width = 1800;
  const height = 680;
  const canvas = createForestLayerCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const foliageBrushes = [1109, 2027, 4093, 6029].map(createFoliageBrush);
  const pineBrushes = [3011, 5021, 7013].map(createPineBrush);

  // Valley-shaped silhouettes keep a real opening above the river. Broad
  // woodland and a few legible conifers establish scale; smaller trees merge
  // into each bank. Each plane is rasterized and released during prewarming.
  const skylines: ReadonlyArray<ReadonlyArray<ForestSkylinePoint>> = [
    [[-0.05, 0.09], [0.06, 0.12], [0.16, 0.3], [0.25, 0.42],
      [0.32, 0.56], [0.39, 0.51], [0.46, 0.39], [0.56, 0.4],
      [0.66, 0.28], [0.77, 0.25], [0.87, 0.3], [1.05, 0.24]],
    [[-0.05, 0.13], [0.07, 0.19], [0.17, 0.35], [0.24, 0.42],
      [0.31, 0.62], [0.38, 0.57], [0.45, 0.43], [0.53, 0.49],
      [0.63, 0.36], [0.72, 0.33], [0.85, 0.43], [1.05, 0.39]],
    [[-0.05, 0.13], [0.05, 0.2], [0.13, 0.29], [0.19, 0.46],
      [0.235, 0.39], [0.28, 0.63], [0.34, 0.69], [0.395, 0.63],
      [0.455, 0.51], [0.53, 0.61], [0.6, 0.49], [0.7, 0.44],
      [0.8, 0.58], [0.91, 0.49], [1.05, 0.51]],
    [[-0.05, 0.09], [0.025, 0.14], [0.1, 0.24], [0.165, 0.4],
      [0.2, 0.5], [0.245, 0.46], [0.29, 0.67], [0.34, 0.72],
      [0.39, 0.67], [0.445, 0.6], [0.52, 0.66], [0.575, 0.52],
      [0.65, 0.66], [0.72, 0.56], [0.79, 0.62], [0.88, 0.63], [1.05, 0.56]],
  ];
  const palettes: ReadonlyArray<ReadonlyArray<ForestPaletteStop>> = [
    [{ offset: 0, color: [114, 119, 112] }, { offset: 0.5, color: [156, 145, 131] },
      { offset: 1, color: [210, 187, 146] }],
    [{ offset: 0, color: FOREGROUND_TREE_BACK }, { offset: 0.46, color: [107, 104, 92] },
      { offset: 1, color: [191, 164, 124] }],
    [{ offset: 0, color: [51, 53, 48] }, { offset: 0.35, color: [67, 66, 58] },
      { offset: 0.6, color: [117, 104, 87] }, { offset: 1, color: [186, 157, 116] }],
    [{ offset: 0, color: FOREGROUND_TREE_BLACK }, { offset: 0.26, color: [44, 45, 38] },
      { offset: 0.48, color: [64, 63, 50] }, { offset: 0.69, color: [121, 103, 80] },
      { offset: 1, color: FOREGROUND_TREE_WARM_BLACK }],
  ];
  const heroPines: ForestPineAnchor[] = [
    { x: 0.238, top: 0.37, width: 0.045, height: 0.38, opacity: 0.93, variant: 2, rotation: -0.035 },
    { x: 0.435, top: 0.11, width: 0.082, height: 0.72, opacity: 1, variant: 1, rotation: 0.012 },
    { x: 0.413, top: 0.35, width: 0.042, height: 0.42, opacity: 0.92, variant: 0, rotation: -0.018 },
    { x: 0.485, top: 0.43, width: 0.047, height: 0.35, opacity: 0.87, variant: 2 },
    { x: 0.61, top: 0.42, width: 0.048, height: 0.45, opacity: 0.87, variant: 0 },
    { x: 0.787, top: 0.22, width: 0.072, height: 0.65, opacity: 0.89, variant: 2, rotation: -0.025 },
    { x: 0.933, top: 0.32, width: 0.063, height: 0.61, opacity: 0.77, variant: 0 },
  ];
  for (let plane = 0; plane < 4; plane += 1) {
    const skyline = skylines[plane];
    const random = createSeededRandom(12037 + plane * 2029);
    const zones: ForestFoliageZone[] = [
      { start: -0.07, end: 0.28, topStart: 0.12, topEnd: 0.51, baseY: 0.82, count: 86, minimumWidth: 0.012, maximumWidth: 0.032 },
      { start: 0.27, end: 0.56, topStart: 0.69, topEnd: 0.62, baseY: 0.94, count: 64, minimumWidth: 0.01, maximumWidth: 0.025 },
      { start: 0.55, end: 1.07, topStart: 0.5, topEnd: 0.46, baseY: 0.91, count: 110, minimumWidth: 0.012, maximumWidth: 0.035 },
    ];
    // The river clearing is left open across all four banks.
    const pines = createPineForestBand(13217 + plane * 2111,
      plane === 0 ? 32 : plane === 1 ? 27 : 19, skyline, 0.94, 0.65, 0.98).map((pine) => {
      const clearing = smoothstep(0.25, 0.31, pine.x) * (1 - smoothstep(0.35, 0.4, pine.x));
      const oldTop = pine.top;
      const top = Math.max(pine.top, 0.57 + plane * 0.038);
      const nextTop = oldTop + (top - oldTop) * clearing;
      return { ...pine, height: pine.height - (nextTop - oldTop), top: nextTop };
    });
    const layer = createForestLayer(width, height, 14831 + plane * 1543,
      foliageBrushes, pineBrushes, zones,
      plane >= 2 ? [...pines, ...heroPines] : pines,
      palettes[plane], 0.91, skyline);
    const layerContext = layer.getContext('2d');
    if (!layerContext) {
      layer.width = layer.height = 0;
      continue;
    }

    // Connected broadleaf crowns interrupt the pine rhythm, with the foliage
    // clustered around branch ends rather than floating above the canopy.
    layerContext.globalCompositeOperation = 'source-over';
    for (let tree = 0; tree < 112; tree += 1) {
      const x = -0.04 + tree / 111 * 1.08 + (random() - 0.5) * 0.013;
      const canopyY = sampleForestSkyline(skyline, x) + 0.045 + random() * 0.026;
      const crownWidth = width * (0.018 + random() * 0.022);
      const crownHeight = height * (0.11 + random() * 0.105);
      drawCanopyBranchSystem(layerContext, x * width, canopyY * height, crownWidth, crownHeight * 1.6, random);
      drawForestBrush(layerContext, foliageBrushes[tree % foliageBrushes.length],
        x * width, canopyY * height, crownWidth * 1.5, crownHeight * 1.5,
        (random() - 0.5) * 0.28, 0.98);
    }
    layerContext.globalCompositeOperation = 'source-over';
    colorForestMask(layerContext, width, height, palettes[plane]);
    // Dappled interior foliage gives each bank volume, not just a flat mask.
    // This texture is baked once; the moving scene still draws one sprite.
    layerContext.save();
    layerContext.globalCompositeOperation = 'source-atop';
    for (let fleck = 0; fleck < 4600; fleck += 1) {
      const x = random() * width;
      const y = random() * height;
      const size = 0.6 + random() * 2.3;
      layerContext.fillStyle = fleck % 3 === 0
        ? 'rgba(232,222,180,0.035)' : 'rgba(24,32,25,0.04)';
      layerContext.beginPath();
      layerContext.ellipse(x, y, size * 1.9, size, -0.4, 0, TAU);
      layerContext.fill();
    }
    layerContext.restore();
    if (plane < 3) {
      carveForestMist(layerContext, width, height, 0.33, 0.66, 0.12, 0.17, 0.5);
      carveForestMist(layerContext, width, height, 0.68, 0.59, 0.16, 0.085, 0.27);
      carveForestMist(layerContext, width, height, 0.86, 0.55, 0.1, 0.12, 0.21);
    }
    context.save();
    context.filter = plane === 0 ? 'blur(2.2px)' : plane === 1 ? 'blur(1.1px)' : 'none';
    context.globalAlpha = plane === 0 ? 0.4 : plane === 1 ? 0.56 : plane === 2 ? 0.7 : 0.97;
    context.drawImage(layer, 0, 0);
    context.restore();
    layer.width = layer.height = 0;
  }

  context.save();
  context.globalCompositeOperation = 'source-atop';
  const sunlight = context.createLinearGradient(width * 0.42, 0, width, height * 0.35);
  sunlight.addColorStop(0, 'rgba(245,226,187,0)');
  sunlight.addColorStop(0.45, 'rgba(245,220,175,0.08)');
  sunlight.addColorStop(1, 'rgba(253,232,185,0.34)');
  context.fillStyle = sunlight;
  context.fillRect(0, 0, width, height);
  context.restore();
  for (const brush of [...foliageBrushes, ...pineBrushes]) brush.width = brush.height = 0;
  return canvas;
}

function createForegroundTrees(
  width: number,
  height: number,
  compact: boolean,
  sprite: HTMLCanvasElement,
): ForegroundTreeLine {
  // Do not stretch a landscape woodland into tall poles on phones or tablets.
  const portrait = height > width;
  const forestHeight = compact
    ? Math.min(height * 0.4, width * 0.7)
    : Math.min(height * 0.56, width * 0.6);
  return {
    x: width * 0.5,
    y: height - forestHeight * (compact ? 0.3 : 0.25),
    width: width * (compact ? 1.65 : portrait ? 1.5 : 1.1),
    height: forestHeight,
    depthProfile: LIGHT_DEPTH_PROFILES.foregroundTrees,
    opacity: 0.9,
    sprite,
  };
}

type ForegroundForestScene = ProjectionViewport & {
  foregroundTrees: ForegroundTreeLine;
};

function drawForegroundTrees(
  context: CanvasRenderingContext2D,
  scene: ForegroundForestScene,
  parallax: ParallaxFrame,
) {
  drawDepthImage(
    context,
    scene,
    scene.foregroundTrees.sprite,
    scene.foregroundTrees.x,
    scene.foregroundTrees.y,
    scene.foregroundTrees.width,
    scene.foregroundTrees.height,
    scene.foregroundTrees.depthProfile,
    scene.foregroundTrees.opacity,
    parallax,
  );
}

export type { ForegroundTreeLine };
export {
  createForegroundTreesSprite,
  createForegroundTrees,
  drawForegroundTrees,
};

