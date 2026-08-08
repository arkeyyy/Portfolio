import { useEffect, useRef } from 'react';

type Rgb = [number, number, number];
type PlanetKind = 'violet' | 'amber' | 'rocky' | 'ocean' | 'ice';

type Star = {
  x: number;
  y: number;
  size: number;
  depth: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
  tintStrength: number;
};

type GoldStar = {
  x: number;
  y: number;
  size: number;
  depth: number;
  phase: number;
  drift: number;
};

type RingParticle = {
  angle: number;
  size: number;
  lane: number;
  speed: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
};

type ClusterLayer = 'far' | 'ring';

type ClusterHighlight = {
  localX: number;
  localY: number;
  size: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
  tintStrength: number;
};

type StarCluster = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  depth: number;
  phase: number;
  drift: number;
  layer: ClusterLayer;
  darkSprite: HTMLCanvasElement;
  lightSprite: HTMLCanvasElement;
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

type PlanetBase = {
  size: number;
  phase: number;
  spinSpeed: number;
  ringed: boolean;
  kind: PlanetKind;
};

type OrbitingPlanet = PlanetBase & {
  motion: 'orbit';
  angle: number;
  lane: number;
  speed: number;
  direction: 1 | -1;
};

type RoguePlanet = PlanetBase & {
  motion: 'rogue';
  x: number;
  y: number;
  velocityX: number;
  waveY: number;
  waveSpeed: number;
};

type Planet = OrbitingPlanet | RoguePlanet;
type PlanetMotion = Planet['motion'];
type PlanetLayer = PlanetMotion | 'distant-rogue';

type PlanetRenderState = {
  planet: Planet;
  x: number;
  y: number;
  radius: number;
  surfacePhase: number;
  viewPose: ParallaxPose;
};

type OrbitGeometry = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  tilt: number;
};

type CloudSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  purple: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  accentContext: CanvasRenderingContext2D;
  lastActiveColor: string;
  lastAccentColor: string;
};

type AuroraSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  purple: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  lastActiveColor: string;
};

type QuasarLightParticle = {
  angle: number;
  phase: number;
  speed: number;
  direction: 1 | -1;
  size: number;
  colorIndex: 0 | 1;
};

type Quasar = {
  centerX: number;
  centerY: number;
  size: number;
  phase: number;
  sprite: HTMLCanvasElement;
  particles: QuasarLightParticle[];
};

type VortexSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  accentContext: CanvasRenderingContext2D;
  lastActiveColor: string;
  lastAccentColor: string;
};

type VortexStar = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  phase: number;
};

type Vortex = {
  sprites: VortexSprites;
  stars: VortexStar[];
};

type AtmosphericFogStage = 'far' | 'middle' | 'near';

type AtmosphericFogLayer = {
  stage: AtmosphericFogStage;
  depth: number;
  centerX: number;
  centerY: number;
  widthScale: number;
  heightScale: number;
  rotation: number;
  driftX: number;
  driftY: number;
  phase: number;
  activeShare: number;
  compactVisible: boolean;
};

type SecondaryRingSystem = OrbitGeometry & {
  lanes: number;
  laneSpacing: number;
  dashSpeed: number;
  colorMix: number;
  glintAngle: number;
  glintSpeed: number;
  particles: RingParticle[];
};

type CosmicRenderTheme = {
  neutralStarColor: Rgb;
  cloudCompositeOperation: 'screen' | 'source-over';
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

type Scene = {
  width: number;
  height: number;
  pixelRatio: number;
  compact: boolean;
  stars: Star[];
  goldStars: GoldStar[];
  starClusters: StarCluster[];
  ringParticles: RingParticle[];
  planets: Planet[];
  orbit: OrbitGeometry;
  secondaryRings: {
    distant: SecondaryRingSystem;
    inner: SecondaryRingSystem;
  };
  clouds: CloudSprites;
  aurora: AuroraSprites;
  quasar: Quasar;
  vortex: Vortex;
};

type ParallaxFrame = {
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

type ParallaxPose = {
  offsetX: number;
  offsetY: number;
  pitch: number;
  yaw: number;
  response: number;
};

type DepthFieldProjection = {
  x: number;
  y: number;
  scale: number;
  alphaScale: number;
};

type DepthFieldSurface = DepthFieldProjection & {
  anchorX: number;
  anchorY: number;
  matrixA: number;
  matrixB: number;
  matrixC: number;
  matrixD: number;
};

type DepthFieldLayer = {
  translationDepth: number;
  perspectiveDepth: number;
  perspectiveStrength: number;
};

type EdgeGlowDepthSpec = {
  variable: string;
  normalizedX: number;
  normalizedY: number;
  perspectiveStrength: number;
};

type DeviceOrientationPermissionState =
  | 'unavailable'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'denied';

type DeviceOrientationEventConstructor = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const TAU = Math.PI * 2;
const STAR_COLOR_FADE_MS = 1500;
const SECTION_COLOR_EASE_MS = 520;
const PARALLAX_EASE_MS = 260;
const DEVICE_TILT_DEAD_ZONE = 1.25;
const DEVICE_TILT_RANGE_X = 18;
const DEVICE_TILT_RANGE_Y = 22;
// Depth 0 stays fixed. Depth 1 receives the full foreground camera offset.
// New scene objects can use a semantic token here or pass a custom depth to the helper.
const PARALLAX_DEPTH = {
  distant: 0.16,
  far: 0.24,
  middle: 0.42,
  near: 0.58,
  foreground: 0.78,
  starField: 0.24,
  goldStars: 0.32,
  starClusters: 0.44,
} as const;
const PLANET_PARALLAX_TILT_SCALE = 1.45;
const DEPTH_FIELD_STAR_STRENGTH = {
  field: 0.65,
  gold: 0.78,
  cluster: 0.62,
} as const;
const DEPTH_FIELD_LAYERS = {
  distantRing: {
    translationDepth: PARALLAX_DEPTH.far,
    perspectiveDepth: 1,
    perspectiveStrength: 0.28,
  },
  mainRing: {
    translationDepth: PARALLAX_DEPTH.middle,
    perspectiveDepth: 1,
    perspectiveStrength: 0.48,
  },
  cloudCore: {
    translationDepth: PARALLAX_DEPTH.near,
    perspectiveDepth: 1,
    perspectiveStrength: 0.42,
  },
  foregroundClouds: {
    translationDepth: PARALLAX_DEPTH.foreground,
    perspectiveDepth: 1,
    perspectiveStrength: 0.62,
  },
} as const satisfies Record<string, DepthFieldLayer>;
const EDGE_GLOW_DEPTH_SPECS: readonly EdgeGlowDepthSpec[] = [
  {
    variable: '--edge-glow-top-left-depth-scale',
    normalizedX: -0.82,
    normalizedY: -0.76,
    perspectiveStrength: 0.42,
  },
  {
    variable: '--edge-glow-top-right-depth-scale',
    normalizedX: 0.82,
    normalizedY: -0.74,
    perspectiveStrength: 0.34,
  },
  {
    variable: '--edge-glow-bottom-right-depth-scale',
    normalizedX: 0.8,
    normalizedY: 0.82,
    perspectiveStrength: 0.52,
  },
];
// Fog lives in the same camera-depth system as every other celestial object.
// Add another data entry here to give future haze a render stage and parallax depth.
const ATMOSPHERIC_FOG_LAYERS: readonly AtmosphericFogLayer[] = [
  {
    stage: 'far',
    depth: 0.12,
    centerX: 0.43,
    centerY: 0.34,
    widthScale: 1.42,
    heightScale: 0.44,
    rotation: -0.055,
    driftX: 14,
    driftY: 5,
    phase: 0.35,
    activeShare: 0.42,
    compactVisible: true,
  },
  {
    stage: 'middle',
    depth: 0.34,
    centerX: 0.66,
    centerY: 0.62,
    widthScale: 1.24,
    heightScale: 0.46,
    rotation: 0.038,
    driftX: 21,
    driftY: 7,
    phase: 2.15,
    activeShare: 0.48,
    compactVisible: false,
  },
  {
    stage: 'near',
    depth: 0.68,
    centerX: 0.62,
    centerY: 0.92,
    widthScale: 1.52,
    heightScale: 0.56,
    rotation: -0.026,
    driftX: 28,
    driftY: 10,
    phase: 4.4,
    activeShare: 0.34,
    compactVisible: true,
  },
] as const;
const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const FIELD_STAR_GOLD: Rgb = [255, 214, 122];
const FIELD_STAR_WHITE: Rgb = [255, 250, 244];
const CLOUD_ACCENT: Rgb = [72, 78, 255];
const ABOUT_CLOUD_ACCENT: Rgb = [158, 88, 255];
const FOREGROUND_CLOUD_PURPLE: Rgb = [148, 82, 255];
const QUASAR_LIGHT_BLUE: Rgb = [112, 220, 255];
const QUASAR_PURPLE: Rgb = [178, 104, 255];
const VORTEX_STAR_WHITE: Rgb = [246, 249, 255];
const DEEP_SPACE: Rgb = [10, 14, 54];
const DARK_STAR_NEUTRAL: Rgb = [225, 234, 255];
const LIGHT_STAR_NEUTRAL: Rgb = [42, 53, 88];
const COSMIC_RENDER_THEMES: Record<'dark' | 'light', CosmicRenderTheme> = {
  dark: {
    neutralStarColor: DARK_STAR_NEUTRAL,
    cloudCompositeOperation: 'screen',
    backgroundWash: { centerAlpha: 0.12, depthAlpha: 0.065 },
    fieldStarAlpha: 0.34,
    goldStarAlpha: 0.58,
    starClusters: { baseAlpha: 0.86, highlightAlpha: 0.92 },
    ringTrails: { baseAlpha: 0.09, laneFalloff: 0.01, dashAlpha: 0.17 },
    secondaryRings: {
      distantAlpha: 0.1,
      innerAlpha: 0.125,
      dashAlpha: 0.18,
      particleAlpha: 0.72,
    },
    aurora: { activeAlpha: 0.76, purpleAlpha: 0.32 },
    quasar: { spriteAlpha: 0.82, lensAlpha: 0.48, particleAlpha: 0.76 },
    vortex: { activeAlpha: 0.56, accentAlpha: 0.34, coreAlpha: 0.065, starAlpha: 0.88 },
    clouds: {
      accentAlpha: 0.4,
      activeAlpha: 0.7,
      glowCoreAlpha: 0.04,
      glowMidAlpha: 0.018,
    },
    atmosphericFog: { far: 0.13, middle: 0.17, near: 0.21 },
    foregroundClouds: {
      purpleAlpha: 0.22,
      activeAlpha: 0.1,
      glowCoreAlpha: 0.045,
      glowMidAlpha: 0.022,
    },
    ringParticleAlpha: 0.88,
    planetRing: { foregroundAlpha: 0.58, backgroundAlpha: 0.34 },
    planetSurface: {
      featureAlpha: 0.4,
      violetStormAlpha: 0.52,
      rockyShadowAlpha: 0.24,
      rockyCraterAlpha: 0.5,
      rockyCraterRimAlpha: 0.34,
      oceanFeatureAlpha: 0.46,
      oceanCloudAlpha: 0.48,
      iceFacetAlpha: 0.24,
      iceFissureAlpha: 0.72,
    },
    planetAtmosphere: {
      rockyAlpha: 0.2,
      iceAlpha: 0.68,
      standardAlpha: 0.44,
      iceOuterAlpha: 0.24,
    },
    planetGradient: [0.84, 0.98, 0.99, 0.99],
    rogueTrailAlpha: 0.28,
  },
  light: {
    neutralStarColor: LIGHT_STAR_NEUTRAL,
    cloudCompositeOperation: 'source-over',
    backgroundWash: { centerAlpha: 0.065, depthAlpha: 0.028 },
    fieldStarAlpha: 0.28,
    goldStarAlpha: 0.42,
    starClusters: { baseAlpha: 0.58, highlightAlpha: 0.72 },
    ringTrails: { baseAlpha: 0.07, laneFalloff: 0.007, dashAlpha: 0.115 },
    secondaryRings: {
      distantAlpha: 0.055,
      innerAlpha: 0.072,
      dashAlpha: 0.1,
      particleAlpha: 0.46,
    },
    aurora: { activeAlpha: 0.38, purpleAlpha: 0.16 },
    quasar: { spriteAlpha: 0.5, lensAlpha: 0.28, particleAlpha: 0.46 },
    vortex: { activeAlpha: 0.26, accentAlpha: 0.17, coreAlpha: 0.028, starAlpha: 0.58 },
    clouds: {
      accentAlpha: 0.15,
      activeAlpha: 0.26,
      glowCoreAlpha: 0.026,
      glowMidAlpha: 0.012,
    },
    atmosphericFog: { far: 0.06, middle: 0.078, near: 0.1 },
    foregroundClouds: {
      purpleAlpha: 0.105,
      activeAlpha: 0.055,
      glowCoreAlpha: 0.022,
      glowMidAlpha: 0.011,
    },
    ringParticleAlpha: 0.56,
    planetRing: { foregroundAlpha: 0.42, backgroundAlpha: 0.25 },
    planetSurface: {
      featureAlpha: 0.36,
      violetStormAlpha: 0.46,
      rockyShadowAlpha: 0.24,
      rockyCraterAlpha: 0.4,
      rockyCraterRimAlpha: 0.3,
      oceanFeatureAlpha: 0.43,
      oceanCloudAlpha: 0.43,
      iceFacetAlpha: 0.24,
      iceFissureAlpha: 0.6,
    },
    planetAtmosphere: {
      rockyAlpha: 0.16,
      iceAlpha: 0.52,
      standardAlpha: 0.32,
      iceOuterAlpha: 0.22,
    },
    planetGradient: [0.78, 0.88, 0.92, 0.78],
    rogueTrailAlpha: 0.2,
  },
};
const BRAND_STAR_COLORS: readonly Rgb[] = [
  [0, 175, 255],
  [255, 183, 0],
  [7, 236, 152],
  [255, 111, 97],
  [127, 84, 255],
  [233, 14, 230],
];
const DARK_CLUSTER_PALETTE: readonly Rgb[] = [
  [235, 243, 255],
  [166, 199, 255],
  [194, 174, 255],
  [255, 220, 148],
];
const LIGHT_CLUSTER_PALETTE: readonly Rgb[] = [
  [34, 48, 84],
  [43, 83, 150],
  [91, 63, 157],
  [130, 91, 31],
];
const PLANET_PALETTES: Record<PlanetKind, { highlight: Rgb; mid: Rgb; shadow: Rgb; feature: Rgb }> = {
  violet: {
    highlight: [173, 143, 255],
    mid: [79, 52, 171],
    shadow: [12, 9, 55],
    feature: [215, 170, 255],
  },
  amber: {
    highlight: [255, 220, 132],
    mid: [182, 99, 48],
    shadow: [56, 17, 24],
    feature: [255, 159, 82],
  },
  rocky: {
    highlight: [255, 151, 112],
    mid: [145, 67, 57],
    shadow: [47, 18, 30],
    feature: [255, 205, 151],
  },
  ocean: {
    highlight: [105, 229, 255],
    mid: [16, 119, 177],
    shadow: [7, 27, 76],
    feature: [142, 255, 223],
  },
  ice: {
    highlight: [218, 247, 255],
    mid: [83, 160, 218],
    shadow: [15, 37, 93],
    feature: [255, 255, 255],
  },
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDeviceTilt(delta: number, range: number) {
  const magnitude = Math.abs(delta);
  if (magnitude <= DEVICE_TILT_DEAD_ZONE) return 0;

  return clamp(
    Math.sign(delta)
      * (magnitude - DEVICE_TILT_DEAD_ZONE)
      / Math.max(range - DEVICE_TILT_DEAD_ZONE, 1),
    -1,
    1,
  );
}

function getShortestAngleDelta(value: number, baseline: number) {
  return ((value - baseline + 540) % 360) - 180;
}

function getScreenRelativeDeviceTilt(beta: number, gamma: number) {
  const fallbackOrientation = (window as Window & { orientation?: number }).orientation;
  const rawAngle = window.screen.orientation?.angle ?? fallbackOrientation ?? 0;
  const angle = ((rawAngle % 360) + 360) % 360;

  if (angle === 90) return { x: beta, y: -gamma };
  if (angle === 180) return { x: -gamma, y: -beta };
  if (angle === 270) return { x: -beta, y: gamma };
  return { x: gamma, y: beta };
}

function createParallaxFrame(
  scene: Scene,
  positionX: number,
  positionY: number,
): ParallaxFrame {
  const clampedPositionX = clamp(positionX, -1, 1);
  const clampedPositionY = clamp(positionY, -1, 1);
  return {
    positionX: clampedPositionX,
    positionY: clampedPositionY,
    maximumOffsetX: clamp(scene.width * 0.03, 18, 44),
    maximumOffsetY: clamp(scene.height * 0.024, 12, 28),
    maximumPitch: 10 * Math.PI / 180,
    maximumYaw: 14 * Math.PI / 180,
    centerX: scene.width * 0.5,
    centerY: scene.height * 0.5,
    inverseHalfWidth: 2 / Math.max(scene.width, 1),
    inverseHalfHeight: 2 / Math.max(scene.height, 1),
    cursorNormalization: 1 / Math.max(
      1,
      Math.abs(clampedPositionX) + Math.abs(clampedPositionY),
    ),
    maximumPerspectiveScale: 0.065,
  };
}

function getParallaxPose(
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

function applyParallaxPlaneTilt(
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
function projectAtParallaxDepth(
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

function syncEdgeGlowDepth(
  background: HTMLElement,
  parallax: ParallaxFrame,
) {
  const style = background.style;
  style.setProperty(
    '--edge-glow-depth-shift-x',
    `${(-parallax.positionX * parallax.maximumOffsetX * 0.3).toFixed(2)}px`,
  );
  style.setProperty(
    '--edge-glow-depth-shift-y',
    `${(-parallax.positionY * parallax.maximumOffsetY * 0.3).toFixed(2)}px`,
  );
  style.setProperty(
    '--edge-glow-depth-rotate-x',
    `${(-parallax.positionY * 1.15).toFixed(3)}deg`,
  );
  style.setProperty(
    '--edge-glow-depth-rotate-y',
    `${(parallax.positionX * 1.35).toFixed(3)}deg`,
  );

  for (const glow of EDGE_GLOW_DEPTH_SPECS) {
    const cursorSide = clamp(
      (
        glow.normalizedX * parallax.positionX
        + glow.normalizedY * parallax.positionY
      ) * parallax.cursorNormalization,
      -1,
      1,
    );
    const scale = clamp(
      1
        - cursorSide
        * parallax.maximumPerspectiveScale
        * glow.perspectiveStrength,
      0.94,
      1.06,
    );
    style.setProperty(glow.variable, scale.toFixed(4));
  }
}

function getDepthFieldSurface(
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

function drawOnDepthFieldSurface(
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

function getParallaxOffsetX(
  parallax: ParallaxFrame,
  depth: number,
) {
  return -parallax.positionX * parallax.maximumOffsetX * clamp(depth, 0, 1);
}

function getParallaxOffsetY(
  parallax: ParallaxFrame,
  depth: number,
) {
  return -parallax.positionY * parallax.maximumOffsetY * clamp(depth, 0, 1);
}

function drawAtParallaxDepth(
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

function snapToPixel(value: number, pixelRatio: number) {
  return Math.round(value * pixelRatio) / pixelRatio;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha})`;
}

function mixRgb(first: Rgb, second: Rgb, amount: number): Rgb {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
}

function getNebulaAccentColor(activeColor: Rgb) {
  const distanceFromAbout = Math.hypot(
    activeColor[0] - DEFAULT_ACTIVE_COLOR[0],
    activeColor[1] - DEFAULT_ACTIVE_COLOR[1],
    activeColor[2] - DEFAULT_ACTIVE_COLOR[2],
  );
  const aboutInfluence = smoothstep(clamp(1 - distanceFromAbout / 105, 0, 1));
  return mixRgb(CLOUD_ACCENT, ABOUT_CLOUD_ACCENT, aboutInfluence);
}

function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  if (shortHex) {
    return [
      Number.parseInt(`${shortHex[1]}${shortHex[1]}`, 16),
      Number.parseInt(`${shortHex[2]}${shortHex[2]}`, 16),
      Number.parseInt(`${shortHex[3]}${shortHex[3]}`, 16),
    ];
  }

  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (hex) {
    return [
      Number.parseInt(hex[1], 16),
      Number.parseInt(hex[2], 16),
      Number.parseInt(hex[3], 16),
    ];
  }

  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color);
  if (!rgb) return null;

  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
}

function resolveCssColor(element: HTMLElement, value: string) {
  const variableName = /var\((--[^),\s]+)/.exec(value)?.[1];
  const resolvedValue = variableName
    ? window.getComputedStyle(element).getPropertyValue(variableName)
    : value;
  return parseColor(resolvedValue) ?? DEFAULT_ACTIVE_COLOR;
}

function getPaletteColor(index: number, activeColor: Rgb): Rgb {
  return index === 0
    ? activeColor
    : BRAND_STAR_COLORS[(index - 1) % BRAND_STAR_COLORS.length];
}

function getAnimatedStarColor(
  seed: number,
  offset: number,
  time: number,
  activeColor: Rgb,
  neutralColor: Rgb,
  tintStrength: number,
) {
  const localTime = time + offset;
  const segment = Math.floor(localTime / STAR_COLOR_FADE_MS);
  const progress = smoothstep((localTime % STAR_COLOR_FADE_MS) / STAR_COLOR_FADE_MS);
  const paletteSize = BRAND_STAR_COLORS.length + 1;
  const fromIndex = Math.floor(seededRandom(seed * 31.7 + segment * 17.3) * paletteSize);
  const toIndex = Math.floor(seededRandom(seed * 31.7 + (segment + 1) * 17.3) * paletteSize);
  const transitioningColor = mixRgb(
    getPaletteColor(fromIndex, activeColor),
    getPaletteColor(toIndex, activeColor),
    progress,
  );
  return mixRgb(neutralColor, transitioningColor, tintStrength);
}

function getAnimatedFieldStarColor(seed: number, offset: number, time: number) {
  const localTime = time + offset;
  const segment = Math.floor(localTime / STAR_COLOR_FADE_MS);
  const progress = smoothstep((localTime % STAR_COLOR_FADE_MS) / STAR_COLOR_FADE_MS);
  const goldToWhite = seededRandom(seed * 19.7 + segment * 11.3) > 0.5;
  const startColor = goldToWhite ? FIELD_STAR_GOLD : FIELD_STAR_WHITE;
  const endColor = goldToWhite ? FIELD_STAR_WHITE : FIELD_STAR_GOLD;
  return mixRgb(startColor, endColor, progress);
}

function createCloudAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 380;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(18px)';
  for (let index = 0; index < 6; index += 1) {
    const y = canvas.height * (0.34 + index * 0.055);
    const bend = (seededRandom(index * 4.7 + 20) - 0.5) * canvas.height * 0.34;
    context.strokeStyle = `rgba(255, 255, 255, ${0.07 + index * 0.008})`;
    context.lineWidth = 18 + seededRandom(index * 6.3 + 21) * 22;
    context.beginPath();
    context.moveTo(canvas.width * 0.08, y);
    context.bezierCurveTo(
      canvas.width * 0.3,
      y - bend,
      canvas.width * 0.62,
      y + bend,
      canvas.width * 0.92,
      y - bend * 0.25,
    );
    context.stroke();
  }

  context.filter = 'blur(11px)';
  for (let index = 0; index < 34; index += 1) {
    const broadLayer = index < 10;
    const x = canvas.width * (0.12 + seededRandom(index * 5.1 + 1) * 0.76);
    const y = canvas.height * (0.2 + seededRandom(index * 7.7 + 2) * 0.62);
    const radius = canvas.width * (
      broadLayer
        ? 0.13 + seededRandom(index * 9.3 + 3) * 0.07
        : 0.035 + seededRandom(index * 9.3 + 3) * 0.065
    );
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const coreAlpha = broadLayer
      ? 0.11 + seededRandom(index * 11.9 + 4) * 0.1
      : 0.16 + seededRandom(index * 11.9 + 4) * 0.14;
    gradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(0.28, `rgba(255, 255, 255, ${coreAlpha * 0.68})`);
    gradient.addColorStop(0.66, `rgba(255, 255, 255, ${coreAlpha * 0.14})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.filter = 'none';

  // Fade the procedural texture to zero before it reaches the bitmap edges.
  // This prevents the softly blurred cloud from revealing its rectangular bounds.
  context.globalCompositeOperation = 'destination-in';
  const horizontalFade = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horizontalFade.addColorStop(0.16, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(0.84, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const verticalFade = context.createLinearGradient(0, 0, 0, canvas.height);
  verticalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  verticalFade.addColorStop(0.18, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(0.82, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

function createAuroraAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 340;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(9px)';
  for (let ribbon = 0; ribbon < 14; ribbon += 1) {
    const seed = ribbon * 19.7 + 310;
    const position = (ribbon + 0.22 + seededRandom(seed) * 0.56) / 14;
    const x = canvas.width * (0.04 + position * 0.91);
    const orbitX = -0.48 + position * 1.4;
    const ellipseHeight = Math.sqrt(Math.max(0, 1 - orbitX * orbitX));
    const baseY = canvas.height * (0.54 + (1 - ellipseHeight) * 0.68);
    const ribbonHeight = Math.min(
      baseY - canvas.height * 0.04,
      canvas.height * (0.24 + seededRandom(seed + 1.7) * 0.48),
    );
    const topY = baseY - ribbonHeight;
    const halfWidth = 10 + seededRandom(seed + 3.1) * 27;
    const wave = (seededRandom(seed + 5.3) - 0.5) * halfWidth * 1.4;
    const coreAlpha = 0.055 + seededRandom(seed + 7.1) * 0.075;
    const gradient = context.createLinearGradient(0, topY, 0, baseY);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.28, `rgba(255, 255, 255, ${coreAlpha * 0.35})`);
    gradient.addColorStop(0.7, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${coreAlpha * 0.16})`);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(x - halfWidth * 0.42, baseY);
    context.bezierCurveTo(
      x - halfWidth,
      topY + ribbonHeight * 0.68,
      x - halfWidth * 0.2 + wave,
      topY + ribbonHeight * 0.22,
      x + wave * 0.45,
      topY,
    );
    context.bezierCurveTo(
      x + halfWidth * 0.22 + wave,
      topY + ribbonHeight * 0.3,
      x + halfWidth,
      topY + ribbonHeight * 0.7,
      x + halfWidth * 0.42,
      baseY,
    );
    context.closePath();
    context.fill();
  }

  context.filter = 'blur(1.5px)';
  for (let ray = 0; ray < 30; ray += 1) {
    const seed = ray * 23.9 + 780;
    const position = (ray + seededRandom(seed)) / 30;
    const x = canvas.width * (0.045 + position * 0.9);
    const orbitX = -0.48 + position * 1.4;
    const ellipseHeight = Math.sqrt(Math.max(0, 1 - orbitX * orbitX));
    const baseY = canvas.height * (0.54 + (1 - ellipseHeight) * 0.68);
    const rayHeight = Math.min(
      baseY - canvas.height * 0.04,
      canvas.height * (0.16 + seededRandom(seed + 2.3) * 0.5),
    );
    const topY = baseY - rayHeight;
    const rayWidth = 0.8 + seededRandom(seed + 4.7) * 2.2;
    const rayAlpha = 0.045 + seededRandom(seed + 6.1) * 0.085;
    const gradient = context.createLinearGradient(0, topY, 0, baseY);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.36, `rgba(255, 255, 255, ${rayAlpha * 0.45})`);
    gradient.addColorStop(0.78, `rgba(255, 255, 255, ${rayAlpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(x - rayWidth * 0.5, topY, rayWidth, rayHeight);
  }
  context.filter = 'none';

  context.globalCompositeOperation = 'destination-in';
  const horizontalFade = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horizontalFade.addColorStop(0.08, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const verticalFade = context.createLinearGradient(0, 0, 0, canvas.height);
  verticalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  verticalFade.addColorStop(0.12, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';

  return canvas;
}

function createVortexAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;

  context.save();
  context.translate(centerX, centerY);
  context.globalCompositeOperation = 'lighter';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.filter = 'blur(7px)';
  for (let arm = 0; arm < 12; arm += 1) {
    const seed = 6100 + arm * 31.7;
    const phase = (arm / 12) * TAU + (seededRandom(seed) - 0.5) * 0.24;
    const turns = 1.2 + seededRandom(seed + 2.3) * 0.55;
    context.strokeStyle = `rgba(255, 255, 255, ${0.038 + seededRandom(seed + 4.9) * 0.045})`;
    context.lineWidth = 12 + seededRandom(seed + 7.1) * 18;
    context.beginPath();
    for (let point = 0; point < 74; point += 1) {
      const progress = point / 73;
      const angle = phase + progress * turns * TAU;
      const wobble = Math.sin(progress * TAU * 3 + seed) * (2 + progress * 4);
      const radius = 18 + progress * 224 + wobble;
      const x = Math.cos(angle) * radius * 1.48;
      const y = Math.sin(angle) * radius * 0.9;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  context.filter = 'blur(0.75px)';
  for (let filament = 0; filament < 38; filament += 1) {
    const seed = 7200 + filament * 43.9;
    const phase = seededRandom(seed + 1.1) * TAU;
    const turns = 1.15 + seededRandom(seed + 3.7) * 0.9;
    const startRadius = 12 + seededRandom(seed + 5.9) * 34;
    const reach = 158 + seededRandom(seed + 8.3) * 88;
    context.strokeStyle = `rgba(255, 255, 255, ${0.085 + seededRandom(seed + 10.7) * 0.15})`;
    context.lineWidth = 0.85 + seededRandom(seed + 12.1) * 3.3;
    context.setLineDash([
      16 + seededRandom(seed + 14.3) * 34,
      5 + seededRandom(seed + 16.7) * 15,
      3 + seededRandom(seed + 18.9) * 12,
      8 + seededRandom(seed + 21.1) * 22,
    ]);
    context.lineDashOffset = seededRandom(seed + 23.7) * 80;
    context.beginPath();
    for (let point = 0; point < 82; point += 1) {
      const progress = point / 81;
      const angle = phase + progress * turns * TAU;
      const ripple = Math.sin(progress * TAU * 4 + seed) * (1.2 + progress * 3.4);
      const radius = startRadius + progress * reach + ripple;
      const x = Math.cos(angle) * radius * 1.48;
      const y = Math.sin(angle) * radius * 0.9;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
  context.setLineDash([]);

  context.filter = 'blur(1px)';
  for (let knot = 0; knot < 24; knot += 1) {
    const seed = 8600 + knot * 47.3;
    const progress = 0.18 + seededRandom(seed + 1.9) * 0.74;
    const angle = seededRandom(seed + 4.1) * TAU + progress * TAU * 1.6;
    const radius = 24 + progress * 215;
    const x = Math.cos(angle) * radius * 1.48;
    const y = Math.sin(angle) * radius * 0.9;
    const knotRadius = 2 + seededRandom(seed + 6.7) * 6;
    const gradient = context.createRadialGradient(x, y, 0, x, y, knotRadius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.12 + seededRandom(seed + 8.9) * 0.13})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(
      x - knotRadius,
      y - knotRadius,
      knotRadius * 2,
      knotRadius * 2,
    );
  }
  context.restore();

  context.globalCompositeOperation = 'destination-in';
  const edgeFade = context.createRadialGradient(
    centerX,
    centerY,
    12,
    centerX,
    centerY,
    canvas.width * 0.49,
  );
  edgeFade.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
  edgeFade.addColorStop(0.1, 'rgba(255, 255, 255, 0.82)');
  edgeFade.addColorStop(0.28, 'rgba(255, 255, 255, 1)');
  edgeFade.addColorStop(0.76, 'rgba(255, 255, 255, 0.88)');
  edgeFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = edgeFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';

  return canvas;
}

function createQuasarSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const center = canvas.width * 0.5;

  const outerGlow = context.createRadialGradient(center, center, 0, center, center, 142);
  outerGlow.addColorStop(0, rgba(QUASAR_LIGHT_BLUE, 0.2));
  outerGlow.addColorStop(0.22, rgba(QUASAR_PURPLE, 0.13));
  outerGlow.addColorStop(0.58, rgba(QUASAR_LIGHT_BLUE, 0.035));
  outerGlow.addColorStop(1, rgba(QUASAR_PURPLE, 0));
  context.fillStyle = outerGlow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(center, center);
  context.rotate(-0.14);
  context.globalCompositeOperation = 'lighter';

  const jetGradient = context.createLinearGradient(0, -142, 0, 142);
  jetGradient.addColorStop(0, rgba(QUASAR_PURPLE, 0));
  jetGradient.addColorStop(0.32, rgba(QUASAR_LIGHT_BLUE, 0.1));
  jetGradient.addColorStop(0.49, 'rgba(245, 250, 255, 0.42)');
  jetGradient.addColorStop(0.51, 'rgba(245, 250, 255, 0.42)');
  jetGradient.addColorStop(0.68, rgba(QUASAR_LIGHT_BLUE, 0.1));
  jetGradient.addColorStop(1, rgba(QUASAR_PURPLE, 0));

  context.filter = 'blur(14px)';
  context.fillStyle = jetGradient;
  context.beginPath();
  context.moveTo(0, -148);
  context.lineTo(15, -13);
  context.lineTo(8, 13);
  context.lineTo(0, 148);
  context.lineTo(-8, 13);
  context.lineTo(-15, -13);
  context.closePath();
  context.fill();

  context.filter = 'blur(4px)';
  context.globalAlpha = 0.82;
  context.beginPath();
  context.moveTo(0, -138);
  context.lineTo(4.5, -8);
  context.lineTo(0, 0);
  context.lineTo(-4.5, -8);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(0, 138);
  context.lineTo(4.5, 8);
  context.lineTo(0, 0);
  context.lineTo(-4.5, 8);
  context.closePath();
  context.fill();

  context.globalAlpha = 1;
  context.filter = 'blur(11px)';
  context.strokeStyle = rgba(QUASAR_PURPLE, 0.3);
  context.lineWidth = 12;
  context.beginPath();
  context.ellipse(0, 0, 88, 15, 0, 0, TAU);
  context.stroke();

  context.filter = 'blur(3px)';
  context.strokeStyle = rgba(QUASAR_LIGHT_BLUE, 0.66);
  context.lineWidth = 4.5;
  context.beginPath();
  context.ellipse(0, 0, 83, 12, 0, 0, TAU);
  context.stroke();
  context.strokeStyle = rgba(QUASAR_PURPLE, 0.58);
  context.lineWidth = 2.2;
  context.beginPath();
  context.ellipse(0, 0, 62, 8, 0, 0, TAU);
  context.stroke();

  context.filter = 'none';
  const core = context.createRadialGradient(0, 0, 0, 0, 0, 23);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.16, rgba(QUASAR_LIGHT_BLUE, 0.96));
  core.addColorStop(0.5, rgba(QUASAR_PURPLE, 0.42));
  core.addColorStop(1, rgba(QUASAR_PURPLE, 0));
  context.fillStyle = core;
  context.beginPath();
  context.arc(0, 0, 23, 0, TAU);
  context.fill();
  context.restore();

  return canvas;
}

function createTintCanvas(alphaCanvas: HTMLCanvasElement, color: Rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = alphaCanvas.width;
  canvas.height = alphaCanvas.height;
  const context = canvas.getContext('2d');
  if (!context) return { canvas, context: null };

  context.drawImage(alphaCanvas, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(color, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return { canvas, context };
}

function createVortexSprites(): VortexSprites | null {
  const alpha = createVortexAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const accentTint = createTintCanvas(alpha, CLOUD_ACCENT);
  if (!activeTint.context || !accentTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    accent: accentTint.canvas,
    activeContext: activeTint.context,
    accentContext: accentTint.context,
    lastActiveColor: '',
    lastAccentColor: '',
  };
}

function createAuroraSprites(): AuroraSprites | null {
  const alpha = createAuroraAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const purpleTint = createTintCanvas(alpha, FOREGROUND_CLOUD_PURPLE);
  if (!activeTint.context || !purpleTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    purple: purpleTint.canvas,
    activeContext: activeTint.context,
    lastActiveColor: '',
  };
}

function createCloudSprites(): CloudSprites | null {
  const alpha = createCloudAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const accentTint = createTintCanvas(alpha, CLOUD_ACCENT);
  const purpleTint = createTintCanvas(alpha, FOREGROUND_CLOUD_PURPLE);
  if (!activeTint.context || !accentTint.context || !purpleTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    accent: accentTint.canvas,
    purple: purpleTint.canvas,
    activeContext: activeTint.context,
    accentContext: accentTint.context,
    lastActiveColor: '',
    lastAccentColor: '',
  };
}

function updateCloudTint(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  alpha: HTMLCanvasElement,
  color: Rgb,
  lastColor: string,
) {
  const quantizedColor: Rgb = [
    Math.round(color[0] / 12) * 12,
    Math.round(color[1] / 12) * 12,
    Math.round(color[2] / 12) * 12,
  ];
  const colorKey = `${quantizedColor[0]}-${quantizedColor[1]}-${quantizedColor[2]}`;
  if (colorKey === lastColor) return lastColor;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  context.drawImage(alpha, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(quantizedColor, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return colorKey;
}

function updateActiveCloudTint(clouds: CloudSprites, color: Rgb) {
  clouds.lastActiveColor = updateCloudTint(
    clouds.active,
    clouds.activeContext,
    clouds.alpha,
    color,
    clouds.lastActiveColor,
  );
}

function updateAccentCloudTint(clouds: CloudSprites, color: Rgb) {
  clouds.lastAccentColor = updateCloudTint(
    clouds.accent,
    clouds.accentContext,
    clouds.alpha,
    color,
    clouds.lastAccentColor,
  );
}

function updateSceneCloudTints(clouds: CloudSprites, activeColor: Rgb) {
  const accentColor = getNebulaAccentColor(activeColor);
  updateActiveCloudTint(clouds, mixRgb(activeColor, accentColor, 0.16));
  updateAccentCloudTint(clouds, accentColor);
}

function updateAuroraTint(aurora: AuroraSprites, color: Rgb) {
  aurora.lastActiveColor = updateCloudTint(
    aurora.active,
    aurora.activeContext,
    aurora.alpha,
    color,
    aurora.lastActiveColor,
  );
}

function updateVortexTints(vortex: VortexSprites, activeColor: Rgb, accentColor: Rgb) {
  vortex.lastActiveColor = updateCloudTint(
    vortex.active,
    vortex.activeContext,
    vortex.alpha,
    activeColor,
    vortex.lastActiveColor,
  );
  vortex.lastAccentColor = updateCloudTint(
    vortex.accent,
    vortex.accentContext,
    vortex.alpha,
    accentColor,
    vortex.lastAccentColor,
  );
}

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
  isDark: boolean,
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
    const alpha = isDark
      ? 0.34 + seededRandom(seed + 5.2) * 0.48
      : 0.22 + seededRandom(seed + 5.2) * 0.34;
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

function createStarClusters(
  width: number,
  height: number,
  compact: boolean,
  pixelRatio: number,
) {
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
      darkSprite: createStarClusterSprite(
        spec,
        count,
        spritePixelRatio,
        DARK_CLUSTER_PALETTE,
        true,
        seedOffset,
      ),
      lightSprite: createStarClusterSprite(
        spec,
        count,
        spritePixelRatio,
        LIGHT_CLUSTER_PALETTE,
        false,
        seedOffset,
      ),
      highlights: createClusterHighlights(spec, highlightCount, seedOffset),
    };
  });
}

function createSecondaryRingParticles(
  count: number,
  lanes: number,
  seedOffset: number,
  direction: 1 | -1,
  speedMin: number,
  speedRange: number,
  sizeMin: number,
  sizeRange: number,
) {
  return Array.from({ length: count }, (_, index): RingParticle => {
    const seed = seedOffset + index * 29.3;
    return {
      angle: seededRandom(seed + 1.1) * TAU,
      size: sizeMin + seededRandom(seed + 3.7) * sizeRange,
      lane: Math.floor(seededRandom(seed + 5.9) * lanes),
      speed: direction * (speedMin + seededRandom(seed + 7.3) * speedRange),
      phase: seededRandom(seed + 9.7) * TAU,
      colorSeed: seed * 0.37,
      colorOffset: seededRandom(seed + 11.9) * STAR_COLOR_FADE_MS,
    };
  });
}

function createQuasarLightParticles(count: number) {
  return Array.from({ length: count }, (_, index): QuasarLightParticle => {
    const seed = 5200 + index * 37.1;
    return {
      angle: seededRandom(seed + 1.3) * TAU,
      phase: seededRandom(seed + 3.7),
      speed: 0.000035 + seededRandom(seed + 5.9) * 0.000024,
      direction: index % 2 === 0 ? 1 : -1,
      size: 0.55 + seededRandom(seed + 7.1) * 1.15,
      colorIndex: index % 3 === 0 ? 1 : 0,
    };
  });
}

function createVortexStars(count: number) {
  return Array.from({ length: count }, (_, index): VortexStar => {
    const seed = 9400 + index * 41.3;
    const radius = 0.12 + seededRandom(seed + 1.7) * 0.62;
    return {
      angle: seededRandom(seed + 3.9) * TAU,
      radius,
      speed: 0.000014 + (1 - radius) * 0.000026 + seededRandom(seed + 6.1) * 0.000008,
      size: 0.55 + seededRandom(seed + 8.7) * 1.2,
      phase: seededRandom(seed + 11.3) * TAU,
    };
  });
}

function createGoldStars(width: number, height: number, compact: boolean) {
  const count = compact
    ? clamp(Math.round((width * height) / 2450), 138, 196)
    : clamp(Math.round((width * height) / 3300), 236, 372);

  return Array.from({ length: count }, (_, index): GoldStar => {
    const seed = 12_800 + index * 19.37;
    const layerSelector = seededRandom(seed + 1.9);
    const depth = layerSelector < 0.52
      ? 0.24 + seededRandom(seed + 2.5) * 0.22
      : layerSelector < 0.84
        ? 0.5 + seededRandom(seed + 2.5) * 0.2
        : 0.74 + seededRandom(seed + 2.5) * 0.24;

    return {
      x: seededRandom(seed + 3.7),
      y: seededRandom(seed + 5.1),
      size: 0.42 + depth * 0.86 + seededRandom(seed + 7.3) * 0.48,
      depth,
      phase: seededRandom(seed + 9.7) * TAU,
      drift: 2.5 + depth * 8,
    };
  });
}

function createScene(
  width: number,
  height: number,
  clouds: CloudSprites,
  aurora: AuroraSprites,
  quasarSprite: HTMLCanvasElement,
  vortexSprites: VortexSprites,
  pixelRatio: number,
): Scene {
  const compact = width < 720;
  const starCount = compact
    ? clamp(Math.round((width * height) / 4400), 98, 148)
    : clamp(Math.round((width * height) / 7200), 150, 245);
  const ringParticleCount = compact ? 86 : 168;
  const stars = Array.from({ length: starCount }, (_, index): Star => ({
    x: seededRandom(index * 3.1 + 1),
    y: seededRandom(index * 5.7 + 2),
    size: 0.28 + seededRandom(index * 7.9 + 3) * 2.15,
    depth: 0.28 + seededRandom(index * 9.1 + 4) * 0.72,
    phase: seededRandom(index * 11.3 + 5) * TAU,
    colorSeed: index * 1.73 + 0.41,
    colorOffset: seededRandom(index * 13.7 + 6) * STAR_COLOR_FADE_MS,
    tintStrength: 0.28 + seededRandom(index * 15.1 + 7) * 0.72,
  }));
  const goldStars = createGoldStars(width, height, compact);
  const ringParticles = Array.from(
    { length: ringParticleCount },
    (_, index): RingParticle => ({
      angle: seededRandom(index * 4.3 + 8) * TAU,
      size: 0.65 + seededRandom(index * 6.7 + 9) * 1.9,
      lane: Math.floor(seededRandom(index * 8.9 + 10) * 4),
      speed: 0.000026 + seededRandom(index * 10.1 + 11) * 0.000012,
      phase: seededRandom(index * 12.5 + 12) * TAU,
      colorSeed: index * 2.11 + 1.7,
      colorOffset: seededRandom(index * 14.3 + 13) * STAR_COLOR_FADE_MS,
    }),
  );
  const planets: Planet[] = [
    {
      motion: 'rogue',
      x: 0.91,
      y: 0.25,
      size: compact ? 0.034 : 0.048,
      velocityX: -0.014,
      waveY: 24,
      waveSpeed: 0.00009,
      phase: 0.3,
      spinSpeed: 0.00022,
      ringed: false,
      kind: 'violet',
    },
    {
      motion: 'orbit',
      angle: 4.72,
      lane: 1,
      size: compact ? 0.045 : 0.072,
      speed: 0.000026,
      direction: 1,
      phase: 2.1,
      spinSpeed: 0.00018,
      ringed: true,
      kind: 'amber',
    },
    {
      motion: 'orbit',
      angle: 5.32,
      lane: 0,
      size: 0.027,
      speed: 0.000038,
      direction: -1,
      phase: 4.2,
      spinSpeed: 0.00028,
      ringed: false,
      kind: 'rocky',
    },
    {
      motion: 'rogue',
      x: 0.18,
      y: 0.73,
      size: 0.042,
      velocityX: 0.01,
      waveY: 18,
      waveSpeed: 0.00012,
      phase: 5.4,
      spinSpeed: 0.0002,
      ringed: false,
      kind: 'ocean',
    },
    {
      motion: 'orbit',
      angle: 5.74,
      lane: 2,
      size: 0.021,
      speed: 0.00003,
      direction: 1,
      phase: 1.4,
      spinSpeed: 0.00031,
      ringed: false,
      kind: 'ice',
    },
  ];
  const orbit: OrbitGeometry = compact
    ? {
        centerX: width * 0.47,
        centerY: height * 0.7,
        radiusX: width * 0.91,
        radiusY: Math.max(height * 0.27, 125),
        tilt: 0.14,
      }
    : {
        centerX: width * 0.34,
        centerY: height * 0.82,
        radiusX: width * 0.76,
        radiusY: Math.max(height * 0.35, 210),
        tilt: 0.14,
      };
  const quasar: Quasar = {
    centerX: width * (compact ? 0.38 : 0.42),
    centerY: height * (compact ? 0.16 : 0.14),
    size: compact
      ? clamp(Math.min(width, height) * 0.26, 104, 144)
      : clamp(Math.min(width, height) * 0.24, 148, 212),
    phase: 1.7,
    sprite: quasarSprite,
    particles: createQuasarLightParticles(compact ? 10 : 16),
  };
  const vortex: Vortex = {
    sprites: vortexSprites,
    stars: createVortexStars(compact ? 24 : 46),
  };
  const secondaryRings: Scene['secondaryRings'] = {
    distant: {
      centerX: width * (compact ? 0.86 : 0.9),
      centerY: height * (compact ? 0.16 : 0.13),
      radiusX: compact
        ? clamp(width * 0.27, 82, 126)
        : clamp(width * 0.18, 190, 300),
      radiusY: compact
        ? clamp(height * 0.065, 42, 68)
        : clamp(height * 0.085, 58, 102),
      tilt: -0.24,
      lanes: 2,
      laneSpacing: 0.08,
      dashSpeed: 0.0045,
      colorMix: 0.74,
      glintAngle: 5.2,
      glintSpeed: -0.000018,
      particles: createSecondaryRingParticles(
        compact ? 14 : 24,
        2,
        2400,
        1,
        0.000022,
        0.00001,
        0.5,
        1.2,
      ),
    },
    inner: {
      centerX: orbit.centerX,
      centerY: orbit.centerY,
      radiusX: orbit.radiusX * (compact ? 0.48 : 0.44),
      radiusY: orbit.radiusY * (compact ? 0.52 : 0.48),
      tilt: orbit.tilt - 0.045,
      lanes: 3,
      laneSpacing: 0.065,
      dashSpeed: -0.008,
      colorMix: 0.52,
      glintAngle: 3.8,
      glintSpeed: 0.000032,
      particles: createSecondaryRingParticles(
        compact ? 28 : 46,
        3,
        3600,
        -1,
        0.000028,
        0.000014,
        0.58,
        1.55,
      ),
    },
  };
  const starClusters = createStarClusters(width, height, compact, pixelRatio);
  return {
    width,
    height,
    pixelRatio,
    compact,
    stars,
    goldStars,
    starClusters,
    ringParticles,
    planets,
    orbit,
    secondaryRings,
    clouds,
    aurora,
    quasar,
    vortex,
  };
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: Rgb,
  alpha: number,
) {
  if (size > 1.75) {
    context.fillStyle = rgba(color, alpha * 0.12);
    context.beginPath();
    context.arc(x, y, size * 2.7, 0, TAU);
    context.fill();
  }

  const coreSize = Math.max(0.55, size * 0.68);
  if (size > 1.15) {
    const armLength = size * 1.9;
    const armWidth = Math.max(0.38, coreSize * 0.35);
    context.fillStyle = rgba(color, alpha * 0.3);
    context.fillRect(x - armLength, y - armWidth * 0.5, armLength * 2, armWidth);
    context.fillRect(x - armWidth * 0.5, y - armLength, armWidth, armLength * 2);
  }

  context.fillStyle = rgba(color, alpha);
  context.fillRect(x - coreSize * 0.5, y - coreSize * 0.5, coreSize, coreSize);
}

function drawBackgroundWash(
  context: CanvasRenderingContext2D,
  scene: Scene,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
) {
  const { width, height } = scene;
  const centerX = scene.compact ? width * 0.52 : width * 0.48;
  const centerY = scene.compact ? height * 0.57 : height * 0.62;
  const radius = Math.max(width, height) * 0.78;
  const wash = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const centerColor = mixRgb(DEEP_SPACE, activeColor, 0.24);
  wash.addColorStop(0, rgba(centerColor, renderTheme.backgroundWash.centerAlpha));
  wash.addColorStop(0.48, rgba(DEEP_SPACE, renderTheme.backgroundWash.depthAlpha));
  wash.addColorStop(1, rgba(DEEP_SPACE, 0));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function drawQuasar(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  viewPose: ParallaxPose,
) {
  const { quasar } = scene;
  const motionTime = reducedMotion ? 0 : time;
  const pulse = reducedMotion
    ? 0.94
    : 0.92 + Math.sin(motionTime * 0.00135 + quasar.phase) * 0.08;
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000031 + 0.4) * 2.5;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000026 + 1.1) * 1.8;
  const centerX = quasar.centerX + driftX;
  const centerY = quasar.centerY + driftY;
  const rotation = -0.14 + Math.sin(viewPose.yaw) * 0.55;
  const discScaleY = clamp(0.29 + Math.sin(viewPose.pitch) * 0.5, 0.2, 0.4);

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(centerX, centerY);
  context.rotate(reducedMotion ? 0 : Math.sin(motionTime * 0.000021) * 0.018);
  applyParallaxPlaneTilt(context, viewPose, 0.6);
  context.globalAlpha = renderTheme.quasar.spriteAlpha * pulse;
  const spriteSize = quasar.size * (0.96 + pulse * 0.04);
  context.drawImage(
    quasar.sprite,
    -spriteSize * 0.5,
    -spriteSize * 0.5,
    spriteSize,
    spriteSize,
  );
  context.restore();

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(centerX, centerY);
  context.rotate(rotation);
  context.lineCap = 'round';
  for (let lens = 0; lens < 3; lens += 1) {
    const radius = quasar.size * (0.17 + lens * 0.055);
    const color = lens % 2 === 0 ? QUASAR_LIGHT_BLUE : QUASAR_PURPLE;
    const lensPulse = reducedMotion
      ? 0.82
      : 0.72 + Math.sin(motionTime * 0.001 + lens * 1.8) * 0.2;
    context.setLineDash([
      radius * (0.9 + lens * 0.12),
      radius * 0.46,
      radius * 0.18,
      radius * 0.62,
    ]);
    context.lineDashOffset = -motionTime * (0.004 + lens * 0.0015) * (lens % 2 === 0 ? 1 : -1);
    context.lineWidth = 0.65 + lens * 0.18;
    context.strokeStyle = rgba(
      color,
      renderTheme.quasar.lensAlpha * lensPulse * (1 - lens * 0.13),
    );
    context.beginPath();
    context.ellipse(0, 0, radius, radius * discScaleY, 0, 0, TAU);
    context.stroke();
  }
  context.setLineDash([]);
  context.restore();

  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.lineCap = 'round';
  for (const particle of quasar.particles) {
    const progress = (motionTime * particle.speed + particle.phase) % 1;
    const previousProgress = Math.max(0, progress - 0.075);
    const radialProgress = smoothstep(
      particle.direction === 1 ? progress : 1 - progress,
    );
    const previousRadialProgress = smoothstep(
      particle.direction === 1 ? previousProgress : 1 - previousProgress,
    );
    const radius = quasar.size * (0.075 + radialProgress * 0.34);
    const previousRadius = quasar.size * (0.075 + previousRadialProgress * 0.34);
    const angle = particle.angle + particle.direction * progress * TAU * 0.72;
    const previousAngle = particle.angle
      + particle.direction * previousProgress * TAU * 0.72;
    const localX = Math.cos(angle) * radius;
    const localY = Math.sin(angle) * radius * discScaleY;
    const previousLocalX = Math.cos(previousAngle) * previousRadius;
    const previousLocalY = Math.sin(previousAngle) * previousRadius * discScaleY;
    const x = snapToPixel(
      centerX + localX * cosRotation - localY * sinRotation,
      scene.pixelRatio,
    );
    const y = snapToPixel(
      centerY + localX * sinRotation + localY * cosRotation,
      scene.pixelRatio,
    );
    const previousX = centerX
      + previousLocalX * cosRotation
      - previousLocalY * sinRotation;
    const previousY = centerY
      + previousLocalX * sinRotation
      + previousLocalY * cosRotation;
    const color = particle.colorIndex === 0 ? QUASAR_LIGHT_BLUE : QUASAR_PURPLE;
    const fade = Math.sin(progress * Math.PI);
    const alpha = renderTheme.quasar.particleAlpha * fade;
    context.strokeStyle = rgba(color, alpha * 0.44);
    context.lineWidth = Math.max(0.5, particle.size * 0.52);
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(x, y);
    context.stroke();
    drawStar(context, x, y, particle.size, color, alpha * 0.86);
  }
  context.restore();
}

function getStarClusterMotion(
  cluster: StarCluster,
  time: number,
  reducedMotion: boolean,
): [number, number, number] {
  if (reducedMotion) return [0, 0, 0.92];

  const driftSpeed = 0.000042 + cluster.depth * 0.000009;
  const driftX = Math.sin(time * driftSpeed + cluster.phase) * cluster.drift;
  const driftY = Math.cos(time * driftSpeed * 0.82 + cluster.phase) * cluster.drift * 0.72;
  const opacityPulse = 0.92 + Math.sin(time * 0.00022 + cluster.phase) * 0.05;
  return [driftX, driftY, opacityPulse];
}

function drawStarClusterSprites(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  isDark: boolean,
  reducedMotion: boolean,
  layer: ClusterLayer,
  parallax: ParallaxFrame,
) {
  for (const cluster of scene.starClusters) {
    if (cluster.layer !== layer) continue;
    const [driftX, driftY, opacityPulse] = getStarClusterMotion(cluster, time, reducedMotion);
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
    const x = snapToPixel(anchorX - cluster.width * 0.5, scene.pixelRatio);
    const y = snapToPixel(anchorY - cluster.height * 0.5, scene.pixelRatio);
    const sprite = isDark ? cluster.darkSprite : cluster.lightSprite;
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

function drawStarClusterHighlights(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  layer: ClusterLayer,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  for (const cluster of scene.starClusters) {
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
        const x = snapToPixel(originX + highlight.localX, scene.pixelRatio);
        const y = snapToPixel(originY + highlight.localY, scene.pixelRatio);
        const alpha = renderTheme.starClusters.highlightAlpha
          * (0.62 + cluster.depth * 0.38)
          * twinkle
          * surface.alphaScale;
        drawStar(context, x, y, highlight.size, color, alpha);
      }
    });
  }
}

function drawFieldStars(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };
  for (const star of scene.stars) {
    const motionTime = reducedMotion ? 0 : time;
    const baseX = star.x * scene.width
      + Math.sin(motionTime * 0.00022 + star.phase) * 13 * star.depth;
    const baseY = star.y * scene.height
      + Math.cos(motionTime * 0.00017 + star.phase) * 9 * star.depth;
    projectAtParallaxDepth(
      parallax,
      baseX,
      baseY,
      star.depth * PARALLAX_DEPTH.starField,
      star.depth,
      DEPTH_FIELD_STAR_STRENGTH.field,
      projection,
    );
    const twinkle = reducedMotion ? 0.72 : 0.58 + Math.sin(time * 0.0013 + star.phase) * 0.28;
    const color = getAnimatedFieldStarColor(star.colorSeed, star.colorOffset, reducedMotion ? 0 : time);
    const alpha = renderTheme.fieldStarAlpha
      * star.depth
      * twinkle
      * projection.alphaScale;
    drawStar(
      context,
      projection.x,
      projection.y,
      star.size * (0.62 + star.depth * 0.84) * projection.scale,
      color,
      alpha,
    );
  }
}

function drawGoldStars(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const deepGold: Rgb = [232, 183, 82];
  const warmGold: Rgb = [255, 218, 132];
  const warmWhite: Rgb = [255, 246, 218];
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const star of scene.goldStars) {
    const baseX = star.x * scene.width
      + Math.sin(motionTime * 0.00016 + star.phase) * star.drift;
    const baseY = star.y * scene.height
      + Math.cos(motionTime * 0.00012 + star.phase) * star.drift * 0.65;
    projectAtParallaxDepth(
      parallax,
      baseX,
      baseY,
      star.depth * PARALLAX_DEPTH.goldStars,
      star.depth,
      DEPTH_FIELD_STAR_STRENGTH.gold,
      projection,
    );
    const sparkle = reducedMotion
      ? 0.82
      : 0.72 + Math.sin(time * 0.00155 + star.phase) * 0.2;
    const alpha = renderTheme.goldStarAlpha
      * (0.52 + star.depth * 0.48)
      * sparkle
      * projection.alphaScale;
    const size = star.size * (0.88 + sparkle * 0.16) * projection.scale;
    const color = mixRgb(deepGold, warmGold, star.depth);

    if (star.depth > 0.76 && sparkle > 0.82) {
      const arm = size * (1.45 + sparkle * 0.55);
      const armWidth = Math.max(0.24, size * 0.2);
      context.fillStyle = rgba(color, alpha * 0.26);
      context.fillRect(
        projection.x - arm,
        projection.y - armWidth * 0.5,
        arm * 2,
        armWidth,
      );
      context.fillRect(
        projection.x - armWidth * 0.5,
        projection.y - arm,
        armWidth,
        arm * 2,
      );
    }

    const coreSize = Math.max(0.48, size * 0.64);
    context.fillStyle = rgba(color, alpha * 0.42);
    context.beginPath();
    context.arc(projection.x, projection.y, size * 1.38, 0, TAU);
    context.fill();
    context.fillStyle = rgba(warmWhite, alpha * (0.74 + star.depth * 0.26));
    context.fillRect(
      projection.x - coreSize * 0.5,
      projection.y - coreSize * 0.5,
      coreSize,
      coreSize,
    );
  }
}

function traceProjectedOrbit(
  context: CanvasRenderingContext2D,
  scene: Scene,
  parallax: ParallaxFrame,
  orbit: OrbitGeometry,
  laneScale: number,
  layer: DepthFieldLayer,
) {
  if (Math.abs(parallax.positionX) + Math.abs(parallax.positionY) < 0.001) {
    context.beginPath();
    context.ellipse(
      orbit.centerX + getParallaxOffsetX(parallax, layer.translationDepth),
      orbit.centerY + getParallaxOffsetY(parallax, layer.translationDepth),
      orbit.radiusX * laneScale,
      orbit.radiusY * laneScale,
      orbit.tilt,
      0,
      TAU,
    );
    return;
  }

  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const segmentCount = scene.compact ? 56 : 80;
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  context.beginPath();
  for (let segment = 0; segment <= segmentCount; segment += 1) {
    const angle = segment / segmentCount * TAU;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      layer.translationDepth,
      layer.perspectiveDepth,
      layer.perspectiveStrength,
      projection,
    );
    if (segment === 0) context.moveTo(projection.x, projection.y);
    else context.lineTo(projection.x, projection.y);
  }
  context.closePath();
}

function drawRingTrails(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const { orbit } = scene;
  const motionTime = reducedMotion ? 0 : time;
  context.save();

  for (let lane = 0; lane < 4; lane += 1) {
    const laneScale = 0.91 + lane * 0.052;
    const trailColor = mixRgb(activeColor, CLOUD_ACCENT, lane * 0.16);
    traceProjectedOrbit(
      context,
      scene,
      parallax,
      orbit,
      laneScale,
      DEPTH_FIELD_LAYERS.mainRing,
    );
    context.lineWidth = 0.65 + lane * 0.28;
    context.strokeStyle = rgba(
      trailColor,
      renderTheme.ringTrails.baseAlpha - lane * renderTheme.ringTrails.laneFalloff,
    );
    context.setLineDash([]);
    context.stroke();

    context.lineWidth = 1.05 + lane * 0.24;
    context.strokeStyle = rgba(trailColor, renderTheme.ringTrails.dashAlpha);
    context.setLineDash([
      orbit.radiusX * (0.17 + lane * 0.015),
      orbit.radiusX * 0.055,
      orbit.radiusX * 0.045,
      orbit.radiusX * 0.08,
    ]);
    context.lineDashOffset = -motionTime * (0.014 + lane * 0.002);
    context.stroke();
  }

  context.setLineDash([]);
  context.restore();
}

function drawSecondaryRingSystem(
  context: CanvasRenderingContext2D,
  scene: Scene,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  baseAlpha: number,
  dashAlpha: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  depthLayer: DepthFieldLayer,
) {
  const motionTime = reducedMotion ? 0 : time;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);
  const centerLane = (ring.lanes - 1) * 0.5;

  context.save();
  context.lineCap = 'round';

  for (let lane = 0; lane < ring.lanes; lane += 1) {
    const laneOffset = lane - centerLane;
    const laneScale = 1 + laneOffset * ring.laneSpacing;
    const laneAlpha = 1 - Math.abs(laneOffset) * 0.11;
    traceProjectedOrbit(context, scene, parallax, ring, laneScale, depthLayer);

    context.setLineDash([]);
    context.lineWidth = 0.55 + lane * 0.16;
    context.strokeStyle = rgba(ringColor, baseAlpha * laneAlpha);
    context.stroke();

    context.setLineDash([
      ring.radiusX * 0.42,
      ring.radiusX * 0.17,
      ring.radiusX * 0.07,
      ring.radiusX * 0.26,
    ]);
    context.lineDashOffset = -motionTime * ring.dashSpeed + lane * ring.radiusX * 0.13;
    context.lineWidth = 0.9 + lane * 0.12;
    context.strokeStyle = rgba(ringColor, dashAlpha * laneAlpha);
    context.stroke();
  }

  context.setLineDash([]);
  const glintAngle = ring.glintAngle + motionTime * ring.glintSpeed;
  const localGlintX = Math.cos(glintAngle) * ring.radiusX;
  const localGlintY = Math.sin(glintAngle) * ring.radiusY;
  const cosTilt = Math.cos(ring.tilt);
  const sinTilt = Math.sin(ring.tilt);
  const glintProjection: DepthFieldProjection = {
    x: 0,
    y: 0,
    scale: 1,
    alphaScale: 1,
  };
  projectAtParallaxDepth(
    parallax,
    ring.centerX + localGlintX * cosTilt - localGlintY * sinTilt,
    ring.centerY + localGlintX * sinTilt + localGlintY * cosTilt,
    depthLayer.translationDepth,
    depthLayer.perspectiveDepth,
    depthLayer.perspectiveStrength,
    glintProjection,
  );
  const glintPulse = reducedMotion ? 0.72 : 0.64 + Math.sin(time * 0.0011 + ring.glintAngle) * 0.24;
  drawStar(
    context,
    glintProjection.x,
    glintProjection.y,
    1.25 * glintProjection.scale,
    ringColor,
    dashAlpha * 3.2 * glintPulse * glintProjection.alphaScale,
  );
  context.restore();
}

function drawSecondaryRingParticles(
  context: CanvasRenderingContext2D,
  scene: Scene,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  opacityScale: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  depthLayer: DepthFieldLayer,
) {
  const motionTime = reducedMotion ? 0 : time;
  const cosTilt = Math.cos(ring.tilt);
  const sinTilt = Math.sin(ring.tilt);
  const centerLane = (ring.lanes - 1) * 0.5;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const particle of ring.particles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 1 + (particle.lane - centerLane) * ring.laneSpacing;
    const localX = Math.cos(angle) * ring.radiusX * laneScale;
    const localY = Math.sin(angle) * ring.radiusY * laneScale;
    const x = ring.centerX + localX * cosTilt - localY * sinTilt;
    const y = ring.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      depthLayer.translationDepth,
      depthLayer.perspectiveDepth,
      depthLayer.perspectiveStrength,
      projection,
    );
    const depth = (Math.sin(angle) + 1) * 0.5;
    const twinkle = reducedMotion
      ? 0.76
      : 0.64 + Math.sin(time * 0.00145 + particle.phase) * 0.28;
    const animatedColor = getAnimatedStarColor(
      particle.colorSeed,
      particle.colorOffset,
      motionTime,
      activeColor,
      renderTheme.neutralStarColor,
      0.76,
    );
    const color = mixRgb(animatedColor, ringColor, 0.24);
    const alpha = renderTheme.secondaryRings.particleAlpha
      * opacityScale
      * (0.52 + depth * 0.48)
      * twinkle
      * projection.alphaScale;
    const size = particle.size * (0.78 + depth * 0.58) * projection.scale;
    drawStar(
      context,
      snapToPixel(projection.x, scene.pixelRatio),
      snapToPixel(projection.y, scene.pixelRatio),
      size,
      color,
      alpha,
    );
  }
}

function drawMainRingAurora(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  updateAuroraTint(
    scene.aurora,
    mixRgb(activeColor, renderTheme.neutralStarColor, 0.08),
  );
  const motionTime = reducedMotion ? 0 : time;
  const { orbit } = scene;
  const auroraWidth = orbit.radiusX * (scene.compact ? 1.16 : 1.08);
  const auroraHeight = Math.min(
    scene.height * (scene.compact ? 0.26 : 0.38),
    scene.compact ? 220 : 340,
  );
  const localX = -orbit.radiusX * (scene.compact ? 0.32 : 0.12);
  const localY = -orbit.radiusY * 0.92 - auroraHeight * 0.54;
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000044 + 0.8) * 10;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000036 + 1.7) * 5;
  const opacityPulse = reducedMotion
    ? 0.86
    : 0.8 + Math.sin(motionTime * 0.00018 + 0.4) * 0.14;
  const stretch = reducedMotion ? 1 : 1 + Math.sin(motionTime * 0.000027 + 2.1) * 0.018;
  const shear = reducedMotion ? 0 : Math.sin(motionTime * 0.000052 + 1.2) * 0.025;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(orbit.centerX, orbit.centerY);
  context.rotate(orbit.tilt);
  context.globalAlpha = renderTheme.aurora.purpleAlpha * opacityPulse;
  context.drawImage(
    scene.aurora.purple,
    localX - driftX * 0.45,
    localY + driftY * 0.4,
    auroraWidth * 1.025,
    auroraHeight * 1.035,
  );

  context.save();
  context.translate(localX + driftX, localY + driftY);
  context.transform(stretch, 0, shear, 1, 0, 0);
  context.globalAlpha = renderTheme.aurora.activeAlpha * opacityPulse;
  context.drawImage(scene.aurora.active, 0, 0, auroraWidth, auroraHeight);
  context.restore();
  context.restore();
}

function drawAtmosphericFogLayer(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  layer: AtmosphericFogLayer,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const fogHeight = scene.height * layer.heightScale;
  const fogWidth = Math.max(scene.width * layer.widthScale, fogHeight * 2.1);
  const motionRate = 0.000016 + layer.depth * 0.000015;
  const driftX = reducedMotion
    ? 0
    : Math.sin(motionTime * motionRate + layer.phase) * layer.driftX;
  const driftY = reducedMotion
    ? 0
    : Math.cos(motionTime * motionRate * 0.73 + layer.phase * 1.4) * layer.driftY;
  const opacityBreath = reducedMotion
    ? 0.94
    : 0.92 + Math.sin(motionTime * 0.000052 + layer.phase) * 0.07;
  const colorRoll = reducedMotion
    ? 0.5
    : 0.5 + Math.sin(motionTime * 0.000037 + layer.phase * 1.7) * 0.5;
  const scalePulse = reducedMotion
    ? 1
    : 1 + Math.sin(motionTime * 0.000024 + layer.phase * 0.8) * 0.012;
  const wispRoll = reducedMotion
    ? 0
    : Math.sin(motionTime * 0.000019 + layer.phase) * 0.018;
  const centerX = scene.width * layer.centerX + driftX;
  const centerY = scene.height * layer.centerY + driftY;
  const mirror = layer.phase > 3 ? -1 : 1;
  const perspectiveStrength = 0.24 + layer.depth * 0.42;
  const surface = getDepthFieldSurface(
    parallax,
    centerX,
    centerY,
    {
      translationDepth: layer.depth,
      perspectiveDepth: 1,
      perspectiveStrength,
    },
  );
  const layerAlpha = renderTheme.atmosphericFog[layer.stage] * surface.alphaScale;

  drawOnDepthFieldSurface(context, surface, () => {
    context.save();
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.translate(centerX, centerY);
    context.rotate(layer.rotation + wispRoll);
    context.scale(scalePulse, scalePulse);

    context.save();
    context.scale(mirror, 1);
    context.globalAlpha =
      layerAlpha * (1 - layer.activeShare) * opacityBreath * (0.9 + colorRoll * 0.16);
    context.drawImage(
      scene.clouds.purple,
      -fogWidth * 0.53,
      -fogHeight * 0.5,
      fogWidth * 1.06,
      fogHeight,
    );
    context.restore();

    context.save();
    context.translate(
      Math.cos(motionTime * motionRate * 0.61 + layer.phase) * fogWidth * 0.022,
      Math.sin(motionTime * motionRate * 0.54 + layer.phase) * fogHeight * 0.035,
    );
    context.rotate(-wispRoll * 1.6);
    context.scale(-mirror, 1);
    context.globalAlpha =
      layerAlpha * layer.activeShare * opacityBreath * (1.06 - colorRoll * 0.16);
    context.drawImage(
      scene.clouds.active,
      -fogWidth * 0.48,
      -fogHeight * 0.46,
      fogWidth * 0.96,
      fogHeight * 0.92,
    );
    context.restore();
    context.restore();
  });
}

function drawAtmosphericFogStage(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  stage: AtmosphericFogStage,
  parallax: ParallaxFrame,
) {
  for (const layer of ATMOSPHERIC_FOG_LAYERS) {
    if (layer.stage !== stage || (scene.compact && !layer.compactVisible)) continue;
    drawAtmosphericFogLayer(
      context,
      scene,
      time,
      renderTheme,
      reducedMotion,
      layer,
      parallax,
    );
  }
}

function drawCloudCore(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const nebulaAccentColor = getNebulaAccentColor(activeColor);
  const motionTime = reducedMotion ? 0 : time;
  const centerX = scene.compact ? scene.width * 0.5 : scene.width * 0.46;
  const centerY = scene.compact ? scene.height * 0.61 : scene.height * 0.66;
  const cloudWidth = Math.min(scene.width * (scene.compact ? 1.15 : 0.82), 1120);
  const cloudHeight = cloudWidth * 0.5;
  const driftX = Math.sin(motionTime * 0.000052) * (scene.compact ? 8 : 16);
  const driftY = Math.cos(motionTime * 0.000041) * 9;
  const scalePulse = 1 + Math.sin(motionTime * 0.000036) * 0.025;
  const cloudX = centerX + driftX;
  const cloudY = centerY + driftY;
  const surface = getDepthFieldSurface(
    parallax,
    cloudX,
    cloudY,
    DEPTH_FIELD_LAYERS.cloudCore,
  );

  drawOnDepthFieldSurface(context, surface, () => {
    context.save();
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.translate(cloudX, cloudY);
    context.rotate(-0.055 + Math.sin(motionTime * 0.000021) * 0.018);
    context.scale(scalePulse, scalePulse);
    context.globalAlpha = renderTheme.clouds.accentAlpha * surface.alphaScale;
    context.drawImage(
      scene.clouds.accent,
      -cloudWidth * 0.58,
      -cloudHeight * 0.52,
      cloudWidth * 1.16,
      cloudHeight * 1.04,
    );
    context.globalAlpha = renderTheme.clouds.activeAlpha * surface.alphaScale;
    context.drawImage(
      scene.clouds.active,
      -cloudWidth * 0.5,
      -cloudHeight * 0.5,
      cloudWidth,
      cloudHeight,
    );
    context.restore();

    const glowRadius = Math.max(cloudWidth * 0.42, 160);
    const glow = context.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, glowRadius);
    glow.addColorStop(
      0,
      rgba(
        mixRgb(activeColor, nebulaAccentColor, 0.44),
        renderTheme.clouds.glowCoreAlpha * surface.alphaScale,
      ),
    );
    glow.addColorStop(
      0.46,
      rgba(activeColor, renderTheme.clouds.glowMidAlpha * surface.alphaScale),
    );
    glow.addColorStop(1, rgba(activeColor, 0));
    context.fillStyle = glow;
    context.fillRect(
      cloudX - glowRadius,
      cloudY - glowRadius,
      glowRadius * 2,
      glowRadius * 2,
    );
  });
}

function drawVortex(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const innerRing = scene.secondaryRings.inner;
  const accentColor = getNebulaAccentColor(activeColor);
  updateVortexTints(
    scene.vortex.sprites,
    mixRgb(activeColor, accentColor, 0.12),
    accentColor,
  );
  const motionTime = reducedMotion ? 0 : time;
  const vortexWidth = innerRing.radiusX * (scene.compact ? 1.3 : 1.45);
  const vortexHeight = innerRing.radiusY * (scene.compact ? 1.2 : 1.35);
  const activeRotation = reducedMotion ? 0.18 : 0.18 + motionTime * 0.000050;
  const accentRotation = reducedMotion ? -0.24 : -0.24 + motionTime * 0.000023;
  const opacityPulse = reducedMotion
    ? 0.92
    : 0.86 + Math.sin(motionTime * 0.00015 + 0.6) * 0.1;
  const scalePulse = reducedMotion
    ? 1
    : 1 + Math.sin(motionTime * 0.000035 + 1.8) * 0.018;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(innerRing.centerX, innerRing.centerY);
  context.rotate(innerRing.tilt);
  context.beginPath();
  context.ellipse(0, 0, vortexWidth * 0.52, vortexHeight * 0.52, 0, 0, TAU);
  context.clip();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  const coreRadius = vortexWidth * 0.31;
  const coreGlow = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
  coreGlow.addColorStop(
    0,
    rgba(mixRgb(activeColor, accentColor, 0.44), renderTheme.vortex.coreAlpha),
  );
  coreGlow.addColorStop(0.46, rgba(accentColor, renderTheme.vortex.coreAlpha * 0.55));
  coreGlow.addColorStop(1, rgba(accentColor, 0));
  context.fillStyle = coreGlow;
  context.fillRect(-coreRadius, -coreRadius, coreRadius * 2, coreRadius * 2);
  context.restore();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  context.rotate(accentRotation);
  context.scale(scalePulse * 1.035, scalePulse * 1.035);
  context.globalAlpha = renderTheme.vortex.accentAlpha * opacityPulse;
  context.drawImage(
    scene.vortex.sprites.accent,
    -vortexWidth * 0.53,
    -vortexWidth * 0.53,
    vortexWidth * 1.06,
    vortexWidth * 1.06,
  );
  context.restore();

  context.save();
  context.scale(1, vortexHeight / vortexWidth);
  context.rotate(activeRotation);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.vortex.activeAlpha * opacityPulse;
  context.drawImage(
    scene.vortex.sprites.active,
    -vortexWidth * 0.5,
    -vortexWidth * 0.5,
    vortexWidth,
    vortexWidth,
  );
  context.restore();
  context.restore();

  const cosTilt = Math.cos(innerRing.tilt);
  const sinTilt = Math.sin(innerRing.tilt);
  for (const star of scene.vortex.stars) {
    const angle = star.angle + motionTime * star.speed;
    const localX = Math.cos(angle) * vortexWidth * 0.5 * star.radius;
    const localY = Math.sin(angle) * vortexHeight * 0.5 * star.radius;
    const x = snapToPixel(
      innerRing.centerX + localX * cosTilt - localY * sinTilt,
      scene.pixelRatio,
    );
    const y = snapToPixel(
      innerRing.centerY + localX * sinTilt + localY * cosTilt,
      scene.pixelRatio,
    );
    const twinkle = reducedMotion
      ? 0.78
      : 0.68 + Math.sin(time * 0.0015 + star.phase) * 0.26;
    const depth = 0.7 + star.radius * 0.3;
    drawStar(
      context,
      x,
      y,
      star.size * depth,
      VORTEX_STAR_WHITE,
      renderTheme.vortex.starAlpha * twinkle * depth,
    );
  }
}

function drawForegroundClouds(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const cloudWidth = Math.min(
    scene.width * (scene.compact ? 1.35 : 0.76),
    scene.compact ? 660 : 1050,
  );
  const cloudHeight = cloudWidth * 0.5;
  const centerX = scene.width * (scene.compact ? 0.08 : 0.06);
  const centerY = scene.height * (scene.compact ? 0.92 : 0.94);
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000038 + 1.4) * 13;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000031 + 0.7) * 7;
  const scalePulse = reducedMotion ? 1 : 1 + Math.sin(motionTime * 0.000028 + 2.2) * 0.015;
  const opacityPulse = reducedMotion
    ? 0.92
    : 0.88 + Math.sin(motionTime * 0.00019 + 0.9) * 0.09;
  const cloudX = centerX + driftX;
  const cloudY = centerY + driftY;
  const surface = getDepthFieldSurface(
    parallax,
    cloudX,
    cloudY,
    DEPTH_FIELD_LAYERS.foregroundClouds,
  );

  drawOnDepthFieldSurface(context, surface, () => {
    context.save();
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.translate(cloudX, cloudY);
    context.rotate(0.045 + Math.sin(motionTime * 0.000017) * 0.012);
    context.scale(scalePulse, scalePulse);
    context.globalAlpha = renderTheme.foregroundClouds.purpleAlpha
      * opacityPulse
      * surface.alphaScale;
    context.drawImage(
      scene.clouds.purple,
      -cloudWidth * 0.62,
      -cloudHeight * 0.54,
      cloudWidth * 1.18,
      cloudHeight * 1.08,
    );
    context.globalAlpha = renderTheme.foregroundClouds.activeAlpha
      * opacityPulse
      * surface.alphaScale;
    context.drawImage(
      scene.clouds.active,
      -cloudWidth * 0.52,
      -cloudHeight * 0.5,
      cloudWidth * 0.92,
      cloudHeight,
    );
    context.restore();

    const glowColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, 0.76);
    const glowRadius = Math.max(cloudWidth * 0.4, 150);
    context.save();
    context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
    context.translate(cloudX - cloudWidth * 0.08, cloudY);
    context.scale(1.55, 0.72);
    const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    glow.addColorStop(
      0,
      rgba(
        glowColor,
        renderTheme.foregroundClouds.glowCoreAlpha
          * opacityPulse
          * surface.alphaScale,
      ),
    );
    glow.addColorStop(
      0.5,
      rgba(
        FOREGROUND_CLOUD_PURPLE,
        renderTheme.foregroundClouds.glowMidAlpha
          * opacityPulse
          * surface.alphaScale,
      ),
    );
    glow.addColorStop(1, rgba(FOREGROUND_CLOUD_PURPLE, 0));
    context.fillStyle = glow;
    context.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
    context.restore();
  });
}

function drawRingParticles(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const { orbit } = scene;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const motionTime = reducedMotion ? 0 : time;
  const projection: DepthFieldProjection = { x: 0, y: 0, scale: 1, alphaScale: 1 };

  for (const particle of scene.ringParticles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 0.91 + particle.lane * 0.052;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
    projectAtParallaxDepth(
      parallax,
      x,
      y,
      DEPTH_FIELD_LAYERS.mainRing.translationDepth,
      DEPTH_FIELD_LAYERS.mainRing.perspectiveDepth,
      DEPTH_FIELD_LAYERS.mainRing.perspectiveStrength,
      projection,
    );
    const depth = (Math.sin(angle) + 1) * 0.5;
    const twinkle = reducedMotion ? 0.78 : 0.68 + Math.sin(time * 0.0016 + particle.phase) * 0.3;
    const color = getAnimatedStarColor(
      particle.colorSeed,
      particle.colorOffset,
      motionTime,
      activeColor,
      renderTheme.neutralStarColor,
      0.82,
    );
    const alpha = renderTheme.ringParticleAlpha
      * (0.5 + depth * 0.5)
      * twinkle
      * projection.alphaScale;
    const size = particle.size * (0.84 + depth * 0.76) * projection.scale;
    drawStar(context, projection.x, projection.y, size, color, alpha);
  }
}

function drawPlanetRing(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: Rgb,
  renderTheme: CosmicRenderTheme,
  phase: number,
  viewPose: ParallaxPose,
  foreground: boolean,
) {
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);
  context.save();
  context.translate(x, y);
  context.rotate(0.32 + phase * 0.025 + yaw * 0.8);
  applyParallaxPlaneTilt(context, viewPose, 0.75);
  context.scale(1, clamp(0.34 + pitch * 0.9, 0.2, 0.5));
  for (let ring = 0; ring < 3; ring += 1) {
    const ringScale = 0.9 + ring * 0.1;
    const baseAlpha = foreground
      ? renderTheme.planetRing.foregroundAlpha
      : renderTheme.planetRing.backgroundAlpha;
    context.strokeStyle = rgba(color, baseAlpha * (1 - ring * 0.2));
    context.lineWidth = Math.max(0.75, radius * (0.035 + ring * 0.014));
    context.beginPath();
    context.ellipse(
      0,
      0,
      radius * 1.82 * ringScale,
      radius * 1.08 * ringScale,
      0,
      0,
      foreground ? Math.PI : TAU,
    );
    context.stroke();
  }
  context.restore();
}

function drawPlanetSurface(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  kind: PlanetKind,
  featureColor: Rgb,
  highlightColor: Rgb,
  shadowColor: Rgb,
  renderTheme: CosmicRenderTheme,
  phase: number,
  viewPose: ParallaxPose,
) {
  const { planetSurface } = renderTheme;
  const featureAlpha = planetSurface.featureAlpha;
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.clip();
  context.rotate(-0.14 + phase * 0.035 + yaw * 0.24);
  context.transform(1, pitch * 0.18, yaw * 0.12, 1, 0, 0);
  context.translate(yaw * radius * 0.72, pitch * radius * 0.62);

  if (kind === 'violet') {
    for (let band = -4; band <= 4; band += 1) {
      const offsetY = band * radius * 0.17;
      context.fillStyle = rgba(
        band % 2 === 0 ? featureColor : highlightColor,
        featureAlpha * (band === 0 ? 1.1 : 0.62),
      );
      context.beginPath();
      context.ellipse(0, offsetY, radius * 1.04, radius * (band === 0 ? 0.065 : 0.032), 0, 0, TAU);
      context.fill();
    }
    context.fillStyle = rgba(highlightColor, planetSurface.violetStormAlpha);
    context.beginPath();
    context.ellipse(radius * 0.38, radius * 0.12, radius * 0.2, radius * 0.09, -0.08, 0, TAU);
    context.fill();
  } else if (kind === 'amber') {
    for (let band = -2; band <= 2; band += 1) {
      const offsetY = band * radius * 0.3;
      context.fillStyle = rgba(
        band === 0 ? highlightColor : featureColor,
        featureAlpha * (band === 0 ? 0.95 : 0.58),
      );
      context.beginPath();
      context.ellipse(0, offsetY, radius * 1.05, radius * (band === 0 ? 0.13 : 0.08), 0, 0, TAU);
      context.fill();
    }
  } else if (kind === 'rocky') {
    context.fillStyle = rgba(shadowColor, planetSurface.rockyShadowAlpha);
    context.beginPath();
    context.ellipse(radius * 0.42, 0, radius * 0.7, radius * 1.08, 0.08, 0, TAU);
    context.fill();
    for (let crater = 0; crater < 9; crater += 1) {
      const craterX = (seededRandom(phase * 17 + crater * 3.7) - 0.5) * radius * 1.2;
      const craterY = (seededRandom(phase * 23 + crater * 5.1) - 0.5) * radius * 1.15;
      const craterRadius = radius * (0.08 + seededRandom(phase * 29 + crater * 7.3) * 0.11);
      context.fillStyle = rgba(shadowColor, planetSurface.rockyCraterAlpha);
      context.beginPath();
      context.arc(craterX, craterY, craterRadius, 0, TAU);
      context.fill();
      context.strokeStyle = rgba(highlightColor, planetSurface.rockyCraterRimAlpha);
      context.lineWidth = Math.max(0.45, radius * 0.016);
      context.stroke();
    }
  } else if (kind === 'ocean') {
    context.fillStyle = rgba(featureColor, planetSurface.oceanFeatureAlpha);
    context.beginPath();
    context.ellipse(-radius * 0.28, -radius * 0.18, radius * 0.34, radius * 0.21, 0.42, 0, TAU);
    context.ellipse(radius * 0.3, radius * 0.22, radius * 0.28, radius * 0.18, -0.3, 0, TAU);
    context.ellipse(radius * 0.18, -radius * 0.5, radius * 0.16, radius * 0.1, 0.16, 0, TAU);
    context.fill();
    context.strokeStyle = rgba(highlightColor, planetSurface.oceanCloudAlpha);
    context.lineWidth = Math.max(0.65, radius * 0.035);
    context.beginPath();
    context.arc(-radius * 0.08, -radius * 0.02, radius * 0.7, 0.18, Math.PI * 0.88);
    context.stroke();
  } else {
    context.fillStyle = rgba(highlightColor, planetSurface.iceFacetAlpha);
    for (let facet = 0; facet < 5; facet += 1) {
      const angle = (facet / 5) * TAU;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      context.lineTo(
        Math.cos(angle + TAU / 5) * radius,
        Math.sin(angle + TAU / 5) * radius,
      );
      context.closePath();
      if (facet % 2 === 0) context.fill();
    }
    context.strokeStyle = rgba(featureColor, planetSurface.iceFissureAlpha);
    context.lineWidth = Math.max(0.65, radius * 0.038);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-radius * 0.18, -radius * 0.82);
    context.lineTo(radius * 0.03, -radius * 0.28);
    context.lineTo(-radius * 0.13, radius * 0.05);
    context.lineTo(radius * 0.24, radius * 0.72);
    context.moveTo(radius * 0.03, -radius * 0.28);
    context.lineTo(radius * 0.48, -radius * 0.08);
    context.moveTo(-radius * 0.13, radius * 0.05);
    context.lineTo(-radius * 0.5, radius * 0.38);
    context.stroke();
  }

  context.restore();
}

function drawPlanet(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  ringed: boolean,
  phase: number,
  kind: PlanetKind,
  viewPose: ParallaxPose,
) {
  const palette = PLANET_PALETTES[kind];
  const highlightColor = mixRgb(palette.highlight, activeColor, 0.06);
  const midColor = mixRgb(palette.mid, activeColor, 0.05);
  const shadowColor = mixRgb(palette.shadow, activeColor, 0.025);
  const featureColor = mixRgb(palette.feature, activeColor, 0.08);
  const rimColor = mixRgb(featureColor, activeColor, 0.28);
  const atmosphereAlpha = kind === 'rocky'
    ? renderTheme.planetAtmosphere.rockyAlpha
    : kind === 'ice'
      ? renderTheme.planetAtmosphere.iceAlpha
      : renderTheme.planetAtmosphere.standardAlpha;
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);

  if (ringed) {
    drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, viewPose, false);
  }

  const gradient = context.createRadialGradient(
    x - radius * 0.32 + yaw * radius * 0.78,
    y - radius * 0.36 + pitch * radius * 0.7,
    radius * 0.06,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, rgba(highlightColor, renderTheme.planetGradient[0]));
  gradient.addColorStop(0.3, rgba(midColor, renderTheme.planetGradient[1]));
  gradient.addColorStop(0.8, rgba(shadowColor, renderTheme.planetGradient[2]));
  gradient.addColorStop(1, rgba([2, 4, 18], renderTheme.planetGradient[3]));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();

  drawPlanetSurface(
    context,
    x,
    y,
    radius,
    kind,
    featureColor,
    highlightColor,
    shadowColor,
    renderTheme,
    phase,
    viewPose,
  );

  context.strokeStyle = rgba(rimColor, atmosphereAlpha);
  context.lineWidth = Math.max(0.75, radius * 0.025);
  context.beginPath();
  context.arc(x, y, radius + context.lineWidth * 0.5, 0, TAU);
  context.stroke();

  if (kind === 'ice') {
    context.strokeStyle = rgba(featureColor, renderTheme.planetAtmosphere.iceOuterAlpha);
    context.lineWidth = Math.max(0.6, radius * 0.022);
    context.beginPath();
    context.arc(x, y, radius * 1.16, 0, TAU);
    context.stroke();
  }

  const tiltMagnitude = Math.hypot(viewPose.pitch, viewPose.yaw);
  if (tiltMagnitude > 0.002) {
    const facingAngle = Math.atan2(pitch, yaw);
    const directionalAlpha = atmosphereAlpha * clamp(tiltMagnitude / 0.2, 0, 0.62);
    context.strokeStyle = rgba(highlightColor, directionalAlpha);
    context.lineWidth = Math.max(0.85, radius * 0.052);
    context.lineCap = 'round';
    context.beginPath();
    context.arc(
      x,
      y,
      radius + context.lineWidth * 0.42,
      facingAngle - 1.02,
      facingAngle + 1.02,
    );
    context.stroke();
  }

  if (ringed) {
    drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, viewPose, true);
  }
}

function getPlanetRenderStates(
  scene: Scene,
  time: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const minDimension = Math.min(scene.width, scene.height);
  const motionTime = reducedMotion ? 0 : time;
  const { orbit } = scene;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const states = scene.planets.map((planet): PlanetRenderState => {
    const surfacePhase = planet.phase + motionTime * planet.spinSpeed;
    let x: number;
    let y: number;
    let radius = minDimension * planet.size;
    let orientationDepth: number | undefined;

    if (planet.motion === 'orbit') {
      const angle = planet.angle + motionTime * planet.speed * planet.direction;
      const laneScale = 0.5 + planet.lane * 0.33;
      const localX = Math.cos(angle) * orbit.radiusX * laneScale;
      const localY = Math.sin(angle) * orbit.radiusY * laneScale;
      x = orbit.centerX + localX * cosTilt - localY * sinTilt;
      y = orbit.centerY + localX * sinTilt + localY * cosTilt;
      const orbitDepth = (Math.sin(angle) + 1) * 0.5;
      radius *= 0.82 + orbitDepth * 0.28;
      orientationDepth = 0.32 + orbitDepth * 0.28;
    } else {
      const offscreenMargin = radius * 2.4;
      const travelWidth = scene.width + offscreenMargin * 2;
      const travelledX = planet.x * scene.width + motionTime * planet.velocityX + offscreenMargin;
      x = ((travelledX % travelWidth) + travelWidth) % travelWidth - offscreenMargin;
      y = planet.y * scene.height
        + Math.sin(planet.phase + motionTime * planet.waveSpeed) * planet.waveY;
    }

    const parallaxDepth = planet.kind === 'violet'
      ? PARALLAX_DEPTH.distant
      : PARALLAX_DEPTH.middle;
    const viewPose = getParallaxPose(
      parallax,
      parallaxDepth,
      PLANET_PARALLAX_TILT_SCALE,
      orientationDepth ?? parallaxDepth,
    );
    if (planet.motion === 'orbit') {
      const projection: DepthFieldProjection = {
        x,
        y,
        scale: 1,
        alphaScale: 1,
      };
      projectAtParallaxDepth(
        parallax,
        x,
        y,
        DEPTH_FIELD_LAYERS.mainRing.translationDepth,
        DEPTH_FIELD_LAYERS.mainRing.perspectiveDepth,
        DEPTH_FIELD_LAYERS.mainRing.perspectiveStrength,
        projection,
      );
      x = projection.x;
      y = projection.y;
      radius *= projection.scale;
    } else {
      x += viewPose.offsetX;
      y += viewPose.offsetY;
    }

    return { planet, x, y, radius, surfacePhase, viewPose };
  });

  const collisionPadding = minDimension * 0.016;
  for (let pass = 0; pass < 4; pass += 1) {
    for (let firstIndex = 0; firstIndex < states.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < states.length; secondIndex += 1) {
        const first = states[firstIndex];
        const second = states[secondIndex];
        let deltaX = second.x - first.x;
        let deltaY = second.y - first.y;
        let distance = Math.hypot(deltaX, deltaY);
        const firstClearance = first.radius * (first.planet.ringed ? 1.5 : 1.08);
        const secondClearance = second.radius * (second.planet.ringed ? 1.5 : 1.08);
        const minimumDistance = firstClearance + secondClearance + collisionPadding;
        if (distance >= minimumDistance) continue;

        if (distance < 0.001) {
          const fallbackAngle = seededRandom(firstIndex * 31 + secondIndex * 47 + 8.3) * TAU;
          deltaX = Math.cos(fallbackAngle);
          deltaY = Math.sin(fallbackAngle);
          distance = 1;
        }

        const correction = (minimumDistance - distance) * 0.52;
        const normalX = deltaX / distance;
        const normalY = deltaY / distance;
        first.x -= normalX * correction;
        first.y -= normalY * correction;
        second.x += normalX * correction;
        second.y += normalY * correction;
      }
    }
  }

  return states;
}

function drawPlanets(
  context: CanvasRenderingContext2D,
  states: readonly PlanetRenderState[],
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  layer: PlanetLayer,
) {
  for (const { planet, x, y, radius, surfacePhase, viewPose } of states) {
    const belongsToLayer = layer === 'distant-rogue'
      ? planet.motion === 'rogue' && planet.kind === 'violet'
      : layer === 'rogue'
        ? planet.motion === 'rogue' && planet.kind !== 'violet'
        : planet.motion === 'orbit';
    if (!belongsToLayer) continue;
    context.save();
    if (layer === 'distant-rogue') context.globalAlpha *= 0.72;

    if (planet.motion === 'rogue') {
      const direction = Math.sign(planet.velocityX) || 1;
      const trailEndX = x - direction * radius * 3.2;
      const trailColor = mixRgb(PLANET_PALETTES[planet.kind].feature, activeColor, 0.16);
      const trail = context.createLinearGradient(x, y, trailEndX, y);
      trail.addColorStop(0, rgba(trailColor, renderTheme.rogueTrailAlpha));
      trail.addColorStop(1, rgba(trailColor, 0));
      context.strokeStyle = trail;
      context.lineWidth = Math.max(1, radius * 0.1);
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(trailEndX, y);
      context.stroke();
    }

    drawPlanet(
      context,
      x,
      y,
      radius,
      activeColor,
      renderTheme,
      planet.ringed,
      surfacePhase,
      planet.kind,
      viewPose,
    );
    context.restore();
  }
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const renderTheme = isDark ? COSMIC_RENDER_THEMES.dark : COSMIC_RENDER_THEMES.light;
  const planetStates = getPlanetRenderStates(scene, time, reducedMotion, parallax);
  const mainRingSurface = getDepthFieldSurface(
    parallax,
    scene.orbit.centerX,
    scene.orbit.centerY,
    DEPTH_FIELD_LAYERS.mainRing,
  );
  updateSceneCloudTints(scene.clouds, activeColor);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  drawBackgroundWash(context, scene, activeColor, renderTheme);
  drawAtmosphericFogStage(
    context,
    scene,
    time,
    renderTheme,
    reducedMotion,
    'far',
    parallax,
  );
  drawPlanets(
    context,
    planetStates,
    activeColor,
    renderTheme,
    'distant-rogue',
  );
  drawAtParallaxDepth(context, parallax, PARALLAX_DEPTH.distant, (viewPose) => {
    drawQuasar(context, scene, time, renderTheme, reducedMotion, viewPose);
  });
  drawSecondaryRingSystem(
    context,
    scene,
    scene.secondaryRings.distant,
    time,
    activeColor,
    renderTheme.secondaryRings.distantAlpha,
    renderTheme.secondaryRings.dashAlpha * 0.72,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.distantRing,
  );
  drawSecondaryRingParticles(
    context,
    scene,
    scene.secondaryRings.distant,
    time,
    activeColor,
    renderTheme,
    0.72,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.distantRing,
  );
  drawStarClusterSprites(
    context,
    scene,
    time,
    renderTheme,
    isDark,
    reducedMotion,
    'far',
    parallax,
  );
  drawFieldStars(context, scene, time, renderTheme, reducedMotion, parallax);
  drawGoldStars(context, scene, time, renderTheme, reducedMotion, parallax);
  drawAtmosphericFogStage(
    context,
    scene,
    time,
    renderTheme,
    reducedMotion,
    'middle',
    parallax,
  );
  drawPlanets(
    context,
    planetStates,
    activeColor,
    renderTheme,
    'rogue',
  );
  drawOnDepthFieldSurface(context, mainRingSurface, () => {
    drawMainRingAurora(context, scene, time, activeColor, renderTheme, reducedMotion);
  });
  drawRingTrails(context, scene, time, activeColor, renderTheme, reducedMotion, parallax);
  drawSecondaryRingSystem(
    context,
    scene,
    scene.secondaryRings.inner,
    time,
    activeColor,
    renderTheme.secondaryRings.innerAlpha,
    renderTheme.secondaryRings.dashAlpha,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.mainRing,
  );
  drawSecondaryRingParticles(
    context,
    scene,
    scene.secondaryRings.inner,
    time,
    activeColor,
    renderTheme,
    0.92,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.mainRing,
  );
  drawStarClusterSprites(
    context,
    scene,
    time,
    renderTheme,
    isDark,
    reducedMotion,
    'ring',
    parallax,
  );
  drawCloudCore(context, scene, time, activeColor, renderTheme, reducedMotion, parallax);
  drawOnDepthFieldSurface(context, mainRingSurface, () => {
    drawVortex(context, scene, time, activeColor, renderTheme, reducedMotion);
  });
  drawStarClusterHighlights(
    context,
    scene,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    'far',
    parallax,
  );
  drawStarClusterHighlights(
    context,
    scene,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    'ring',
    parallax,
  );
  drawRingParticles(
    context,
    scene,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawAtmosphericFogStage(
    context,
    scene,
    time,
    renderTheme,
    reducedMotion,
    'near',
    parallax,
  );
  drawForegroundClouds(
    context,
    scene,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawPlanets(
    context,
    planetStates,
    activeColor,
    renderTheme,
    'orbit',
  );
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
}

export default function AnimatedBackground({ activeColor }: { activeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetColorRef = useRef<Rgb>([...DEFAULT_ACTIVE_COLOR]);
  const redrawStaticSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    targetColorRef.current = resolveCssColor(canvas, activeColor);
    redrawStaticSceneRef.current?.();
  }, [activeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const background = canvas?.parentElement;
    if (!canvas || !context || !background) return;
    const cloudSprites = createCloudSprites();
    const auroraSprites = createAuroraSprites();
    const quasarSprite = createQuasarSprite();
    const vortexSprites = createVortexSprites();
    if (!cloudSprites || !auroraSprites || !vortexSprites) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const parallaxPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const deviceOrientationConstructor = (
      window as typeof window & {
        DeviceOrientationEvent?: DeviceOrientationEventConstructor;
      }
    ).DeviceOrientationEvent;
    let scene: Scene | null = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastPaintTime = 0;
    let previousTime = performance.now();
    let sceneTime = 0;
    let isDark = document.documentElement.classList.contains('dark');
    let reducedMotion = motionPreference.matches;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;
    let styledParallaxX = Number.NaN;
    let styledParallaxY = Number.NaN;
    let deviceTiltListening = false;
    let deviceTiltBaselineX: number | null = null;
    let deviceTiltBaselineY: number | null = null;
    let tiltPermissionGestureArmed = false;
    let deviceOrientationPermission: DeviceOrientationPermissionState =
      !deviceOrientationConstructor
        ? 'unavailable'
        : typeof deviceOrientationConstructor.requestPermission === 'function'
          ? 'prompt'
          : 'granted';
    const currentColor: Rgb = [...targetColorRef.current];

    const resetDeviceTiltCalibration = () => {
      deviceTiltBaselineX = null;
      deviceTiltBaselineY = null;
      if (!parallaxPointer.matches) {
        targetParallaxX = 0;
        targetParallaxY = 0;
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (
        reducedMotion
        || document.hidden
        || parallaxPointer.matches
        || !coarsePointer.matches
        || event.beta === null
        || event.gamma === null
      ) {
        return;
      }

      const tilt = getScreenRelativeDeviceTilt(event.beta, event.gamma);
      if (deviceTiltBaselineX === null || deviceTiltBaselineY === null) {
        deviceTiltBaselineX = tilt.x;
        deviceTiltBaselineY = tilt.y;
        targetParallaxX = 0;
        targetParallaxY = 0;
        return;
      }

      targetParallaxX = normalizeDeviceTilt(
        getShortestAngleDelta(tilt.x, deviceTiltBaselineX),
        DEVICE_TILT_RANGE_X,
      );
      targetParallaxY = normalizeDeviceTilt(
        getShortestAngleDelta(tilt.y, deviceTiltBaselineY),
        DEVICE_TILT_RANGE_Y,
      );
    };

    const startDeviceTilt = () => {
      if (
        deviceTiltListening
        || deviceOrientationPermission !== 'granted'
        || reducedMotion
        || document.hidden
        || parallaxPointer.matches
        || !coarsePointer.matches
      ) {
        return;
      }

      resetDeviceTiltCalibration();
      window.addEventListener('deviceorientation', handleDeviceOrientation, {
        passive: true,
      });
      deviceTiltListening = true;
    };

    const stopDeviceTilt = () => {
      if (deviceTiltListening) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        deviceTiltListening = false;
      }
      resetDeviceTiltCalibration();
    };

    const handleTiltPermissionGesture = () => {
      if (
        deviceOrientationPermission !== 'prompt'
        || !deviceOrientationConstructor?.requestPermission
      ) {
        return;
      }

      tiltPermissionGestureArmed = false;
      window.removeEventListener('pointerdown', handleTiltPermissionGesture);
      deviceOrientationPermission = 'requesting';
      void deviceOrientationConstructor.requestPermission()
        .then((permission) => {
          deviceOrientationPermission = permission;
          if (permission === 'granted') startDeviceTilt();
        })
        .catch(() => {
          deviceOrientationPermission = 'denied';
        });
    };

    const armTiltPermissionGesture = () => {
      if (
        tiltPermissionGestureArmed
        || deviceOrientationPermission !== 'prompt'
      ) {
        return;
      }

      window.addEventListener('pointerdown', handleTiltPermissionGesture, {
        passive: true,
      });
      tiltPermissionGestureArmed = true;
    };

    const disarmTiltPermissionGesture = () => {
      if (!tiltPermissionGestureArmed) return;
      window.removeEventListener('pointerdown', handleTiltPermissionGesture);
      tiltPermissionGestureArmed = false;
    };

    const configureDeviceTilt = () => {
      const shouldUseDeviceTilt = Boolean(deviceOrientationConstructor)
        && coarsePointer.matches
        && !parallaxPointer.matches
        && !reducedMotion
        && !document.hidden;

      if (!shouldUseDeviceTilt) {
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        return;
      }

      if (deviceOrientationPermission === 'granted') {
        disarmTiltPermissionGesture();
        startDeviceTilt();
      } else if (deviceOrientationPermission === 'prompt') {
        armTiltPermissionGesture();
      }
    };

    const paint = (time: number) => {
      if (!scene) return;
      const elapsed = clamp(time - previousTime, 0, 64);
      previousTime = time;
      sceneTime += elapsed;
      const colorEase = 1 - Math.exp(-elapsed / SECTION_COLOR_EASE_MS);
      currentColor[0] += (targetColorRef.current[0] - currentColor[0]) * colorEase;
      currentColor[1] += (targetColorRef.current[1] - currentColor[1]) * colorEase;
      currentColor[2] += (targetColorRef.current[2] - currentColor[2]) * colorEase;
      if (
        reducedMotion
        || (!parallaxPointer.matches && !deviceTiltListening)
      ) {
        currentParallaxX = 0;
        currentParallaxY = 0;
      } else {
        const parallaxEase = 1 - Math.exp(-elapsed / PARALLAX_EASE_MS);
        currentParallaxX += (targetParallaxX - currentParallaxX) * parallaxEase;
        currentParallaxY += (targetParallaxY - currentParallaxY) * parallaxEase;
      }
      const parallax = createParallaxFrame(
        scene,
        currentParallaxX,
        currentParallaxY,
      );
      if (
        !Number.isFinite(styledParallaxX)
        || Math.abs(currentParallaxX - styledParallaxX) > 0.0005
        || Math.abs(currentParallaxY - styledParallaxY) > 0.0005
      ) {
        syncEdgeGlowDepth(background, parallax);
        styledParallaxX = currentParallaxX;
        styledParallaxY = currentParallaxY;
      }
      drawScene(
        context,
        scene,
        sceneTime,
        currentColor,
        isDark,
        reducedMotion,
        parallax,
      );
    };

    const animate = (time: number) => {
      const frameInterval = coarsePointer.matches || window.innerWidth < 720 ? 1000 / 30 : 1000 / 45;
      const timeSinceLastPaint = time - lastPaintTime;
      if (timeSinceLastPaint >= frameInterval) {
        lastPaintTime = time - (timeSinceLastPaint % frameInterval);
        paint(time);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      previousTime = performance.now();
      lastPaintTime = 0;
      if (reducedMotion || document.hidden) {
        paint(previousTime);
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const renderWidth = Math.max(1, Math.round(canvas.clientWidth));
      const renderHeight = Math.max(1, Math.round(canvas.clientHeight));
      const width = Math.max(1, Math.round(background.clientWidth));
      const height = Math.max(1, Math.round(background.clientHeight));
      const renderOffsetX = Math.max(0, (renderWidth - width) * 0.5);
      const renderOffsetY = Math.max(0, (renderHeight - height) * 0.5);
      const dprLimit = coarsePointer.matches ? 1.25 : 1.5;
      const maxBackingPixels = coarsePointer.matches ? 3_000_000 : 6_000_000;
      const pixelBudgetRatio = Math.sqrt(
        maxBackingPixels / (renderWidth * renderHeight),
      );
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit, pixelBudgetRatio);
      canvas.width = Math.round(renderWidth * dpr);
      canvas.height = Math.round(renderHeight * dpr);
      context.setTransform(
        dpr,
        0,
        0,
        dpr,
        renderOffsetX * dpr,
        renderOffsetY * dpr,
      );
      scene = createScene(
        width,
        height,
        cloudSprites,
        auroraSprites,
        quasarSprite,
        vortexSprites,
        dpr,
      );
      styledParallaxX = Number.NaN;
      styledParallaxY = Number.NaN;
      paint(performance.now());
    };

    const scheduleResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    const resetParallax = () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || !parallaxPointer.matches || event.pointerType === 'touch') return;
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      targetParallaxX = clamp(event.clientX / viewportWidth * 2 - 1, -1, 1);
      targetParallaxY = clamp(event.clientY / viewportHeight * 2 - 1, -1, 1);
    };

    const handleParallaxCapabilityChange = () => {
      resetParallax();
      configureDeviceTilt();
    };

    const handleCoarsePointerChange = () => {
      resetParallax();
      configureDeviceTilt();
      scheduleResize();
    };

    const handleScreenOrientationChange = () => {
      resetDeviceTiltCalibration();
    };

    const handleWindowBlur = () => {
      resetParallax();
      resetDeviceTiltCalibration();
    };

    const handleMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      if (reducedMotion) {
        targetParallaxX = 0;
        targetParallaxY = 0;
        currentParallaxX = 0;
        currentParallaxY = 0;
        currentColor[0] = targetColorRef.current[0];
        currentColor[1] = targetColorRef.current[1];
        currentColor[2] = targetColorRef.current[2];
      }
      configureDeviceTilt();
      startAnimation();
    };

    const handleVisibility = () => {
      configureDeviceTilt();
      startAnimation();
    };
    const handleThemeChange = () => {
      isDark = document.documentElement.classList.contains('dark');
      if (reducedMotion) paint(performance.now());
    };

    redrawStaticSceneRef.current = () => {
      if (!reducedMotion) return;
      currentColor[0] = targetColorRef.current[0];
      currentColor[1] = targetColorRef.current[1];
      currentColor[2] = targetColorRef.current[2];
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    const themeObserver = new MutationObserver(handleThemeChange);
    resizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    motionPreference.addEventListener('change', handleMotionPreference);
    parallaxPointer.addEventListener('change', handleParallaxCapabilityChange);
    coarsePointer.addEventListener('change', handleCoarsePointerChange);
    window.screen.orientation?.addEventListener('change', handleScreenOrientationChange);
    window.addEventListener('orientationchange', handleScreenOrientationChange);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', handleWindowBlur);
    document.documentElement.addEventListener('pointerleave', resetParallax);
    document.addEventListener('visibilitychange', handleVisibility);
    configureDeviceTilt();
    resize();
    startAnimation();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motionPreference.removeEventListener('change', handleMotionPreference);
      parallaxPointer.removeEventListener('change', handleParallaxCapabilityChange);
      coarsePointer.removeEventListener('change', handleCoarsePointerChange);
      window.screen.orientation?.removeEventListener('change', handleScreenOrientationChange);
      window.removeEventListener('orientationchange', handleScreenOrientationChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', handleWindowBlur);
      document.documentElement.removeEventListener('pointerleave', resetParallax);
      document.removeEventListener('visibilitychange', handleVisibility);
      disarmTiltPermissionGesture();
      stopDeviceTilt();
      redrawStaticSceneRef.current = null;
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-edge-glows">
        <span className="ambient-edge-glow-depth ambient-edge-glow-depth-top-left">
          <span className="ambient-edge-glow ambient-edge-glow-top-left" />
        </span>
        <span className="ambient-edge-glow-depth ambient-edge-glow-depth-top-right">
          <span className="ambient-edge-glow ambient-edge-glow-top-right" />
        </span>
        <span className="ambient-edge-glow-depth ambient-edge-glow-depth-bottom-right">
          <span className="ambient-edge-glow ambient-edge-glow-bottom-right" />
        </span>
      </div>
      <canvas ref={canvasRef} className="cosmic-canvas" />
    </div>
  );
}
