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
  baseSize: number;
  terminalScale: number;
  horizontalDrift: number;
  sway: number;
  swayCycles: number;
  rotation: number;
  rotationSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  opacity: number;
  shapeIndex: 0 | 1 | 2 | 3 | 4;
  colorSequence: readonly number[];
  colorPhaseMs: number;
  haloStrength: number;
  transitionGlowVariant: RisingRiverFragmentGlowVariant;
  depthProfile: AtmosphericDepthProfile;
};
const RISING_RIVER_FRAGMENT_COLOR_FADE_MS = 2000;
const RISING_RIVER_FRAGMENT_CELL_SIZE = 128;
const RISING_RIVER_FRAGMENT_SHAPE_COUNT = 5;
const RISING_RIVER_FRAGMENT_WHITE_INDEX = 3;
const RISING_RIVER_FRAGMENT_PALETTE: readonly Rgb[] = [
  [41, 40, 39],
  [182, 143, 114],
  [99, 71, 58],
  [249, 252, 255],
  [154, 153, 148],
  [81, 84, 81],
];
const RISING_RIVER_FRAGMENT_COLOR_POOL = [0, 0, 2, 2, 5, 5, 1, 3, 4] as const;
const RISING_RIVER_FRAGMENT_GLOW_COLORS: readonly [Rgb, Rgb] = [
  [255, 255, 255],
  [174, 155, 151],
];

function traceRisingRiverFragment(
  context: CanvasRenderingContext2D,
  shapeIndex: number,
  centerX: number,
  centerY: number,
) {
  context.beginPath();
  if (shapeIndex === 0) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(centerX + 41, centerY + 31);
    context.lineTo(centerX - 36, centerY + 23);
  } else if (shapeIndex === 1) {
    context.moveTo(centerX - 7, centerY - 46);
    context.lineTo(centerX + 25, centerY + 39);
    context.lineTo(centerX - 23, centerY + 31);
  } else if (shapeIndex === 2) {
    context.moveTo(centerX + 7, centerY - 43);
    context.lineTo(centerX + 39, centerY + 29);
    context.lineTo(centerX - 40, centerY + 24);
  } else if (shapeIndex === 3) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(centerX + 35, centerY - 3);
    context.lineTo(centerX + 12, centerY + 41);
    context.lineTo(centerX - 32, centerY + 18);
    context.lineTo(centerX - 24, centerY - 18);
  } else {
    context.moveTo(centerX - 12, centerY - 46);
    context.lineTo(centerX + 20, centerY - 20);
    context.lineTo(centerX + 10, centerY + 44);
    context.lineTo(centerX - 17, centerY + 31);
  }
  context.closePath();
}

function traceRisingRiverFragmentFacet(
  context: CanvasRenderingContext2D,
  shapeIndex: number,
  centerX: number,
  centerY: number,
  secondary: boolean,
) {
  context.beginPath();
  if (shapeIndex === 0) {
    context.moveTo(centerX, centerY - 43);
    context.lineTo(secondary ? centerX - 36 : centerX + 41, secondary ? centerY + 23 : centerY + 31);
    context.lineTo(centerX + 3, centerY + 6);
  } else if (shapeIndex === 1) {
    context.moveTo(centerX - 7, centerY - 46);
    context.lineTo(secondary ? centerX - 23 : centerX + 25, secondary ? centerY + 31 : centerY + 39);
    context.lineTo(centerX - 1, centerY + 8);
  } else if (shapeIndex === 2) {
    context.moveTo(centerX + 7, centerY - 43);
    context.lineTo(secondary ? centerX - 40 : centerX + 39, secondary ? centerY + 24 : centerY + 29);
    context.lineTo(centerX + 2, centerY + 7);
  } else if (shapeIndex === 3) {
    context.moveTo(secondary ? centerX - 24 : centerX, secondary ? centerY - 18 : centerY - 43);
    context.lineTo(secondary ? centerX - 32 : centerX + 35, secondary ? centerY + 18 : centerY - 3);
    context.lineTo(centerX + 1, centerY + 5);
  } else {
    context.moveTo(secondary ? centerX - 17 : centerX - 12, secondary ? centerY + 31 : centerY - 46);
    context.lineTo(secondary ? centerX + 10 : centerX + 20, secondary ? centerY + 44 : centerY - 20);
    context.lineTo(centerX + 1, centerY + 3);
  }
  context.closePath();
}

function createRisingRiverFragmentSprites(): RisingRiverFragmentSprites {
  const cellSize = RISING_RIVER_FRAGMENT_CELL_SIZE;
  const colorAtlas = document.createElement('canvas');
  colorAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  colorAtlas.height = cellSize * RISING_RIVER_FRAGMENT_PALETTE.length;
  const colorContext = colorAtlas.getContext('2d');

  const transitionGlowAtlas = document.createElement('canvas');
  transitionGlowAtlas.width = cellSize * RISING_RIVER_FRAGMENT_SHAPE_COUNT;
  transitionGlowAtlas.height = cellSize * RISING_RIVER_FRAGMENT_GLOW_COLORS.length;
  const haloContext = transitionGlowAtlas.getContext('2d');

  if (!colorContext || !haloContext) return { colorAtlas, transitionGlowAtlas, cellSize };

  for (let colorIndex = 0; colorIndex < RISING_RIVER_FRAGMENT_PALETTE.length; colorIndex += 1) {
    const color = RISING_RIVER_FRAGMENT_PALETTE[colorIndex];
    const facetLight = mixRgb(color, [255, 255, 255], colorIndex === 3 ? 0.08 : 0.22);
    const facetShadow = mixRgb(color, [17, 19, 20], colorIndex === 3 ? 0.16 : 0.25);
    for (let shapeIndex = 0; shapeIndex < RISING_RIVER_FRAGMENT_SHAPE_COUNT; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = colorIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      colorContext.save();
      colorContext.beginPath();
      colorContext.rect(cellX, cellY, cellSize, cellSize);
      colorContext.clip();
      colorContext.globalCompositeOperation = 'source-over';
      colorContext.fillStyle = rgba(color, 1);
      traceRisingRiverFragment(colorContext, shapeIndex, centerX, centerY);
      colorContext.fill();
      colorContext.fillStyle = rgba(facetLight, 0.62);
      traceRisingRiverFragmentFacet(colorContext, shapeIndex, centerX, centerY, false);
      colorContext.fill();
      colorContext.fillStyle = rgba(facetShadow, 0.42);
      traceRisingRiverFragmentFacet(colorContext, shapeIndex, centerX, centerY, true);
      colorContext.fill();
      colorContext.restore();
    }
  }

  for (
    let glowIndex = 0;
    glowIndex < RISING_RIVER_FRAGMENT_GLOW_COLORS.length;
    glowIndex += 1
  ) {
    const glowColor = RISING_RIVER_FRAGMENT_GLOW_COLORS[glowIndex];
    const innerColor = glowIndex === 0
      ? [255, 255, 255] as Rgb
      : mixRgb(glowColor, [255, 255, 255], 0.3);
    for (let shapeIndex = 0; shapeIndex < RISING_RIVER_FRAGMENT_SHAPE_COUNT; shapeIndex += 1) {
      const cellX = shapeIndex * cellSize;
      const cellY = glowIndex * cellSize;
      const centerX = cellX + cellSize * 0.5;
      const centerY = cellY + cellSize * 0.5;
      haloContext.save();
      haloContext.beginPath();
      haloContext.rect(cellX, cellY, cellSize, cellSize);
      haloContext.clip();
      haloContext.globalCompositeOperation = 'lighter';
      haloContext.filter = 'blur(10px)';
      haloContext.fillStyle = rgba(glowColor, glowIndex === 0 ? 0.58 : 0.5);
      traceRisingRiverFragment(haloContext, shapeIndex, centerX, centerY);
      haloContext.fill();
      haloContext.filter = 'blur(4px)';
      haloContext.fillStyle = rgba(innerColor, glowIndex === 0 ? 0.42 : 0.38);
      traceRisingRiverFragment(haloContext, shapeIndex, centerX, centerY);
      haloContext.fill();
      haloContext.restore();
    }
  }

  return { colorAtlas, transitionGlowAtlas, cellSize };
}

function createRisingRiverFragmentColorSequence(random: () => number) {
  const fallback = [0, 2, 5, 0, 1, 2, 4, 5, 3];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const sequence = Array.from(RISING_RIVER_FRAGMENT_COLOR_POOL);
    for (let index = sequence.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const value = sequence[index];
      sequence[index] = sequence[swapIndex];
      sequence[swapIndex] = value;
    }
    let valid = sequence[0] !== sequence[sequence.length - 1];
    for (let index = 1; index < sequence.length && valid; index += 1) {
      valid = sequence[index] !== sequence[index - 1];
    }
    if (valid) return sequence;
  }
  return fallback;
}

function getRisingRiverFragmentShapeIndex(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value < 0.28) return 0;
  if (value < 0.54) return 1;
  if (value < 0.72) return 2;
  if (value < 0.88) return 3;
  return 4;
}

function createRisingRiverFragments(
  width: number,
  height: number,
  compact: boolean,
): RisingRiverFragment[] {
  const coreCount = compact ? 105 : 175;
  const leftExtensionCount = compact ? 21 : 35;
  const edgeFringeCount = compact ? 11 : 18;
  const count = coreCount + leftExtensionCount + edgeFringeCount;
  const random = createSeededRandom(compact ? 38921 : 45191);
  const glowRandom = createSeededRandom(compact ? 57427 : 61861);
  const leftGlowRandom = createSeededRandom(compact ? 70117 : 73471);
  const edgeGlowRandom = createSeededRandom(compact ? 81283 : 84719);
  const sizeBoostRandom = createSeededRandom(compact ? 92347 : 96731);
  const primaryClusterCount = Math.round(coreCount * 0.6);
  const secondaryClusterCount = Math.round(coreCount * 0.3);
  const clusterAssignments = Array.from({ length: coreCount }, (_, index) => (
    index < primaryClusterCount
      ? 0
      : index < primaryClusterCount + secondaryClusterCount
        ? 1
        : 2
  ));
  for (let index = clusterAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = clusterAssignments[index];
    clusterAssignments[index] = clusterAssignments[swapIndex];
    clusterAssignments[swapIndex] = value;
  }
  const whiteGlowCount = compact ? 16 : 26;
  const roseGlowCount = compact ? 10 : 18;
  const glowAssignments = Array.from(
    { length: coreCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < whiteGlowCount
        ? 0
        : index < whiteGlowCount + roseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = glowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(glowRandom() * (index + 1));
    const value = glowAssignments[index];
    glowAssignments[index] = glowAssignments[swapIndex];
    glowAssignments[swapIndex] = value;
  }
  const leftWhiteGlowCount = compact ? 3 : 6;
  const leftRoseGlowCount = 3;
  const leftGlowAssignments = Array.from(
    { length: leftExtensionCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < leftWhiteGlowCount
        ? 0
        : index < leftWhiteGlowCount + leftRoseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = leftGlowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(leftGlowRandom() * (index + 1));
    const value = leftGlowAssignments[index];
    leftGlowAssignments[index] = leftGlowAssignments[swapIndex];
    leftGlowAssignments[swapIndex] = value;
  }
  const edgeWhiteGlowCount = compact ? 2 : 3;
  const edgeRoseGlowCount = compact ? 1 : 2;
  const edgeGlowAssignments = Array.from(
    { length: edgeFringeCount },
    (_, index): RisingRiverFragmentGlowVariant => (
      index < edgeWhiteGlowCount
        ? 0
        : index < edgeWhiteGlowCount + edgeRoseGlowCount
          ? 1
          : -1
    ),
  );
  for (let index = edgeGlowAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(edgeGlowRandom() * (index + 1));
    const value = edgeGlowAssignments[index];
    edgeGlowAssignments[index] = edgeGlowAssignments[swapIndex];
    edgeGlowAssignments[swapIndex] = value;
  }
  const boostedSizeCount = Math.round(count * 0.25);
  const sizeBoostAssignments = Array.from(
    { length: count },
    (_, index) => index < boostedSizeCount,
  );
  for (let index = sizeBoostAssignments.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(sizeBoostRandom() * (index + 1));
    const value = sizeBoostAssignments[index];
    sizeBoostAssignments[index] = sizeBoostAssignments[swapIndex];
    sizeBoostAssignments[swapIndex] = value;
  }

  const sizeScale = 1.25;

  return Array.from({ length: count }, (_, index): RisingRiverFragment => {
    const sizeRoll = random();
    const baseSize = (
      compact
        ? sizeRoll < 0.72
          ? 2.6 + random() * 3.1
          : sizeRoll < 0.95
            ? 5.7 + random() * 2.6
            : 8.3 + random() * 2.6
        : sizeRoll < 0.7
          ? 3.25 + random() * 3.8
          : sizeRoll < 0.95
            ? 7.05 + random() * 3.8
            : 10.85 + random() * 3.95
    ) * sizeScale * (sizeBoostAssignments[index] ? 1.875 : 1);
    const isLeftExtension = index >= coreCount
      && index < coreCount + leftExtensionCount;
    const isEdgeFringe = index >= coreCount + leftExtensionCount;
    const extensionIndex = index - coreCount;
    const edgeIndex = index - coreCount - leftExtensionCount;
    const cluster = isEdgeFringe
      ? 4
      : isLeftExtension
        ? 3
        : clusterAssignments[index];
    const sourceXRatio = cluster === 4
      ? -0.13 + (random() + random()) * 0.05
      : cluster === 3
      ? -0.04 + (random() + random()) * 0.08
      : cluster === 0
        ? 0.08 + (random() + random()) * 0.1
        : cluster === 1
          ? 0.29 + (random() + random()) * 0.09
          : 0.03 + random() * 0.52;
    const sourceX = width * clamp(sourceXRatio, -0.13, 0.55);
    const sourceY = height * (0.89 + random() * 0.06);
    const altitudeRoll = random();
    const targetY = height * (altitudeRoll < 0.2
      ? 0.1 + altitudeRoll * 0.75 : 0.25 + (altitudeRoll - 0.2) * 0.2375);
    const riseDistance = sourceY - targetY;
    const angle = (67 + random() * 6) * Math.PI / 180;
    const endpointLimit = width * (compact ? 0.62 : 0.68);
    const rightwardTravel = Math.min(
      width * (riseDistance / height) / Math.tan(angle),
      Math.max(endpointLimit - sourceX, 0),
    );
    const horizontalDrift = isEdgeFringe
      ? rightwardTravel * (0.55 + random() * 0.18)
      : !isLeftExtension && random() < 0.1
        ? -width * (0.01 + random() * 0.02)
        : rightwardTravel;
    const depthMix = random();
    const fastTumble = random() < 0.14;
    const spinDirection = random() < 0.5 ? -1 : 1;
    const colorSequence = createRisingRiverFragmentColorSequence(random);
    return {
      sourceX,
      sourceY,
      riseDistance,
      phase: positiveModulo(
        (isEdgeFringe
          ? edgeIndex / edgeFringeCount
          : isLeftExtension
            ? extensionIndex / leftExtensionCount
            : index / coreCount)
          + random() * 0.18,
        1,
      ),
      duration: 48000 + random() * 24000,
      baseSize,
      terminalScale: 0.42 + random() * 0.18,
      horizontalDrift,
      sway: compact ? 2 + random() * 5 : 3 + random() * 7,
      swayCycles: 0.65 + random() * 0.6,
      rotation: random() * TAU,
      rotationSpeed: spinDirection
        * (fastTumble ? 0.25 + random() * 0.17 : 0.05 + random() * 0.19),
      tumblePhase: random() * TAU,
      tumbleSpeed: 0.09 + random() * 0.24,
      opacity: 0.46 + random() * 0.32,
      shapeIndex: getRisingRiverFragmentShapeIndex(random()),
      colorSequence,
      colorPhaseMs: random()
        * RISING_RIVER_FRAGMENT_COLOR_FADE_MS
        * colorSequence.length,
      haloStrength: 0.58 + random() * 0.42,
      transitionGlowVariant: isEdgeFringe
        ? edgeGlowAssignments[edgeIndex]
        : isLeftExtension
          ? leftGlowAssignments[extensionIndex]
          : glowAssignments[index],
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
  const colorCycleDuration = RISING_RIVER_FRAGMENT_COLOR_FADE_MS
    * RISING_RIVER_FRAGMENT_COLOR_POOL.length;

  context.save();
  for (const fragment of scene.risingRiverFragments) {
    const progress = positiveModulo(fragment.phase + time / fragment.duration, 1);
    // A linear ascent keeps the vertical field evenly populated. The opacity
    // envelope still softens both ends of the loop, so recycling remains
    // invisible without compressing most fragments near the river or ceiling.
    const riseProgress = progress;
    const fadeIn = smoothstep(0, 0.1, progress);
    const fadeOut = 1 - smoothstep(0.88, 1, progress);

    const sway = Math.sin(
      progress * TAU * fragment.swayCycles + fragment.tumblePhase,
    ) * fragment.sway * scene.motionScale;
    const x = fragment.sourceX
      + fragment.horizontalDrift * riseProgress
      + sway;
    const y = fragment.sourceY - fragment.riseDistance * riseProgress;
    // The foreground forest is intentionally translucent. Hide fragments at
    // their source until they clear the canopy so they still read as emerging
    // from behind it instead of being painted inside the trees.
    const canopyReveal = 1 - smoothstep(
      scene.height * 0.77,
      scene.height * 0.92,
      y,
    );
    const aerialFade = 1 - smoothstep(0.2, 1, riseProgress) * 0.42;
    const opacity = fragment.opacity * fadeIn * fadeOut * canopyReveal * aerialFade;
    if (opacity <= 0.001) continue;
    const depthResponse = 1 - smoothstep(0, 1, riseProgress) * 0.45;
    projectAtDepth(
      parallax,
      x,
      y,
      fragment.depthProfile,
      scene.projection,
      depthResponse,
    );
    const offscreenMargin = fragment.baseSize * 2.5;
    if (
      scene.projection.x < -offscreenMargin
      || scene.projection.x > scene.width + offscreenMargin
      || scene.projection.y < -offscreenMargin
      || scene.projection.y > scene.height + offscreenMargin
    ) continue;

    const geometricScale = 1
      - (1 - fragment.terminalScale) * riseProgress;
    const tumbleClock = time * 0.001 * fragment.tumbleSpeed * scene.motionScale
      + fragment.tumblePhase;
    const aspectScale = 0.28 + 0.72 * (0.5 + Math.sin(tumbleClock) * 0.5);
    const rotation = fragment.rotation
      + time * 0.001 * fragment.rotationSpeed * scene.motionScale
      + Math.sin(tumbleClock * 0.73) * 0.1;
    const tiltResponse = clamp(fragment.depthProfile.tilt * depthResponse, 0, 1);
    const pitch = -parallax.positionY * parallax.maximumPitch * tiltResponse;
    const yaw = parallax.positionX * parallax.maximumYaw * tiltResponse;
    const destinationSize = fragment.baseSize * 1.72;

    const colorClock = positiveModulo(
      time + fragment.colorPhaseMs,
      colorCycleDuration,
    );
    const colorSegment = Math.floor(
      colorClock / RISING_RIVER_FRAGMENT_COLOR_FADE_MS,
    );
    const colorProgress = (
      colorClock - colorSegment * RISING_RIVER_FRAGMENT_COLOR_FADE_MS
    ) / RISING_RIVER_FRAGMENT_COLOR_FADE_MS;
    const colorBlend = smoothstep(0, 1, colorProgress);
    const currentColor = fragment.colorSequence[colorSegment];
    const nextColor = fragment.colorSequence[
      (colorSegment + 1) % fragment.colorSequence.length
    ];
    const luminousTransitionWeight = (currentColor === RISING_RIVER_FRAGMENT_WHITE_INDEX
      ? 1 - colorBlend
      : 0)
      + (nextColor === RISING_RIVER_FRAGMENT_WHITE_INDEX ? colorBlend : 0);
    const finalOpacity = clamp(
      opacity * scene.projection.alphaScale,
      0,
      0.95,
    );
    const nextAlpha = finalOpacity * colorBlend;
    const currentAlpha = finalOpacity * (1 - colorBlend)
      / Math.max(1 - nextAlpha, 0.001);

    setSpriteTransform(
      context, scene, rotation + (yaw - pitch) * 0.025, pitch, yaw,
      scene.projection.scale * geometricScale * aspectScale,
      scene.projection.scale * geometricScale,
    );

    if (
      fragment.transitionGlowVariant >= 0
      && luminousTransitionWeight > 0.001
    ) {
      const isWhiteGlow = fragment.transitionGlowVariant === 0;
      const glowAlpha = finalOpacity
        * luminousTransitionWeight
        * fragment.haloStrength
        * (isWhiteGlow ? 0.42 : 0.34);
      context.globalCompositeOperation = 'source-over';
      if (glowAlpha > 0.003) {
        drawRisingRiverFragmentAtlasCell(
          context,
          sprites.transitionGlowAtlas,
          sprites.cellSize,
          fragment.shapeIndex,
          fragment.transitionGlowVariant,
          destinationSize * (isWhiteGlow ? 1.32 : 1.26),
          glowAlpha,
        );
      }
    }

    context.globalCompositeOperation = 'source-over';
    drawRisingRiverFragmentAtlasCell(
      context,
      sprites.colorAtlas,
      sprites.cellSize,
      fragment.shapeIndex,
      currentColor,
      destinationSize,
      currentAlpha,
    );
    drawRisingRiverFragmentAtlasCell(
      context,
      sprites.colorAtlas,
      sprites.cellSize,
      fragment.shapeIndex,
      nextColor,
      destinationSize,
      nextAlpha,
    );
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

