import type {
  DepthFieldLayer,
  DepthFieldProjection,
  DepthFieldSurface,
  ParallaxFrame,
  ParallaxPose,
  RenderViewport,
} from './contracts';
import { clamp } from './math';

export function createParallaxFrame(
  viewport: RenderViewport,
  positionX: number,
  positionY: number,
): ParallaxFrame {
  const clampedPositionX = clamp(positionX, -1, 1);
  const clampedPositionY = clamp(positionY, -1, 1);
  return {
    positionX: clampedPositionX,
    positionY: clampedPositionY,
    maximumOffsetX: clamp(viewport.width * 0.03, 18, 44),
    maximumOffsetY: clamp(viewport.height * 0.024, 12, 28),
    maximumPitch: 10 * Math.PI / 180,
    maximumYaw: 14 * Math.PI / 180,
    centerX: viewport.width * 0.5,
    centerY: viewport.height * 0.5,
    inverseHalfWidth: 2 / Math.max(viewport.width, 1),
    inverseHalfHeight: 2 / Math.max(viewport.height, 1),
    cursorNormalization: 1 / Math.max(
      1,
      Math.abs(clampedPositionX) + Math.abs(clampedPositionY),
    ),
    maximumPerspectiveScale: 0.065,
  };
}

export function getParallaxOffsetX(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionX * parallax.maximumOffsetX * clamp(depth, 0, 1);
}

export function getParallaxOffsetY(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionY * parallax.maximumOffsetY * clamp(depth, 0, 1);
}

export function getParallaxPose(
  parallax: ParallaxFrame,
  depth: number,
  tiltScale = 1,
  orientationDepth = depth,
): ParallaxPose {
  const response = clamp(orientationDepth * tiltScale, 0, 1);
  return {
    offsetX: getParallaxOffsetX(parallax, depth),
    offsetY: getParallaxOffsetY(parallax, depth),
    pitch: -parallax.positionY * parallax.maximumPitch * response,
    yaw: parallax.positionX * parallax.maximumYaw * response,
    response,
  };
}

export function applyParallaxPlaneTilt(
  context: CanvasRenderingContext2D,
  pose: ParallaxPose,
  strength = 1,
) {
  context.transform(
    1,
    Math.sin(pose.pitch) * 0.16 * strength,
    Math.sin(pose.yaw) * 0.11 * strength,
    1,
    0,
    0,
  );
}

// Projects a point through the cursor-weighted depth field. Points beneath the
// cursor recede toward the viewport center, while points opposite it approach.
// The output parameter keeps dense star and ring loops allocation-free.
export function projectAtParallaxDepth(
  parallax: ParallaxFrame,
  x: number,
  y: number,
  translationDepth: number,
  perspectiveDepth: number,
  perspectiveStrength: number,
  output: DepthFieldProjection,
) {
  const normalizedX = clamp(
    (x - parallax.centerX) * parallax.inverseHalfWidth,
    -1.15,
    1.15,
  );
  const normalizedY = clamp(
    (y - parallax.centerY) * parallax.inverseHalfHeight,
    -1.15,
    1.15,
  );
  const cursorSide = clamp(
    (
      normalizedX * parallax.positionX
      + normalizedY * parallax.positionY
    ) * parallax.cursorNormalization,
    -1,
    1,
  );
  const response = cursorSide
    * clamp(perspectiveDepth, 0, 1)
    * perspectiveStrength;
  const scale = clamp(
    1 - response * parallax.maximumPerspectiveScale,
    0.9,
    1.1,
  );

  output.x = parallax.centerX
    + (x - parallax.centerX) * scale
    + getParallaxOffsetX(parallax, translationDepth);
  output.y = parallax.centerY
    + (y - parallax.centerY) * scale
    + getParallaxOffsetY(parallax, translationDepth);
  output.scale = scale;
  output.alphaScale = clamp(1 - response * 0.14, 0.9, 1.1);
}

export function getDepthFieldSurface(
  parallax: ParallaxFrame,
  anchorX: number,
  anchorY: number,
  layer: DepthFieldLayer,
): DepthFieldSurface {
  const projection: DepthFieldProjection = {
    x: anchorX,
    y: anchorY,
    scale: 1,
    alphaScale: 1,
  };
  projectAtParallaxDepth(
    parallax,
    anchorX,
    anchorY,
    layer.translationDepth,
    layer.perspectiveDepth,
    layer.perspectiveStrength,
    projection,
  );
  const sampleDistance = 4;
  const positiveX: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  const negativeX: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  const positiveY: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  const negativeY: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  projectAtParallaxDepth(
    parallax,
    anchorX + sampleDistance,
    anchorY,
    layer.translationDepth,
    layer.perspectiveDepth,
    layer.perspectiveStrength,
    positiveX,
  );
  projectAtParallaxDepth(
    parallax,
    anchorX - sampleDistance,
    anchorY,
    layer.translationDepth,
    layer.perspectiveDepth,
    layer.perspectiveStrength,
    negativeX,
  );
  projectAtParallaxDepth(
    parallax,
    anchorX,
    anchorY + sampleDistance,
    layer.translationDepth,
    layer.perspectiveDepth,
    layer.perspectiveStrength,
    positiveY,
  );
  projectAtParallaxDepth(
    parallax,
    anchorX,
    anchorY - sampleDistance,
    layer.translationDepth,
    layer.perspectiveDepth,
    layer.perspectiveStrength,
    negativeY,
  );
  const sampleSpan = sampleDistance * 2;

  return {
    ...projection,
    anchorX,
    anchorY,
    matrixA: (positiveX.x - negativeX.x) / sampleSpan,
    matrixB: (positiveX.y - negativeX.y) / sampleSpan,
    matrixC: (positiveY.x - negativeY.x) / sampleSpan,
    matrixD: (positiveY.y - negativeY.y) / sampleSpan,
  };
}

export function drawOnDepthFieldSurface(
  context: CanvasRenderingContext2D,
  surface: DepthFieldSurface,
  draw: () => void,
) {
  context.save();
  context.transform(
    surface.matrixA,
    surface.matrixB,
    surface.matrixC,
    surface.matrixD,
    surface.x - surface.matrixA * surface.anchorX - surface.matrixC * surface.anchorY,
    surface.y - surface.matrixB * surface.anchorX - surface.matrixD * surface.anchorY,
  );
  draw();
  context.restore();
}

export function drawAtParallaxDepth(
  context: CanvasRenderingContext2D,
  parallax: ParallaxFrame,
  depth: number,
  draw: (pose: ParallaxPose) => void,
) {
  const pose = getParallaxPose(parallax, depth);
  if (Math.abs(pose.offsetX) < 0.01 && Math.abs(pose.offsetY) < 0.01) {
    draw(pose);
    return;
  }

  context.save();
  context.translate(pose.offsetX, pose.offsetY);
  draw(pose);
  context.restore();
}
