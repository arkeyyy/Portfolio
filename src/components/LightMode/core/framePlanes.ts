import type { ProjectionViewport, Rgb } from './contracts';
import { rgba } from './colorCanvas';

type CachedPlane = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

type FramePlanes = {
  sky: CachedPlane;
  edge: CachedPlane;
  tint: CachedPlane;
  tintScratch: CachedPlane;
  color: Rgb;
  rightColor: Rgb;
  foregroundColor: Rgb;
  cameraX: number;
  cameraY: number;
  valid: boolean;
};

function createCachedPlane(width: number, height: number, opaque = false): CachedPlane {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, context: canvas.getContext('2d', { alpha: !opaque })! };
}

function createFramePlanes(width: number, height: number): FramePlanes {
  // Start at half resolution; also bound all three planes together so the
  // retained sprites + viewport caches stay below the ~32 MiB light budget.
  const scale = Math.min(0.5, 1024 / width, 640 / height, Math.sqrt(220_000 / (width * height)));
  const bufferWidth = Math.max(1, Math.ceil(width * scale));
  const bufferHeight = Math.max(1, Math.ceil(height * scale));
  return {
    sky: createCachedPlane(bufferWidth, bufferHeight, true),
    edge: createCachedPlane(bufferWidth, bufferHeight),
    tint: createCachedPlane(bufferWidth, bufferHeight),
    tintScratch: createCachedPlane(256, 256),
    color: [0, 0, 0], rightColor: [0, 0, 0], foregroundColor: [0, 0, 0],
    cameraX: 0, cameraY: 0, valid: false,
  };
}

function disposeFramePlanes(planes: FramePlanes | null) {
  if (!planes) return;
  // Release viewport-dependent raster resources immediately on unmount/resize.
  planes.sky.canvas.width = planes.sky.canvas.height = 0;
  planes.edge.canvas.width = planes.edge.canvas.height = 0;
  planes.tint.canvas.width = planes.tint.canvas.height = 0;
  planes.tintScratch.canvas.width = planes.tintScratch.canvas.height = 0;
}

function tintWash(mask: HTMLCanvasElement, color: Rgb, scratch: CachedPlane) {
  const { context, canvas } = scratch;
  context.globalCompositeOperation = 'copy';
  context.fillStyle = rgba(color, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(mask, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return canvas;
}

function preparePlane(plane: CachedPlane, scene: ProjectionViewport, clear: boolean) {
  const { context, canvas } = plane;
  context.setTransform(canvas.width / scene.width, 0, 0, canvas.height / scene.height, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  if (clear) context.clearRect(0, 0, scene.width, scene.height);
}

export type { CachedPlane, FramePlanes };
export {
  createFramePlanes,
  disposeFramePlanes,
  tintWash,
  preparePlane,
};

