export type Rgb = [number, number, number];

export type AtmosphericDepthProfile = Readonly<{
  translation: number;
  perspective: number;
  tilt: number;
}>;

export type DepthProjection = {
  x: number;
  y: number;
  scale: number;
  alphaScale: number;
};

export type ParallaxFrame = {
  positionX: number;
  positionY: number;
  maximumOffsetX: number;
  maximumOffsetY: number;
  maximumPitch: number;
  maximumYaw: number;
  maximumPerspectiveScale: number;
  centerX: number;
  centerY: number;
  inverseHalfWidth: number;
  inverseHalfHeight: number;
  cursorNormalization: number;
};

export type ProjectionViewport = {
  width: number;
  height: number;
  compact: boolean;
  motionScale: number;
  pixelRatio: number;
  parallax: ParallaxFrame;
  projection: DepthProjection;
};

