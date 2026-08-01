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
  clouds: {
    accentAlpha: number;
    activeAlpha: number;
    glowCoreAlpha: number;
    glowMidAlpha: number;
  };
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
};

const TAU = Math.PI * 2;
const STAR_COLOR_FADE_MS = 1500;
const SECTION_COLOR_EASE_MS = 520;
const PLANET_VISIBILITY_SLOT_MS = 26_000;
const PLANET_VISIBILITY_FADE_MS = 2_200;
const PLANET_SECONDARY_START_MS = 8_500;
const PLANET_SECONDARY_END_MS = 20_500;
const PLANET_RARE_START_MS = 13_200;
const PLANET_RARE_END_MS = 16_000;
const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const CLOUD_ACCENT: Rgb = [72, 78, 255];
const ABOUT_CLOUD_ACCENT: Rgb = [158, 88, 255];
const FOREGROUND_CLOUD_PURPLE: Rgb = [148, 82, 255];
const DEEP_SPACE: Rgb = [10, 14, 54];
const DARK_STAR_NEUTRAL: Rgb = [225, 234, 255];
const LIGHT_STAR_NEUTRAL: Rgb = [42, 53, 88];
const COSMIC_RENDER_THEMES: Record<'dark' | 'light', CosmicRenderTheme> = {
  dark: {
    neutralStarColor: DARK_STAR_NEUTRAL,
    cloudCompositeOperation: 'screen',
    backgroundWash: { centerAlpha: 0.12, depthAlpha: 0.065 },
    fieldStarAlpha: 0.34,
    starClusters: { baseAlpha: 0.86, highlightAlpha: 0.92 },
    ringTrails: { baseAlpha: 0.09, laneFalloff: 0.01, dashAlpha: 0.17 },
    secondaryRings: {
      distantAlpha: 0.1,
      innerAlpha: 0.125,
      dashAlpha: 0.18,
      particleAlpha: 0.72,
    },
    aurora: { activeAlpha: 0.76, purpleAlpha: 0.32 },
    clouds: {
      accentAlpha: 0.4,
      activeAlpha: 0.7,
      glowCoreAlpha: 0.04,
      glowMidAlpha: 0.018,
    },
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
    starClusters: { baseAlpha: 0.58, highlightAlpha: 0.72 },
    ringTrails: { baseAlpha: 0.07, laneFalloff: 0.007, dashAlpha: 0.115 },
    secondaryRings: {
      distantAlpha: 0.055,
      innerAlpha: 0.072,
      dashAlpha: 0.1,
      particleAlpha: 0.46,
    },
    aurora: { activeAlpha: 0.38, purpleAlpha: 0.16 },
    clouds: {
      accentAlpha: 0.15,
      activeAlpha: 0.26,
      glowCoreAlpha: 0.026,
      glowMidAlpha: 0.012,
    },
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

function snapToPixel(value: number, pixelRatio: number) {
  return Math.round(value * pixelRatio) / pixelRatio;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function getWindowOpacity(time: number, start: number, end: number, fadeDuration: number) {
  const fadeIn = smoothstep(clamp((time - start) / fadeDuration, 0, 1));
  const fadeOut = 1 - smoothstep(clamp((time - (end - fadeDuration)) / fadeDuration, 0, 1));
  return Math.min(fadeIn, fadeOut);
}

function getPlanetVisibility(
  index: number,
  planetCount: number,
  time: number,
  reducedMotion: boolean,
) {
  if (reducedMotion) return index < Math.min(2, planetCount) ? 1 : 0;

  const slotIndex = Math.floor(time / PLANET_VISIBILITY_SLOT_MS);
  const slotTime = time % PLANET_VISIBILITY_SLOT_MS;
  const primaryIndex = slotIndex % planetCount;
  const previousIndex = (primaryIndex - 1 + planetCount) % planetCount;
  const secondaryIndex = (primaryIndex + 2) % planetCount;
  const rareIndex = (primaryIndex + 4) % planetCount;
  const primaryFade = smoothstep(clamp(slotTime / PLANET_VISIBILITY_FADE_MS, 0, 1));

  let opacity = index === primaryIndex ? primaryFade : 0;
  if (index === previousIndex && slotTime < PLANET_VISIBILITY_FADE_MS) {
    opacity = Math.max(opacity, 1 - primaryFade);
  }

  if (index === secondaryIndex) {
    opacity = Math.max(
      opacity,
      getWindowOpacity(
        slotTime,
        PLANET_SECONDARY_START_MS,
        PLANET_SECONDARY_END_MS,
        PLANET_VISIBILITY_FADE_MS,
      ),
    );
  }

  const isRareOverlap = slotIndex % 7 === 2;
  if (isRareOverlap && index === rareIndex) {
    opacity = Math.max(
      opacity,
      getWindowOpacity(
        slotTime,
        PLANET_RARE_START_MS,
        PLANET_RARE_END_MS,
        PLANET_VISIBILITY_FADE_MS * 0.45,
      ),
    );
  }

  return opacity;
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

function updateAuroraTint(aurora: AuroraSprites, color: Rgb) {
  aurora.lastActiveColor = updateCloudTint(
    aurora.active,
    aurora.activeContext,
    aurora.alpha,
    color,
    aurora.lastActiveColor,
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

function createScene(
  width: number,
  height: number,
  clouds: CloudSprites,
  aurora: AuroraSprites,
  pixelRatio: number,
): Scene {
  const compact = width < 720;
  const starCount = compact
    ? clamp(Math.round((width * height) / 5200), 72, 105)
    : clamp(Math.round((width * height) / 8600), 110, 190);
  const ringParticleCount = compact ? 86 : 168;
  const stars = Array.from({ length: starCount }, (_, index): Star => ({
    x: seededRandom(index * 3.1 + 1),
    y: seededRandom(index * 5.7 + 2),
    size: 0.45 + seededRandom(index * 7.9 + 3) * 1.65,
    depth: 0.35 + seededRandom(index * 9.1 + 4) * 0.65,
    phase: seededRandom(index * 11.3 + 5) * TAU,
    colorSeed: index * 1.73 + 0.41,
    colorOffset: seededRandom(index * 13.7 + 6) * STAR_COLOR_FADE_MS,
    tintStrength: 0.28 + seededRandom(index * 15.1 + 7) * 0.72,
  }));
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
      size: compact ? 0.054 : 0.09,
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
    starClusters,
    ringParticles,
    planets,
    orbit,
    secondaryRings,
    clouds,
    aurora,
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
) {
  context.save();
  for (const cluster of scene.starClusters) {
    if (cluster.layer !== layer) continue;
    const [driftX, driftY, opacityPulse] = getStarClusterMotion(cluster, time, reducedMotion);
    const x = snapToPixel(cluster.centerX - cluster.width * 0.5 + driftX, scene.pixelRatio);
    const y = snapToPixel(cluster.centerY - cluster.height * 0.5 + driftY, scene.pixelRatio);
    const sprite = isDark ? cluster.darkSprite : cluster.lightSprite;
    context.globalAlpha = renderTheme.starClusters.baseAlpha * opacityPulse;
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
  }
  context.restore();
}

function drawStarClusterHighlights(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const motionTime = reducedMotion ? 0 : time;
  for (const cluster of scene.starClusters) {
    const [driftX, driftY] = getStarClusterMotion(cluster, time, reducedMotion);
    const originX = cluster.centerX - cluster.width * 0.5 + driftX;
    const originY = cluster.centerY - cluster.height * 0.5 + driftY;

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
        * twinkle;
      drawStar(context, x, y, highlight.size, color, alpha);
    }
  }
}

function drawFieldStars(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  for (const star of scene.stars) {
    const motionTime = reducedMotion ? 0 : time;
    const x = star.x * scene.width + Math.sin(motionTime * 0.00022 + star.phase) * 13 * star.depth;
    const y = star.y * scene.height + Math.cos(motionTime * 0.00017 + star.phase) * 9 * star.depth;
    const twinkle = reducedMotion ? 0.72 : 0.58 + Math.sin(time * 0.0013 + star.phase) * 0.28;
    const color = getAnimatedStarColor(
      star.colorSeed,
      star.colorOffset,
      reducedMotion ? 0 : time,
      activeColor,
      renderTheme.neutralStarColor,
      star.tintStrength,
    );
    const alpha = renderTheme.fieldStarAlpha * star.depth * twinkle;
    drawStar(context, x, y, star.size * (0.72 + star.depth * 0.5), color, alpha);
  }
}

function drawRingTrails(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const { orbit } = scene;
  const motionTime = reducedMotion ? 0 : time;
  context.save();
  context.translate(orbit.centerX, orbit.centerY);
  context.rotate(orbit.tilt);

  for (let lane = 0; lane < 4; lane += 1) {
    const laneScale = 0.91 + lane * 0.052;
    const trailColor = mixRgb(activeColor, CLOUD_ACCENT, lane * 0.16);
    context.lineWidth = 0.65 + lane * 0.28;
    context.strokeStyle = rgba(
      trailColor,
      renderTheme.ringTrails.baseAlpha - lane * renderTheme.ringTrails.laneFalloff,
    );
    context.setLineDash([]);
    context.beginPath();
    context.ellipse(0, 0, orbit.radiusX * laneScale, orbit.radiusY * laneScale, 0, 0, TAU);
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
    context.beginPath();
    context.ellipse(0, 0, orbit.radiusX * laneScale, orbit.radiusY * laneScale, 0, 0, TAU);
    context.stroke();
  }

  context.setLineDash([]);
  context.restore();
}

function drawSecondaryRingSystem(
  context: CanvasRenderingContext2D,
  ring: SecondaryRingSystem,
  time: number,
  activeColor: Rgb,
  baseAlpha: number,
  dashAlpha: number,
  reducedMotion: boolean,
) {
  const motionTime = reducedMotion ? 0 : time;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);
  const centerLane = (ring.lanes - 1) * 0.5;

  context.save();
  context.translate(ring.centerX, ring.centerY);
  context.rotate(ring.tilt);
  context.lineCap = 'round';

  for (let lane = 0; lane < ring.lanes; lane += 1) {
    const laneOffset = lane - centerLane;
    const laneScale = 1 + laneOffset * ring.laneSpacing;
    const laneAlpha = 1 - Math.abs(laneOffset) * 0.11;

    context.setLineDash([]);
    context.lineWidth = 0.55 + lane * 0.16;
    context.strokeStyle = rgba(ringColor, baseAlpha * laneAlpha);
    context.beginPath();
    context.ellipse(
      0,
      0,
      ring.radiusX * laneScale,
      ring.radiusY * laneScale,
      0,
      0,
      TAU,
    );
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
    context.beginPath();
    context.ellipse(
      0,
      0,
      ring.radiusX * laneScale,
      ring.radiusY * laneScale,
      0,
      0,
      TAU,
    );
    context.stroke();
  }

  context.setLineDash([]);
  const glintAngle = ring.glintAngle + motionTime * ring.glintSpeed;
  const glintX = Math.cos(glintAngle) * ring.radiusX;
  const glintY = Math.sin(glintAngle) * ring.radiusY;
  const glintPulse = reducedMotion ? 0.72 : 0.64 + Math.sin(time * 0.0011 + ring.glintAngle) * 0.24;
  drawStar(context, glintX, glintY, 1.25, ringColor, dashAlpha * 3.2 * glintPulse);
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
) {
  const motionTime = reducedMotion ? 0 : time;
  const cosTilt = Math.cos(ring.tilt);
  const sinTilt = Math.sin(ring.tilt);
  const centerLane = (ring.lanes - 1) * 0.5;
  const ringColor = mixRgb(activeColor, FOREGROUND_CLOUD_PURPLE, ring.colorMix);

  for (const particle of ring.particles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 1 + (particle.lane - centerLane) * ring.laneSpacing;
    const localX = Math.cos(angle) * ring.radiusX * laneScale;
    const localY = Math.sin(angle) * ring.radiusY * laneScale;
    const x = snapToPixel(
      ring.centerX + localX * cosTilt - localY * sinTilt,
      scene.pixelRatio,
    );
    const y = snapToPixel(
      ring.centerY + localX * sinTilt + localY * cosTilt,
      scene.pixelRatio,
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
      * twinkle;
    const size = particle.size * (0.78 + depth * 0.58);
    drawStar(context, x, y, size, color, alpha);
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

function drawCloudCore(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const nebulaAccentColor = getNebulaAccentColor(activeColor);
  updateActiveCloudTint(scene.clouds, mixRgb(activeColor, nebulaAccentColor, 0.16));
  updateAccentCloudTint(scene.clouds, nebulaAccentColor);
  const motionTime = reducedMotion ? 0 : time;
  const centerX = scene.compact ? scene.width * 0.5 : scene.width * 0.46;
  const centerY = scene.compact ? scene.height * 0.61 : scene.height * 0.66;
  const cloudWidth = Math.min(scene.width * (scene.compact ? 1.15 : 0.82), 1120);
  const cloudHeight = cloudWidth * 0.5;
  const driftX = Math.sin(motionTime * 0.000052) * (scene.compact ? 8 : 16);
  const driftY = Math.cos(motionTime * 0.000041) * 9;
  const scalePulse = 1 + Math.sin(motionTime * 0.000036) * 0.025;

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(centerX + driftX, centerY + driftY);
  context.rotate(-0.055 + Math.sin(motionTime * 0.000021) * 0.018);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.clouds.accentAlpha;
  context.drawImage(
    scene.clouds.accent,
    -cloudWidth * 0.58,
    -cloudHeight * 0.52,
    cloudWidth * 1.16,
    cloudHeight * 1.04,
  );
  context.globalAlpha = renderTheme.clouds.activeAlpha;
  context.drawImage(
    scene.clouds.active,
    -cloudWidth * 0.5,
    -cloudHeight * 0.5,
    cloudWidth,
    cloudHeight,
  );
  context.restore();

  const glowRadius = Math.max(cloudWidth * 0.42, 160);
  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  glow.addColorStop(
    0,
    rgba(mixRgb(activeColor, nebulaAccentColor, 0.44), renderTheme.clouds.glowCoreAlpha),
  );
  glow.addColorStop(0.46, rgba(activeColor, renderTheme.clouds.glowMidAlpha));
  glow.addColorStop(1, rgba(activeColor, 0));
  context.fillStyle = glow;
  context.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);
}

function drawForegroundClouds(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
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

  context.save();
  context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
  context.translate(cloudX, cloudY);
  context.rotate(0.045 + Math.sin(motionTime * 0.000017) * 0.012);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = renderTheme.foregroundClouds.purpleAlpha * opacityPulse;
  context.drawImage(
    scene.clouds.purple,
    -cloudWidth * 0.62,
    -cloudHeight * 0.54,
    cloudWidth * 1.18,
    cloudHeight * 1.08,
  );
  context.globalAlpha = renderTheme.foregroundClouds.activeAlpha * opacityPulse;
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
    rgba(glowColor, renderTheme.foregroundClouds.glowCoreAlpha * opacityPulse),
  );
  glow.addColorStop(
    0.5,
    rgba(FOREGROUND_CLOUD_PURPLE, renderTheme.foregroundClouds.glowMidAlpha * opacityPulse),
  );
  glow.addColorStop(1, rgba(FOREGROUND_CLOUD_PURPLE, 0));
  context.fillStyle = glow;
  context.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
  context.restore();
}

function drawRingParticles(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const { orbit } = scene;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const motionTime = reducedMotion ? 0 : time;

  for (const particle of scene.ringParticles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 0.91 + particle.lane * 0.052;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
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
    const alpha = renderTheme.ringParticleAlpha * (0.5 + depth * 0.5) * twinkle;
    const size = particle.size * (0.84 + depth * 0.76);
    drawStar(context, x, y, size, color, alpha);
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
  foreground: boolean,
) {
  context.save();
  context.translate(x, y);
  context.rotate(0.32 + phase * 0.025);
  context.scale(1, 0.34);
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
) {
  const { planetSurface } = renderTheme;
  const featureAlpha = planetSurface.featureAlpha;
  context.save();
  context.translate(x, y);
  context.rotate(-0.14 + phase * 0.035);
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.clip();

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

  if (ringed) drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, false);

  const gradient = context.createRadialGradient(
    x - radius * 0.32,
    y - radius * 0.36,
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

  if (ringed) drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, true);
}

function drawPlanets(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
) {
  const planetCount = scene.compact ? 3 : scene.planets.length;
  const minDimension = Math.min(scene.width, scene.height);
  const motionTime = reducedMotion ? 0 : time;
  const { orbit } = scene;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);

  for (let index = 0; index < planetCount; index += 1) {
    const planet = scene.planets[index];
    const visibility = getPlanetVisibility(index, planetCount, time, reducedMotion);
    if (visibility <= 0.01) continue;

    context.save();
    context.globalAlpha *= visibility;
    const surfacePhase = planet.phase + motionTime * planet.spinSpeed;
    let x: number;
    let y: number;
    let radius = minDimension * planet.size;

    if (planet.motion === 'orbit') {
      const angle = planet.angle + motionTime * planet.speed * planet.direction;
      const laneScale = 0.84 + planet.lane * 0.085;
      const localX = Math.cos(angle) * orbit.radiusX * laneScale;
      const localY = Math.sin(angle) * orbit.radiusY * laneScale;
      x = orbit.centerX + localX * cosTilt - localY * sinTilt;
      y = orbit.centerY + localX * sinTilt + localY * cosTilt;
      const depth = (Math.sin(angle) + 1) * 0.5;
      radius *= 0.82 + depth * 0.28;
    } else {
      const offscreenMargin = radius * 2.4;
      const travelWidth = scene.width + offscreenMargin * 2;
      const travelledX = planet.x * scene.width + motionTime * planet.velocityX + offscreenMargin;
      x = ((travelledX % travelWidth) + travelWidth) % travelWidth - offscreenMargin;
      y = planet.y * scene.height
        + Math.sin(planet.phase + motionTime * planet.waveSpeed) * planet.waveY;

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
) {
  const renderTheme = isDark ? COSMIC_RENDER_THEMES.dark : COSMIC_RENDER_THEMES.light;
  context.clearRect(0, 0, scene.width, scene.height);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  drawBackgroundWash(context, scene, activeColor, renderTheme);
  drawSecondaryRingSystem(
    context,
    scene.secondaryRings.distant,
    time,
    activeColor,
    renderTheme.secondaryRings.distantAlpha,
    renderTheme.secondaryRings.dashAlpha * 0.72,
    reducedMotion,
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
  );
  drawStarClusterSprites(context, scene, time, renderTheme, isDark, reducedMotion, 'far');
  drawFieldStars(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawMainRingAurora(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawRingTrails(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawSecondaryRingSystem(
    context,
    scene.secondaryRings.inner,
    time,
    activeColor,
    renderTheme.secondaryRings.innerAlpha,
    renderTheme.secondaryRings.dashAlpha,
    reducedMotion,
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
  );
  drawStarClusterSprites(context, scene, time, renderTheme, isDark, reducedMotion, 'ring');
  drawCloudCore(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawStarClusterHighlights(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawRingParticles(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawForegroundClouds(context, scene, time, activeColor, renderTheme, reducedMotion);
  drawPlanets(context, scene, time, activeColor, renderTheme, reducedMotion);
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
    if (!canvas || !context) return;
    const cloudSprites = createCloudSprites();
    const auroraSprites = createAuroraSprites();
    if (!cloudSprites || !auroraSprites) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    let scene: Scene | null = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastPaintTime = 0;
    let previousTime = performance.now();
    let isDark = document.documentElement.classList.contains('dark');
    let reducedMotion = motionPreference.matches;
    const currentColor: Rgb = [...targetColorRef.current];

    const paint = (time: number) => {
      if (!scene) return;
      const elapsed = clamp(time - previousTime, 0, 64);
      previousTime = time;
      const colorEase = 1 - Math.exp(-elapsed / SECTION_COLOR_EASE_MS);
      currentColor[0] += (targetColorRef.current[0] - currentColor[0]) * colorEase;
      currentColor[1] += (targetColorRef.current[1] - currentColor[1]) * colorEase;
      currentColor[2] += (targetColorRef.current[2] - currentColor[2]) * colorEase;
      drawScene(context, scene, time, currentColor, isDark, reducedMotion);
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
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      const dprLimit = coarsePointer.matches ? 1.25 : 1.5;
      const maxBackingPixels = coarsePointer.matches ? 3_000_000 : 6_000_000;
      const pixelBudgetRatio = Math.sqrt(maxBackingPixels / (width * height));
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit, pixelBudgetRatio);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = createScene(width, height, cloudSprites, auroraSprites, dpr);
      paint(performance.now());
    };

    const scheduleResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    const handleMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      if (reducedMotion) {
        currentColor[0] = targetColorRef.current[0];
        currentColor[1] = targetColorRef.current[1];
        currentColor[2] = targetColorRef.current[2];
      }
      startAnimation();
    };

    const handleVisibility = () => startAnimation();
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
    document.addEventListener('visibilitychange', handleVisibility);
    resize();
    startAnimation();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motionPreference.removeEventListener('change', handleMotionPreference);
      document.removeEventListener('visibilitychange', handleVisibility);
      redrawStaticSceneRef.current = null;
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-edge-glows">
        <span className="ambient-edge-glow ambient-edge-glow-top-left" />
        <span className="ambient-edge-glow ambient-edge-glow-top-right" />
        <span className="ambient-edge-glow ambient-edge-glow-bottom-right" />
      </div>
      <canvas ref={canvasRef} className="cosmic-canvas" />
      <div className="ambient-noise" />
    </div>
  );
}
