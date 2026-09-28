import type {
  AtmosphericDepthProfile,
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import {
  clamp,
  createSeededRandom,
  positiveModulo,
  smoothstep,
  TAU,
} from '../core/math';
import { projectAtDepth, setSpriteTransform } from '../core/parallax';

type RisingRiverFragmentGlowVariant = -1 | 0 | 1;

type RisingRiverFragmentSprites = {
  colorAtlas: HTMLCanvasElement;
  transitionGlowAtlas: HTMLCanvasElement;
  cellSize: number;
};

type RisingRiverFragment = {
  sourceX: number;
  sourceY: number;
  riseDistance: number;
  phase: number;
  duration: number;
  /** Longest unrotated body dimension in CSS pixels, excluding the atlas padding. */
  baseSize: number;
  terminalScale: number;
  horizontalDrift: number;
  controlX: number;
  sway: number;
  swayCycles: number;
  rotation: number;
  rotationSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  opacity: number;
  shapeIndex: number;
  colorIndex: number;
  glintPeriod: number;
  glintDuration: number;
  glintPhase: number;
  haloStrength: number;
  transitionGlowVariant: RisingRiverFragmentGlowVariant;
  depthProfile: AtmosphericDepthProfile;
};

const RISING_RIVER_FRAGMENT_CELL_SIZE = 80;
const RISING_RIVER_FRAGMENT_BODY_EXTENT = 48;
const RISING_RIVER_FRAGMENT_SHAPE_COUNT = 10;
const RISING_RIVER_FRAGMENT_HIGHLIGHT_ROW = 6;
const RISING_RIVER_FRAGMENT_PALETTE: readonly Rgb[] = [
  [58, 47, 44],    // Charcoal.
  [125, 99, 85],   // Muted brown.
  [173, 124, 120], // Dusty rose.
  [174, 155, 151], // Warm taupe.
  [219, 190, 175], // Pale blush.
  [247, 245, 239], // Pearl white.
];
const RISING_RIVER_FRAGMENT_GLOW_COLORS: readonly [Rgb, Rgb] = [
  [255, 255, 255],
  [174, 155, 151],
];

type FragmentPoint = readonly [number, number];
type FragmentShape = {
  outline: readonly FragmentPoint[];
  light: readonly FragmentPoint[];
  shadow?: readonly FragmentPoint[];
};

/** Temporary geometry used only while baking the two atlases. */
function createRisingRiverFragmentShapes(): FragmentShape[] {
  return [
    {
      outline: [[-8, -24], [24, 24], [-22, 13]],
      light: [[-8, -24], [24, 24], [-3, 7]],
      shadow: [[-8, -24], [-22, 13], [-3, 7]],
    },
    {
      outline: [[-10, -24], [15, 22], [-19, 24], [-6, 4]],
      light: [[-10, -24], [15, 22], [0, 8]],
    },
    {
      outline: [[-24, -12], [24, -24], [10, 24], [3, 11]],
      light: [[-24, -12], [24, -24], [3, 3]],
      shadow: [[24, -24], [10, 24], [3, 3]],
    },
    {
      outline: [[-22, -24], [18, -4], [10, 24], [0, 15], [-14, 22], [-7, -2]],
      light: [[-22, -24], [18, -4], [-2, 5]],
      shadow: [[18, -4], [10, 24], [-2, 5]],
    },
    {
      outline: [[-24, 18], [6, -24], [24, 10], [9, 6], [4, 24], [-2, 9]],
      light: [[6, -24], [24, 10], [0, 4]],
      shadow: [[-24, 18], [6, -24], [0, 4]],
    },
    {
      outline: [[-18, -24], [24, 9], [4, 7], [-8, 24], [-9, 6], [-24, 13]],
      light: [[-18, -24], [24, 9], [-5, 3]],
    },
    {
      outline: [[-8, -24], [20, -5], [8, 24], [-24, 8], [-8, 3]],
      light: [[-8, -24], [20, -5], [1, 4]],
      shadow: [[20, -5], [8, 24], [1, 4]],
    },
    {
      outline: [[6, -24], [24, 1], [6, 24], [-18, 14], [-11, -5]],
      light: [[6, -24], [24, 1], [2, 5]],
      shadow: [[6, 24], [-18, 14], [2, 5]],
    },
    {
      outline: [[-6, -24], [13, -12], [5, 24], [-9, 14], [-4, -4]],
      light: [[-6, -24], [13, -12], [2, 19]],
    },
    {
      outline: [[-13, -24], [6, -15], [15, 24], [-4, 18], [-6, 2], [-17, -7]],
      light: [[-13, -24], [6, -15], [15, 24], [0, 10]],
      shadow: [[-17, -7], [-4, 18], [0, 10]],
    },
  ];
}

function traceRisingRiverFragment(
  context: CanvasRenderingContext2D,
  points: readonly FragmentPoint[],
  centerX: number,
  centerY: number,
) {
  context.beginPath();
  context.moveTo(centerX + points[0][0], centerY + points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(centerX + points[index][0], centerY + points[index][1]);
  }
  context.closePath();
}

function createRisingRiverFragmentSprites(): RisingRiverFragmentSprites {
  const cellSize = RISING_RIVER_FRAGMENT_CELL_SIZE;
  const colorAtlas = document.createElement('canvas');
  colorAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  // Six stable materials and two light-catching versions of each silhouette.
  colorAtlas.height = cellSize * (RISING_RIVER_FRAGMENT_PALETTE.length + 2);
  const colorContext = colorAtlas.getContext('2d');
  const transitionGlowAtlas = document.createElement('canvas');
  transitionGlowAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  transitionGlowAtlas.height = cellSize * RISING_RIVER_FRAGMENT_GLOW_COLORS.length;
  const haloContext = transitionGlowAtlas.getContext('2d');
  if (!colorContext || !haloContext) return { colorAtlas, transitionGlowAtlas, cellSize };

  const shapes = createRisingRiverFragmentShapes();
  const colors: Rgb[] = [
    ...RISING_RIVER_FRAGMENT_PALETTE,
    [249, 252, 255],
    mixRgb(RISING_RIVER_FRAGMENT_GLOW_COLORS[1], [255, 255, 255], 0.18),
  ];

  for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
    const color = colors[colorIndex];
    const isHighlight = colorIndex >= RISING_RIVER_FRAGMENT_HIGHLIGHT_ROW;
    const facetLight = mixRgb(color, [255, 250, 242], isHighlight ? 0.1 : 0.18);
    const facetShadow = mixRgb(color, [40, 32, 31], isHighlight ? 0.1 : 0.17);
    for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex += 1) {
      const shape = shapes[shapeIndex];
      const centerX = shapeIndex * cellSize + cellSize * 0.5;
      const centerY = colorIndex * cellSize + cellSize * 0.5;
      colorContext.save();
      traceRisingRiverFragment(colorContext, shape.outline, centerX, centerY);
      colorContext.fillStyle = rgba(color, 1);
      colorContext.fill();
      colorContext.clip();
      colorContext.fillStyle = rgba(facetLight, 0.72);
      traceRisingRiverFragment(colorContext, shape.light, centerX, centerY);
      colorContext.fill();
      if (shape.shadow) {
        colorContext.fillStyle = rgba(facetShadow, 0.6);
        traceRisingRiverFragment(colorContext, shape.shadow, centerX, centerY);
        colorContext.fill();
      }
      colorContext.restore();
    }
  }

  for (let glowIndex = 0; glowIndex < RISING_RIVER_FRAGMENT_GLOW_COLORS.length; glowIndex += 1) {
    const glowColor = RISING_RIVER_FRAGMENT_GLOW_COLORS[glowIndex];
    const innerColor = mixRgb(glowColor, [255, 255, 255], glowIndex === 0 ? 0 : 0.3);
    for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = glowIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      haloContext.save();
      haloContext.beginPath();
      haloContext.rect(cellX, cellY, cellSize, cellSize);
      haloContext.clip();
      haloContext.globalCompositeOperation = 'lighter';
      haloContext.filter = 'blur(4.5px)';
      haloContext.fillStyle = rgba(glowColor, glowIndex === 0 ? 0.58 : 0.5);
      traceRisingRiverFragment(haloContext, shapes[shapeIndex].outline, centerX, centerY);
      haloContext.fill();
      haloContext.filter = 'blur(1.8px)';
      haloContext.fillStyle = rgba(innerColor, glowIndex === 0 ? 0.42 : 0.38);
      traceRisingRiverFragment(haloContext, shapes[shapeIndex].outline, centerX, centerY);
      haloContext.fill();

      // Seal the last few pixels of each cell so even large glints never expose
      // a rectangular atlas boundary. These gradients exist only during prewarm.
      haloContext.filter = 'none';
      haloContext.globalCompositeOperation = 'destination-in';
      const horizontal = haloContext.createLinearGradient(cellX, 0, cellX + cellSize, 0);
      horizontal.addColorStop(0, 'rgba(255,255,255,0)');
      horizontal.addColorStop(0.075, 'white');
      horizontal.addColorStop(0.925, 'white');
      horizontal.addColorStop(1, 'rgba(255,255,255,0)');
      haloContext.fillStyle = horizontal;
      haloContext.fillRect(cellX, cellY, cellSize, cellSize);
      const vertical = haloContext.createLinearGradient(0, cellY, 0, cellY + cellSize);
      vertical.addColorStop(0, 'rgba(255,255,255,0)');
      vertical.addColorStop(0.075, 'white');
      vertical.addColorStop(0.925, 'white');
      vertical.addColorStop(1, 'rgba(255,255,255,0)');
      haloContext.fillStyle = vertical;
      haloContext.fillRect(cellX, cellY, cellSize, cellSize);
      haloContext.restore();
    }
  }
  return { colorAtlas, transitionGlowAtlas, cellSize };
}

function shuffleFragmentAssignments<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = values[index];
    values[index] = values[swapIndex];
    values[swapIndex] = value;
  }
  return values;
}

function createFragmentGlowAssignments(
  count: number,
  whiteCount: number,
  roseCount: number,
  seed: number,
): RisingRiverFragmentGlowVariant[] {
  return shuffleFragmentAssignments(Array.from(
    { length: count },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < whiteCount ? 0 : index < whiteCount + roseCount ? 1 : -1
    ),
  ), createSeededRandom(seed));
}

function getRisingRiverFragmentShapeIndex(value: number) {
  if (value < 0.72) return Math.floor(value / 0.72 * 6);
  if (value < 0.88) return 6 + Math.floor((value - 0.72) / 0.16 * 2);
  return 8 + Math.floor((value - 0.88) / 0.12 * 2);
}

function createRisingRiverFragments(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverFragment[] {
  // Double every source band for a fuller plume without widening its corridor
  // or changing the balance between the river, left extension, and edge fringe.
  const coreCount = compact ? 210 : 350;
  const leftExtensionCount = compact ? 42 : 70;
  const edgeFringeCount = compact ? 22 : 36;
  const count = coreCount + leftExtensionCount + edgeFringeCount;
  const random = createSeededRandom(compact ? 38921 : 45191);
  const sizeRandom = createSeededRandom(compact ? 92347 : 96731);
  const materialRandom = createSeededRandom(compact ? 105071 : 106277);
  const movementRandom = createSeededRandom(compact ? 108371 : 109267);
  const primaryClusterCount = Math.round(coreCount * 0.6);
  const secondaryClusterCount = Math.round(coreCount * 0.3);
  const clusterAssignments = shuffleFragmentAssignments(
    Array.from({ length: coreCount }, (_, index) => (
      index < primaryClusterCount ? 0
        : index < primaryClusterCount + secondaryClusterCount ? 1 : 2
    )),
    random,
  );
  const glowAssignments = [
    ...createFragmentGlowAssignments(coreCount, compact ? 32 : 52, compact ? 20 : 36, compact ? 57427 : 61861),
    ...createFragmentGlowAssignments(leftExtensionCount, compact ? 6 : 12, 6, compact ? 70117 : 73471),
    ...createFragmentGlowAssignments(edgeFringeCount, compact ? 4 : 6, compact ? 2 : 4, compact ? 81283 : 84719),
  ];

  const smallCount = Math.round(count * 0.7);
  const accentCount = Math.round(count * 0.06);
  const sizeAssignments = shuffleFragmentAssignments(
    Array.from({ length: count }, (_, index) => (
      index < smallCount ? 0 : index < count - accentCount ? 1 : 2
    )),
    sizeRandom,
  );
  const midtoneCount = Math.round(count * 0.8);
  const pearlCount = Math.round(count * 0.08);
  const colorAssignments = shuffleFragmentAssignments(
    Array.from({ length: count }, (_, index) => (
      index < midtoneCount ? index % 4 : index < count - pearlCount ? 4 : 5
    )),
    materialRandom,
  );
  // Give the lower river a few pale folded accents without changing the
  // material quotas or allowing the pale accents to form a separate system.
  let paleAccents = compact ? 1 : 2;
  for (let index = 0; index < count && paleAccents > 0; index += 1) {
    if (sizeAssignments[index] !== 2) continue;
    if (colorAssignments[index] !== 5) {
      const pearlIndex = colorAssignments.findIndex((color, candidate) => (
        color === 5 && sizeAssignments[candidate] !== 2
      ));
      if (pearlIndex >= 0) {
        colorAssignments[pearlIndex] = colorAssignments[index];
        colorAssignments[index] = 5;
      }
    }
    paleAccents -= 1;
  }

  const endpointLimit = width * (compact ? 0.62 : 0.68);
  return Array.from({ length: count }, (_, index): RisingRiverFragment => {
    const tier = sizeAssignments[index];
    const baseSize = compact
      ? tier === 0 ? 3 + sizeRandom() * 3
        : tier === 1 ? 6 + sizeRandom() * 5 : 12 + sizeRandom() * 7
      : tier === 0 ? 4 + sizeRandom() * 4
        : tier === 1 ? 9 + sizeRandom() * 7 : 18 + sizeRandom() * 10;
    const isLeftExtension = index >= coreCount && index < coreCount + leftExtensionCount;
    const isEdgeFringe = index >= coreCount + leftExtensionCount;
    const extensionIndex = index - coreCount;
    const edgeIndex = index - coreCount - leftExtensionCount;
    const cluster = isEdgeFringe ? 4 : isLeftExtension ? 3 : clusterAssignments[index];
    const stream = Math.floor(movementRandom() * 3);
    // Slightly separated source ribbons preserve the established source
    // regions while leaving irregular gaps between the overlapping streams.
    const sourceXRatio = cluster === 4
      ? -0.13 + (random() + random()) * 0.05
      : cluster === 3
        ? -0.04 + (random() + random()) * 0.08
        : cluster === 0
          ? 0.11 + stream * 0.07 + (random() - 0.5) * 0.045
          : cluster === 1
            ? 0.32 + stream * 0.06 + (random() - 0.5) * 0.055
            : 0.03 + random() * 0.52;
    const sourceX = width * clamp(sourceXRatio, -0.13, 0.55);
    const sourceY = height * (0.89 + random() * 0.06);
    const altitudeRoll = random();
    const targetY = height * (altitudeRoll < 0.2
      ? 0.1 + altitudeRoll * 0.75 : 0.25 + (altitudeRoll - 0.2) * 0.2375);
    const riseDistance = sourceY - targetY;
    const angle = (67 + random() * 6) * Math.PI / 180;
    // Keep the existing responsive endpoint calculation: the visual corridor
    // stays familiar on both portrait and landscape viewports.
    const rightwardTravel = Math.min(
      width * (riseDistance / height) / Math.tan(angle),
      Math.max(endpointLimit - sourceX, 0),
    );
    const horizontalDrift = isEdgeFringe
      ? rightwardTravel * (0.55 + random() * 0.18)
      : !isLeftExtension && random() < 0.1
        ? -width * (0.01 + random() * 0.02)
        : rightwardTravel;
    const bend = (stream - 1) * width * 0.035
      + (movementRandom() - 0.5) * width * 0.012;
    const depthMix = random();
    const fasterTurn = movementRandom() < 0.1;
    const spinDirection = movementRandom() < 0.5 ? -1 : 1;
    const glintPeriod = 8000 + materialRandom() * 6000;
    return {
      sourceX,
      sourceY,
      riseDistance,
      phase: positiveModulo(
        (isEdgeFringe ? edgeIndex / edgeFringeCount
          : isLeftExtension ? extensionIndex / leftExtensionCount : index / coreCount)
          + random() * 0.18,
        1,
      ),
      duration: 48000 + random() * 24000,
      baseSize,
      terminalScale: 0.35 + sizeRandom() * 0.15,
      horizontalDrift,
      controlX: clamp(sourceX + horizontalDrift * 0.5 + bend, -width * 0.13, endpointLimit),
      sway: compact ? 2 + movementRandom() * 5 : 3 + movementRandom() * 7,
      swayCycles: 0.65 + movementRandom() * 0.6,
      rotation: movementRandom() * TAU,
      rotationSpeed: spinDirection * (fasterTurn ? 0.18 + movementRandom() * 0.1 : 0.035 + movementRandom() * 0.12),
      tumblePhase: movementRandom() * TAU,
      tumbleSpeed: 0.08 + movementRandom() * 0.14,
      opacity: 0.5 + materialRandom() * 0.28,
      shapeIndex: getRisingRiverFragmentShapeIndex(sizeRandom()),
      colorIndex: colorAssignments[index],
      glintPeriod,
      glintDuration: 1500 + materialRandom() * 1000,
      glintPhase: materialRandom() * glintPeriod,
      haloStrength: 0.58 + materialRandom() * 0.42,
      transitionGlowVariant: glowAssignments[index],
      depthProfile: {
        translation: 0.3 + depthMix * 0.26,
        perspective: 0.26 + depthMix * 0.24,
        tilt: 0.18 + depthMix * 0.24,
      },
    };
  });
}

type RisingRiverFragmentScene = ProjectionViewport & {
  risingRiverFragments: RisingRiverFragment[];
};

function drawRisingRiverFragmentAtlasCell(
  context: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  cellSize: number,
  shapeIndex: number,
  colorIndex: number,
  destinationSize: number,
  alpha: number,
) {
  if (alpha <= 0.001) return;
  context.globalAlpha = alpha;
  context.drawImage(
    atlas,
    shapeIndex * cellSize,
    colorIndex * cellSize,
    cellSize,
    cellSize,
    -destinationSize * 0.5,
    -destinationSize * 0.5,
    destinationSize,
    destinationSize,
  );
}

function drawRisingRiverFragments(
  context: CanvasRenderingContext2D,
  scene: RisingRiverFragmentScene,
  sprites: RisingRiverFragmentSprites,
  time: number,
  parallax: ParallaxFrame,
) {
  context.save();
  context.globalCompositeOperation = 'source-over';
  const endpointLimit = scene.width * (scene.compact ? 0.62 : 0.68);
  for (const fragment of scene.risingRiverFragments) {
    const progress = positiveModulo(fragment.phase + time / fragment.duration, 1);
    // A mild acceleration spends more of each loop near the river. Both
    // position and the return to the source remain deterministic in scene time.
    const riseProgress = progress * (0.76 + 0.24 * progress);
    const remaining = 1 - riseProgress;
    const curveWeight = 2 * remaining * riseProgress;
    const fadeIn = smoothstep(0, 0.1, progress);
    const fadeOut = 1 - smoothstep(0.88, 1, progress);
    const sway = Math.sin(progress * TAU * fragment.swayCycles + fragment.tumblePhase)
      * fragment.sway * scene.motionScale * curveWeight * 2;
    const x = clamp(
      remaining * remaining * fragment.sourceX
        + curveWeight * fragment.controlX
        + riseProgress * riseProgress * (fragment.sourceX + fragment.horizontalDrift)
        + sway,
      -scene.width * 0.13,
      endpointLimit,
    );
    const y = fragment.sourceY - fragment.riseDistance * riseProgress;
    // The forest is translucent: retain the source mask so new fragments
    // emerge through the river clearing rather than appearing inside trees.
    const canopyReveal = 1 - smoothstep(scene.height * 0.77, scene.height * 0.92, y);
    const aerialFade = 1 - smoothstep(0.2, 1, riseProgress) * 0.42;
    const opacity = fragment.opacity * fadeIn * fadeOut * canopyReveal * aerialFade;
    if (opacity <= 0.001) continue;

    const depthResponse = 1 - smoothstep(0, 1, riseProgress) * 0.45;
    projectAtDepth(parallax, x, y, fragment.depthProfile, scene.projection, depthResponse);
    const offscreenMargin = fragment.baseSize * 2.5;
    if (
      scene.projection.x < -offscreenMargin
      || scene.projection.x > scene.width + offscreenMargin
      || scene.projection.y < -offscreenMargin
      || scene.projection.y > scene.height + offscreenMargin
    ) continue;

    const geometricScale = 1 - (1 - fragment.terminalScale) * riseProgress;
    const tumbleClock = time * 0.001 * fragment.tumbleSpeed * scene.motionScale + fragment.tumblePhase;
    const turn = Math.sin(tumbleClock);
    const aspectScale = 0.45 + 0.55 * (0.5 + turn * 0.5);
    const materialLight = 0.94 + turn * 0.06;
    const rotation = fragment.rotation
      + time * 0.001 * fragment.rotationSpeed * scene.motionScale
      + Math.sin(tumbleClock * 0.73) * 0.075;
    const tiltResponse = clamp(fragment.depthProfile.tilt * depthResponse, 0, 1);
    const pitch = -parallax.positionY * parallax.maximumPitch * tiltResponse;
    const yaw = parallax.positionX * parallax.maximumYaw * tiltResponse;
    // Only undo the atlas padding; baseSize itself is the visible body size.
    const destinationSize = fragment.baseSize
      * (RISING_RIVER_FRAGMENT_CELL_SIZE / RISING_RIVER_FRAGMENT_BODY_EXTENT);
    const finalOpacity = clamp(opacity * materialLight * scene.projection.alphaScale, 0, 0.95);

    let glintWeight = 0;
    if (fragment.transitionGlowVariant >= 0) {
      const glintClock = positiveModulo(time + fragment.glintPhase, fragment.glintPeriod);
      const glintDistance = Math.abs(glintClock - fragment.glintPeriod * 0.5);
      glintWeight = 1 - smoothstep(0, fragment.glintDuration * 0.5, glintDistance);
    }
    const isWhiteGlow = fragment.transitionGlowVariant === 0;
    const highlightBlend = glintWeight * (isWhiteGlow ? 0.62 : 0.42);
    const highlightAlpha = finalOpacity * highlightBlend;
    // Alpha-correct blending keeps the silhouette's coverage steady as its
    // material catches light, rather than making it blink or fade away.
    const bodyAlpha = finalOpacity * (1 - highlightBlend) / Math.max(1 - highlightAlpha, 0.001);
    setSpriteTransform(
      context, scene, rotation + (yaw - pitch) * 0.025, pitch, yaw,
      scene.projection.scale * geometricScale * aspectScale,
      scene.projection.scale * geometricScale,
    );
    const glowAlpha = finalOpacity * glintWeight * fragment.haloStrength * (isWhiteGlow ? 0.42 : 0.34);
    if (glowAlpha > 0.003) {
      drawRisingRiverFragmentAtlasCell(
        context, sprites.transitionGlowAtlas, sprites.cellSize, fragment.shapeIndex,
        fragment.transitionGlowVariant, destinationSize * (isWhiteGlow ? 1.32 : 1.26), glowAlpha,
      );
    }
    drawRisingRiverFragmentAtlasCell(
      context, sprites.colorAtlas, sprites.cellSize, fragment.shapeIndex,
      fragment.colorIndex, destinationSize, bodyAlpha,
    );
    if (highlightAlpha > 0.001) {
      drawRisingRiverFragmentAtlasCell(
        context, sprites.colorAtlas, sprites.cellSize, fragment.shapeIndex,
        RISING_RIVER_FRAGMENT_HIGHLIGHT_ROW + fragment.transitionGlowVariant,
        destinationSize, highlightAlpha,
      );
    }
  }
  context.restore();
}

export type {
  RisingRiverFragment,
  RisingRiverFragmentGlowVariant,
  RisingRiverFragmentSprites,
};
export {
  createRisingRiverFragmentSprites,
  createRisingRiverFragments,
  drawRisingRiverFragments,
};

