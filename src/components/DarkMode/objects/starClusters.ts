import type {
  CosmicRenderTheme,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import {
  drawStar,
  getAnimatedStarColor,
  rgba,
} from '../core/colorCanvas';
import { clamp, seededRandom, snapToPixel, TAU } from '../core/math';
import {
  drawOnDepthFieldSurface,
  getDepthFieldSurface,
} from '../core/parallax';
import {
  DEPTH_FIELD_STAR_STRENGTH,
  PARALLAX_DEPTH,
  STAR_COLOR_FADE_MS,
} from '../core/theme';

const DARK_CLUSTER_PALETTE: readonly Rgb[] = [
  [235, 243, 255],
  [166, 199, 255],
  [194, 174, 255],
  [255, 220, 148],
];

export type ClusterLayer = 'far' | 'ring';

type ClusterHighlight = {
  localX: number;
  localY: number;
  size: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
  tintStrength: number;
};

export type StarCluster = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  depth: number;
  phase: number;
  drift: number;
  layer: ClusterLayer;
  sprite: HTMLCanvasElement;
  highlights: ClusterHighlight[];
};

type StarClusterSpec = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  weight: number;
  depth: number;
  drift: number;
  layer: ClusterLayer;
};

function getClusterPoint(
  spec: StarClusterSpec,
  index: number,
  seedOffset: number,
): [number, number] {
  const margin = Math.max(6, spec.drift + 3);
  let fallbackX = spec.width * 0.5;
  let fallbackY = spec.height * 0.5;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const seed = seedOffset + index * 17.31 + attempt * 101.7;
    const firstRandom = Math.max(seededRandom(seed + 1.3), 0.0001);
    const secondRandom = seededRandom(seed + 2.9);
    const radius = Math.min(2.6, Math.sqrt(-2 * Math.log(firstRandom)));
    const angle = secondRandom * TAU;
    const haloScale = seededRandom(seed + 4.7) < 0.25
      ? 1.18 + seededRandom(seed + 6.1) * 0.28
      : 1;
    const localX = radius * Math.cos(angle) * spec.width * 0.17 * haloScale;
    const localY = radius * Math.sin(angle) * spec.height * 0.17 * haloScale;
    const cosRotation = Math.cos(spec.rotation);
    const sinRotation = Math.sin(spec.rotation);
    const rotatedX = localX * cosRotation - localY * sinRotation;
    const rotatedY = localX * sinRotation + localY * cosRotation;
    const x = spec.width * 0.5 + rotatedX;
    const y = spec.height * 0.5 + rotatedY;
    fallbackX = x;
    fallbackY = y;

    if (
      x >= margin
      && x <= spec.width - margin
      && y >= margin
      && y <= spec.height - margin
    ) {
      return [x, y];
    }
  }

  return [
    clamp(fallbackX, margin, spec.width - margin),
    clamp(fallbackY, margin, spec.height - margin),
  ];
}

function createStarClusterSprite(
  spec: StarClusterSpec,
  count: number,
  pixelRatio: number,
  palette: readonly Rgb[],
  seedOffset: number,
) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(spec.width * pixelRatio));
  canvas.height = Math.max(1, Math.round(spec.height * pixelRatio));
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const physicalPixel = 1 / pixelRatio;

  for (let index = 0; index < count; index += 1) {
    const seed = seedOffset + index * 23.73;
    const [rawX, rawY] = getClusterPoint(spec, index, seedOffset);
    const x = Math.round(rawX * pixelRatio) / pixelRatio;
    const y = Math.round(rawY * pixelRatio) / pixelRatio;
    const tone = seededRandom(seed + 3.4);
    const paletteIndex = tone < 0.76 ? 0 : tone < 0.87 ? 1 : tone < 0.93 ? 2 : 3;
    const color = palette[paletteIndex];
    const alpha = 0.34 + seededRandom(seed + 5.2) * 0.48;
    const shape = seededRandom(seed + 8.6);
    const size = Math.max(physicalPixel, 0.38 + seededRandom(seed + 7.1) * 0.48);

    if (shape < 0.84) {
      const left = Math.round((x - size * 0.5) * pixelRatio) / pixelRatio;
      const top = Math.round((y - size * 0.5) * pixelRatio) / pixelRatio;
      context.fillStyle = rgba(color, alpha);
      context.fillRect(left, top, size, size);
      continue;
    }

    if (shape < 0.97) {
      const radius = Math.max(physicalPixel, size * 0.78);
      context.fillStyle = rgba(color, alpha);
      context.beginPath();
      context.moveTo(x, y - radius);
      context.lineTo(x + radius, y);
      context.lineTo(x, y + radius);
      context.lineTo(x - radius, y);
      context.closePath();
      context.fill();
      continue;
    }

    const arm = Math.max(2.2, size * 2.8);
    context.fillStyle = rgba(color, alpha * 0.24);
    context.fillRect(x - arm, y - physicalPixel * 0.5, arm * 2, physicalPixel);
    context.fillRect(x - physicalPixel * 0.5, y - arm, physicalPixel, arm * 2);
    context.fillStyle = rgba(color, alpha);
    context.fillRect(x - size * 0.5, y - size * 0.5, size, size);
  }

  return canvas;
}

function createClusterHighlights(
  spec: StarClusterSpec,
  count: number,
  seedOffset: number,
): ClusterHighlight[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = seedOffset + index * 31.17;
    const [localX, localY] = getClusterPoint(spec, index, seedOffset + 7000);
    return {
      localX,
      localY,
      size: 0.82 + seededRandom(seed + 1.9) * 0.9,
      phase: seededRandom(seed + 3.7) * TAU,
      colorSeed: seed * 0.73,
      colorOffset: seededRandom(seed + 5.3) * STAR_COLOR_FADE_MS,
      tintStrength: 0.42 + seededRandom(seed + 7.1) * 0.5,
    };
  });
}

export function createStarClusters(
  width: number,
  height: number,
  compact: boolean,
  pixelRatio: number,
): StarCluster[] {
  const specs: StarClusterSpec[] = compact
    ? [
        {
          centerX: width * 0.15,
          centerY: height * 0.2,
          width: width * 0.68,
          height: Math.min(height * 0.24, 230),
          rotation: -0.12,
          weight: 0.28,
          depth: 0.52,
          drift: 2.4,
          layer: 'far',
        },
        {
          centerX: width * 0.83,
          centerY: height * 0.22,
          width: width * 0.62,
          height: Math.min(height * 0.24, 230),
          rotation: 0.14,
          weight: 0.26,
          depth: 0.58,
          drift: 2.8,
          layer: 'far',
        },
        {
          centerX: width * 0.54,
          centerY: height * 0.67,
          width: width * 1.04,
          height: Math.min(height * 0.28, 270),
          rotation: 0.17,
          weight: 0.46,
          depth: 0.9,
          drift: 3.2,
          layer: 'ring',
        },
      ]
    : [
        {
          centerX: width * 0.14,
          centerY: height * 0.2,
          width: Math.min(width * 0.38, 580),
          height: Math.min(height * 0.26, 270),
          rotation: -0.12,
          weight: 0.18,
          depth: 0.46,
          drift: 3,
          layer: 'far',
        },
        {
          centerX: width * 0.79,
          centerY: height * 0.21,
          width: Math.min(width * 0.39, 620),
          height: Math.min(height * 0.27, 280),
          rotation: 0.14,
          weight: 0.2,
          depth: 0.54,
          drift: 3.4,
          layer: 'far',
        },
        {
          centerX: width * 0.42,
          centerY: height * 0.57,
          width: Math.min(width * 0.72, 1040),
          height: Math.min(height * 0.22, 245),
          rotation: 0.17,
          weight: 0.34,
          depth: 0.84,
          drift: 4,
          layer: 'ring',
        },
        {
          centerX: width * 0.77,
          centerY: height * 0.7,
          width: Math.min(width * 0.48, 720),
          height: Math.min(height * 0.3, 320),
          rotation: 0.2,
          weight: 0.28,
          depth: 0.92,
          drift: 4.5,
          layer: 'ring',
        },
      ];
  const totalStarCount = compact
    ? clamp(Math.round((width * height) / 3300), 100, 180)
    : clamp(Math.round((width * height) / 2700), 240, 440);
  const spritePixelRatio = Math.min(pixelRatio, compact ? 1.25 : 1.5);

  return specs.map((spec, index): StarCluster => {
    const count = Math.max(1, Math.round(totalStarCount * spec.weight));
    const highlightCount = Math.max(2, Math.round(count * 0.06));
    const seedOffset = 1700 + index * 911;
    return {
      centerX: spec.centerX,
      centerY: spec.centerY,
      width: spec.width,
      height: spec.height,
      depth: spec.depth,
      phase: seededRandom(seedOffset + 11) * TAU,
      drift: spec.drift,
      layer: spec.layer,
      sprite: createStarClusterSprite(
        spec,
        count,
        spritePixelRatio,
        DARK_CLUSTER_PALETTE,
        seedOffset,
      ),
      highlights: createClusterHighlights(spec, highlightCount, seedOffset),
    };
  });
}

function getStarClusterMotion(
  cluster: StarCluster,
  time: number,
  reducedMotion: boolean,
): [number, number, number] {
  if (reducedMotion) return [0, 0, 0.92];

  const driftSpeed = 0.000042 + cluster.depth * 0.000009;
  const driftX = Math.sin(time * driftSpeed + cluster.phase) * cluster.drift;
  const driftY = Math.cos(time * driftSpeed * 0.82 + cluster.phase)
    * cluster.drift
    * 0.72;
  const opacityPulse = 0.92 + Math.sin(time * 0.00022 + cluster.phase) * 0.05;
  return [driftX, driftY, opacityPulse];
}

export function drawStarClusterSprites(
  context: CanvasRenderingContext2D,
  clusters: readonly StarCluster[],
  pixelRatio: number,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  layer: ClusterLayer,
  parallax: ParallaxFrame,
) {
  for (const cluster of clusters) {
    if (cluster.layer !== layer) continue;
    const [driftX, driftY, opacityPulse] = getStarClusterMotion(
      cluster,
      time,
      reducedMotion,
    );
    const anchorX = cluster.centerX + driftX;
    const anchorY = cluster.centerY + driftY;
    const surface = getDepthFieldSurface(
      parallax,
      anchorX,
      anchorY,
      {
        translationDepth: cluster.depth * PARALLAX_DEPTH.starClusters,
        perspectiveDepth: cluster.depth,
        perspectiveStrength: DEPTH_FIELD_STAR_STRENGTH.cluster,
      },
    );
    const x = snapToPixel(anchorX - cluster.width * 0.5, pixelRatio);
    const y = snapToPixel(anchorY - cluster.height * 0.5, pixelRatio);
    const { sprite } = cluster;
    drawOnDepthFieldSurface(context, surface, () => {
      context.globalAlpha = renderTheme.starClusters.baseAlpha
        * opacityPulse
        * surface.alphaScale;
      context.drawImage(
        sprite,
        0,
        0,
        sprite.width,
        sprite.height,
        x,
        y,
        cluster.width,
        cluster.height,
      );
    });
  }
}

export function drawStarClusterHighlights(
  context: CanvasRenderingContext2D,
  clusters: readonly StarCluster[],
  pixelRatio: number,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  layer: ClusterLayer,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  for (const cluster of clusters) {
    if (cluster.layer !== layer) continue;
    const [driftX, driftY] = getStarClusterMotion(cluster, time, reducedMotion);
    const anchorX = cluster.centerX + driftX;
    const anchorY = cluster.centerY + driftY;
    const originX = anchorX - cluster.width * 0.5;
    const originY = anchorY - cluster.height * 0.5;
    const surface = getDepthFieldSurface(
      parallax,
      anchorX,
      anchorY,
      {
        translationDepth: cluster.depth * PARALLAX_DEPTH.starClusters,
        perspectiveDepth: cluster.depth,
        perspectiveStrength: DEPTH_FIELD_STAR_STRENGTH.cluster,
      },
    );

    drawOnDepthFieldSurface(context, surface, () => {
      for (const highlight of cluster.highlights) {
        const twinkle = reducedMotion
          ? 0.74
          : 0.67 + Math.sin(time * 0.00115 + highlight.phase) * 0.26;
        const color = getAnimatedStarColor(
          highlight.colorSeed,
          highlight.colorOffset,
          motionTime,
          activeColor,
          renderTheme.neutralStarColor,
          highlight.tintStrength,
        );
        const x = snapToPixel(originX + highlight.localX, pixelRatio);
        const y = snapToPixel(originY + highlight.localY, pixelRatio);
        const alpha = renderTheme.starClusters.highlightAlpha
          * (0.62 + cluster.depth * 0.38)
          * twinkle
          * surface.alphaScale;
        drawStar(context, x, y, highlight.size, color, alpha);
      }
    });
  }
}
