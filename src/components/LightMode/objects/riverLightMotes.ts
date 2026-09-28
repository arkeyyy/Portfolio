import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { rgba } from '../core/colorCanvas';
import { createSeededRandom, smoothstep, TAU } from '../core/math';
import { projectAtDepth } from '../core/parallax';

type RiverLightMoteSprites = {
  atlas: HTMLCanvasElement;
  cellSize: number;
};

type RiverLightMote = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: number;
  hoverSpeed: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
  shapeIndex: 0 | 1 | 2;
  toneIndex: 0 | 1 | 2;
  depthProfile: AtmosphericDepthProfile;
};
const RIVER_LIGHT_MOTE_CELL_SIZE = 64;
const RIVER_LIGHT_MOTE_TONES: readonly [Rgb, Rgb, Rgb] = [
  [244, 252, 255],
  [255, 214, 211],
  [210, 247, 244],
];

function createRiverLightMoteSprites(): RiverLightMoteSprites {
  const cellSize = RIVER_LIGHT_MOTE_CELL_SIZE;
  const atlas = document.createElement('canvas');
  atlas.width = cellSize * 3;
  atlas.height = cellSize * RIVER_LIGHT_MOTE_TONES.length;
  const context = atlas.getContext('2d');
  if (!context) return { atlas, cellSize };

  for (let toneIndex = 0; toneIndex < RIVER_LIGHT_MOTE_TONES.length; toneIndex += 1) {
    const tone = RIVER_LIGHT_MOTE_TONES[toneIndex];
    for (let shapeIndex = 0; shapeIndex < 3; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = toneIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      const bloomRadius = shapeIndex === 1 ? 25 : shapeIndex === 2 ? 21 : 23;

      context.save();
      context.beginPath();
      context.rect(cellX, cellY, cellSize, cellSize);
      context.clip();

      const bloom = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        bloomRadius,
      );
      bloom.addColorStop(0, rgba(tone, shapeIndex === 1 ? 0.42 : 0.36));
      bloom.addColorStop(0.18, rgba(tone, 0.28));
      bloom.addColorStop(0.52, rgba(tone, 0.09));
      bloom.addColorStop(1, rgba(tone, 0));
      context.fillStyle = bloom;
      context.fillRect(cellX, cellY, cellSize, cellSize);

      if (shapeIndex === 1) {
        context.strokeStyle = rgba(tone, 0.82);
        context.lineCap = 'round';
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(centerX, centerY - 10);
        context.lineTo(centerX, centerY + 10);
        context.moveTo(centerX - 7, centerY);
        context.lineTo(centerX + 7, centerY);
        context.stroke();
      }

      const coreRadius = shapeIndex === 1 ? 4.6 : shapeIndex === 2 ? 4.1 : 4.4;
      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius,
      );
      core.addColorStop(0, 'rgba(255,255,255,0.98)');
      core.addColorStop(0.32, rgba(tone, 0.94));
      core.addColorStop(1, rgba(tone, 0));
      context.fillStyle = core;
      if (shapeIndex === 2) {
        context.beginPath();
        context.ellipse(centerX + 0.8, centerY - 0.5, 5.4, 3.7, -0.18, 0, TAU);
        context.fill();
      } else {
        context.fillRect(
          centerX - coreRadius,
          centerY - coreRadius,
          coreRadius * 2,
          coreRadius * 2,
        );
      }
      context.restore();
    }
  }

  return { atlas, cellSize };
}

function createRiverLightMotes(
  width: number,
  height: number,
  compact: boolean,
): RiverLightMote[] {
  const count = compact ? 26 : 44;
  const random = createSeededRandom(compact ? 101833 : 103921);
  const toneRandom = createSeededRandom(compact ? 102653 : 104729);
  const accentRandom = createSeededRandom(compact ? 103681 : 105319);
  const primaryCount = compact ? 14 : 24;
  const secondaryCount = compact ? 8 : 13;
  const pearlCount = compact ? 19 : 32;
  const blushCount = compact ? 4 : 7;
  const accentCount = compact ? 3 : 6;

  const clusterAssignments = Array.from({ length: count }, (_, index) => (
    index < primaryCount ? 0 : index < primaryCount + secondaryCount ? 1 : 2
  ));
  for (let index = clusterAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = clusterAssignments[index];
    clusterAssignments[index] = clusterAssignments[swapIndex];
    clusterAssignments[swapIndex] = value;
  }

  const toneAssignments = Array.from(
    { length: count },
    (_, index): 0 | 1 | 2 => (
      index < pearlCount ? 0 : index < pearlCount + blushCount ? 1 : 2
    ),
  );
  for (let index = toneAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(toneRandom() * (index + 1));
    const value = toneAssignments[index];
    toneAssignments[index] = toneAssignments[swapIndex];
    toneAssignments[swapIndex] = value;
  }

  const accentAssignments = Array.from(
    { length: count },
    (_, index) => index < accentCount,
  );
  for (let index = accentAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(accentRandom() * (index + 1));
    const value = accentAssignments[index];
    accentAssignments[index] = accentAssignments[swapIndex];
    accentAssignments[swapIndex] = value;
  }

  return Array.from({ length: count }, (_, index): RiverLightMote => {
    const cluster = clusterAssignments[index];
    const xRatio = cluster === 0
      ? 0.22 + (random() + random()) * 0.125
      : cluster === 1
        ? 0.08 + (random() + random()) * 0.11
        : 0.45 + (random() + random()) * 0.105;
    const accent = accentAssignments[index];
    const depthMix = random();
    const shapeRoll = random();
    return {
      x: width * xRatio,
      y: height * (0.58 + Math.sqrt(random()) * 0.24),
      size: compact
        ? accent ? 13 + random() * 4 : 5 + random() * 8
        : accent ? 18 + random() * 6 : 7 + random() * 11,
      opacity: accent ? 0.6 + random() * 0.18 : 0.34 + random() * 0.3,
      phase: random() * TAU,
      hoverSpeed: TAU / (8 + random() * 7),
      twinkleSpeed: TAU / (2.8 + random() * 2.7),
      driftX: compact ? 1 + random() * 2 : 1.5 + random() * 3,
      driftY: compact ? 0.75 + random() * 1.5 : 1 + random() * 2,
      shapeIndex: shapeRoll < 0.6 ? 0 : shapeRoll < 0.75 ? 1 : 2,
      toneIndex: toneAssignments[index],
      depthProfile: {
        translation: 0.1 + depthMix * 0.08,
        perspective: 0.08 + depthMix * 0.07,
        tilt: 0,
      },
    };
  });
}

type RiverLightMoteScene = ProjectionViewport & {
  riverLightMotes: RiverLightMote[];
};

function drawRiverLightMotes(
  context: CanvasRenderingContext2D,
  scene: RiverLightMoteScene,
  sprites: RiverLightMoteSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  const motionSeconds = time * 0.001 * scene.motionScale;
  context.save();
  context.globalCompositeOperation = 'source-over';
  context.imageSmoothingEnabled = true;

  for (const mote of scene.riverLightMotes) {
    const x = mote.x + Math.sin(
      motionSeconds * mote.hoverSpeed + mote.phase,
    ) * mote.driftX;
    const y = mote.y + Math.cos(
      motionSeconds * mote.hoverSpeed * 0.83 + mote.phase * 1.37,
    ) * mote.driftY;
    projectAtDepth(
      parallax,
      x,
      y,
      mote.depthProfile,
      scene.projection,
    );

    const twinkleInput = 0.5 + Math.sin(
      motionSeconds * mote.twinkleSpeed + mote.phase * 1.7,
    ) * 0.5;
    const twinkle = 0.62 + smoothstep(0, 1, twinkleInput) * 0.38;
    const scaleInput = 0.5 + Math.sin(
      motionSeconds * mote.twinkleSpeed * 0.83 + mote.phase * 0.91,
    ) * 0.5;
    const size = mote.size
      * scene.projection.scale
      * (0.94 + smoothstep(0, 1, scaleInput) * 0.12);
    const halfSize = size * 0.5;
    if (
      scene.projection.x < -halfSize
      || scene.projection.x > scene.width + halfSize
      || scene.projection.y < -halfSize
      || scene.projection.y > scene.height + halfSize
    ) continue;

    context.globalAlpha = mote.opacity
      * twinkle
      * scene.projection.alphaScale;
    context.drawImage(
      sprites.atlas,
      mote.shapeIndex * sprites.cellSize,
      mote.toneIndex * sprites.cellSize,
      sprites.cellSize,
      sprites.cellSize,
      scene.projection.x - halfSize,
      scene.projection.y - halfSize,
      size,
      size,
    );
  }

  context.restore();
}

export type { RiverLightMote, RiverLightMoteSprites };
export {
  createRiverLightMoteSprites,
  createRiverLightMotes,
  drawRiverLightMotes,
};

