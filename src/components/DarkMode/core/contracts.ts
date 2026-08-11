export type Rgb = [number, number, number];

export type OrbitGeometry = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  tilt: number;
};

export type RenderViewport = {
  width: number;
  height: number;
};

export type DarkSceneViewport = RenderViewport & {
  compact: boolean;
};

export type ConstellationHazePalette = readonly [Rgb, Rgb, Rgb, Rgb];

export type ConstellationRenderTheme = {
  cloudAlpha: number;
  lineAlpha: number;
  starAlpha: number;
};

export type AtmosphericFogStage = 'far' | 'middle' | 'near';

export type CosmicRenderTheme = {
  neutralStarColor: Rgb;
  cloudCompositeOperation: 'screen';
  backgroundWash: {
    centerAlpha: number;
    depthAlpha: number;
  };
  fieldStarAlpha: number;
  goldStarAlpha: number;
  starClusters: {
    baseAlpha: number;
    highlightAlpha: number;
  };
  ringTrails: {
    baseAlpha: number;
    laneFalloff: number;
    dashAlpha: number;
  };
  secondaryRings: {
    distantAlpha: number;
    innerAlpha: number;
    dashAlpha: number;
    particleAlpha: number;
  };
  aurora: {
    activeAlpha: number;
    purpleAlpha: number;
  };
  quasar: {
    spriteAlpha: number;
    lensAlpha: number;
    particleAlpha: number;
  };
  libra: ConstellationRenderTheme;
  cancer: ConstellationRenderTheme;
  distantCyclone: {
    hazeAlpha: number;
    cyanAlpha: number;
    crestAlpha: number;
    pinkAlpha: number;
    sparkAlpha: number;
    coreAlpha: number;
  };
  vortex: {
    activeAlpha: number;
    accentAlpha: number;
    coreAlpha: number;
    starAlpha: number;
  };
  clouds: {
    accentAlpha: number;
    activeAlpha: number;
    glowCoreAlpha: number;
    glowMidAlpha: number;
  };
  atmosphericFog: Record<AtmosphericFogStage, number>;
  foregroundClouds: {
    purpleAlpha: number;
    activeAlpha: number;
    glowCoreAlpha: number;
    glowMidAlpha: number;
  };
  ringParticleAlpha: number;
  planetRing: {
    foregroundAlpha: number;
    backgroundAlpha: number;
  };
  planetSurface: {
    featureAlpha: number;
    violetStormAlpha: number;
    rockyShadowAlpha: number;
    rockyCraterAlpha: number;
    rockyCraterRimAlpha: number;
    oceanFeatureAlpha: number;
    oceanCloudAlpha: number;
    iceFacetAlpha: number;
    iceFissureAlpha: number;
  };
  planetAtmosphere: {
    rockyAlpha: number;
    iceAlpha: number;
    standardAlpha: number;
    iceOuterAlpha: number;
  };
  planetGradient: readonly [number, number, number, number];
  rogueTrailAlpha: number;
};

export type ParallaxFrame = {
  positionX: number;
  positionY: number;
  maximumOffsetX: number;
  maximumOffsetY: number;
  maximumPitch: number;
  maximumYaw: number;
  centerX: number;
  centerY: number;
  inverseHalfWidth: number;
  inverseHalfHeight: number;
  cursorNormalization: number;
  maximumPerspectiveScale: number;
};

export type ParallaxPose = {
  offsetX: number;
  offsetY: number;
  pitch: number;
  yaw: number;
  response: number;
};

export type DepthFieldProjection = {
  x: number;
  y: number;
  scale: number;
  alphaScale: number;
};

export type DepthFieldSurface = DepthFieldProjection & {
  anchorX: number;
  anchorY: number;
  matrixA: number;
  matrixB: number;
  matrixC: number;
  matrixD: number;
};

export type DepthFieldLayer = {
  translationDepth: number;
  perspectiveDepth: number;
  perspectiveStrength: number;
};
