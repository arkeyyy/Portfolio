import type {
  AtmosphericDepthProfile,
  DepthProjection,
  ParallaxFrame,
  ProjectionViewport,
} from './contracts';
import { clamp } from './math';

function createParallaxFrame(
  scene: ProjectionViewport,
  positionX: number,
  positionY: number,
): ParallaxFrame {
  const clampedX = clamp(positionX, -1, 1);
  const clampedY = clamp(positionY, -1, 1);
  const frame = scene.parallax;
  frame.positionX = clampedX;
  frame.positionY = clampedY;
  frame.cursorNormalization = 1 / Math.max(1, Math.abs(clampedX) + Math.abs(clampedY));
  return frame;
}

function getParallaxOffsetX(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionX * parallax.maximumOffsetX * clamp(depth, 0, 1);
}

function getParallaxOffsetY(parallax: ParallaxFrame, depth: number) {
  return -parallax.positionY * parallax.maximumOffsetY * clamp(depth, 0, 1);
}

function projectAtDepth(
  parallax: ParallaxFrame,
  x: number,
  y: number,
  depthProfile: AtmosphericDepthProfile,
  output: DepthProjection,
  responseScale = 1,
) {
  const scaledResponse = clamp(responseScale, 0, 1);
  const normalizedX = clamp((x - parallax.centerX) * parallax.inverseHalfWidth, -1.2, 1.2);
  const normalizedY = clamp((y - parallax.centerY) * parallax.inverseHalfHeight, -1.2, 1.2);
  const cursorSide = clamp(
    (normalizedX * parallax.positionX + normalizedY * parallax.positionY)
      * parallax.cursorNormalization,
    -1,
    1,
  );
  const response = cursorSide
    * clamp(depthProfile.perspective, 0, 1)
    * scaledResponse;
  const scale = clamp(1 - response * parallax.maximumPerspectiveScale, 0.94, 1.06);
  output.x = parallax.centerX
    + (x - parallax.centerX) * scale
    + getParallaxOffsetX(parallax, depthProfile.translation * scaledResponse);
  output.y = parallax.centerY
    + (y - parallax.centerY) * scale
    + getParallaxOffsetY(parallax, depthProfile.translation * scaledResponse);
  output.scale = scale;
  output.alphaScale = clamp(1 - response * 0.09, 0.94, 1.06);
}

function drawDepthImage(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  depthProfile: AtmosphericDepthProfile,
  opacity: number,
  parallax: ParallaxFrame,
  rotation = 0,
) {
  if (opacity <= 0.001) return;
  projectAtDepth(
    parallax,
    x,
    y,
    depthProfile,
    scene.projection,
  );
  if (!isProjectedVisible(scene, width, height)) return;
  const response = clamp(depthProfile.tilt, 0, 1);
  const pitch = -parallax.positionY * parallax.maximumPitch * response;
  const yaw = parallax.positionX * parallax.maximumYaw * response;
  context.save();
  context.translate(scene.projection.x, scene.projection.y);
  context.transform(1, Math.sin(pitch) * 0.11, Math.sin(yaw) * 0.085, 1, 0, 0);
  context.rotate(rotation + (yaw - pitch) * 0.025);
  context.scale(scene.projection.scale, scene.projection.scale);
  context.globalAlpha = clamp(opacity * scene.projection.alphaScale, 0, 1);
  context.drawImage(image, -width * 0.5, -height * 0.5, width, height);
  context.restore();
}

function isProjectedVisible(scene: ProjectionViewport, width: number, height: number) {
  // Conservative radius includes rotation and the small image-plane shear.
  const radius = Math.hypot(width, height) * scene.projection.scale * 0.6;
  return scene.projection.x + radius >= 0
    && scene.projection.x - radius <= scene.width
    && scene.projection.y + radius >= 0
    && scene.projection.y - radius <= scene.height;
}

function setSpriteTransform(
  context: CanvasRenderingContext2D,
  scene: ProjectionViewport,
  rotation: number,
  pitch: number,
  yaw: number,
  scaleX: number,
  scaleY: number,
) {
  // Compose DPR Ã— translate Ã— shear Ã— rotate Ã— scale without matrix objects.
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const shearX = Math.sin(yaw) * 0.085;
  const shearY = Math.sin(pitch) * 0.11;
  const dpr = scene.pixelRatio;
  context.setTransform(
    dpr * (cosine + shearX * sine) * scaleX,
    dpr * (shearY * cosine + sine) * scaleX,
    dpr * (-sine + shearX * cosine) * scaleY,
    dpr * (-shearY * sine + cosine) * scaleY,
    scene.projection.x * dpr,
    scene.projection.y * dpr,
  );
}

export {
  createParallaxFrame,
  getParallaxOffsetX,
  getParallaxOffsetY,
  projectAtDepth,
  drawDepthImage,
  isProjectedVisible,
  setSpriteTransform,
};

