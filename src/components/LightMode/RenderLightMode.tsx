import { useEffect, useRef } from 'react';
import {
  RENDERER_SNAPSHOT_VERSION,
  cloneRendererRgb,
  isRendererCameraSnapshot,
  isRendererRgbSnapshot,
} from '../../background-renderer/session';
import type {
  DeviceOrientationSession,
  LightRendererSnapshot,
  RendererSession,
} from '../../background-renderer/session';
import { registerRendererPrewarmer } from '../../background-renderer/prewarm';

type RenderLightModeProps = {
  activeColor: string;
  session: RendererSession<LightRendererSnapshot>;
  deviceOrientationSession: DeviceOrientationSession;
};

type Rgb = [number, number, number];
type CloudLayerKind = 'far' | 'middle' | 'foreground';
type HazeLayerKind = 'far' | 'middle' | 'near';

type AtmosphericDepthProfile = Readonly<{
  translation: number;
  perspective: number;
  tilt: number;
}>;

type CloudSprites = {
  farA: HTMLCanvasElement;
  farB: HTMLCanvasElement;
  middleA: HTMLCanvasElement;
  middleB: HTMLCanvasElement;
  foreground: HTMLCanvasElement;
};

type AtmosphericSprites = {
  clouds: CloudSprites;
  cyanHaze: HTMLCanvasElement;
  lavenderHaze: HTMLCanvasElement;
  distantHills: DistantHillSprites;
  river: HTMLCanvasElement;
  sun: HTMLCanvasElement;
};

type DistantHillSprites = {
  far: HTMLCanvasElement;
  middle: HTMLCanvasElement;
  near: HTMLCanvasElement;
};

type Cloud = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  speed: number;
  direction: -1 | 1;
  phase: number;
  opacity: number;
  layer: CloudLayerKind;
  sprite: HTMLCanvasElement;
};

type HazeLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  phase: number;
  driftX: number;
  driftY: number;
  opacity: number;
  layer: HazeLayerKind;
  sprite: HTMLCanvasElement;
};

type DistantHillLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  opacity: number;
  sprite: HTMLCanvasElement;
};

type RiverState = {
  x: number;
  y: number;
  width: number;
  height: number;
  depthProfile: AtmosphericDepthProfile;
  opacity: number;
  sprite: HTMLCanvasElement;
};

type AtmosphericParticle = {
  x: number;
  y: number;
  size: number;
  depthProfile: AtmosphericDepthProfile;
  phase: number;
  drift: number;
  speed: number;
  colorIndex: number;
};

type SunState = {
  x: number;
  y: number;
  radius: number;
  glowRadius: number;
};

type DepthProjection = {
  x: number;
  y: number;
  scale: number;
  alphaScale: number;
};

type ParallaxFrame = {
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

type AtmosphericScene = {
  width: number;
  height: number;
  compact: boolean;
  motionScale: number;
  sun: SunState;
  clouds: Cloud[];
  haze: HazeLayer[];
  distantHills: DistantHillLayer[];
  river: RiverState;
  particles: AtmosphericParticle[];
  projection: DepthProjection;
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

type CloudSpec = {
  x: number;
  y: number;
  width: number;
  aspect: number;
  speed: number;
  direction: -1 | 1;
  opacity: number;
  layer: CloudLayerKind;
  sprite: keyof CloudSprites;
};

const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const SKY_CYAN: Rgb = [114, 199, 232];
const SKY_LAVENDER: Rgb = [178, 166, 226];
const WARM_RIGHT_GLOW: Rgb = [255, 235, 196];
const RIVER_SAGE: Rgb = [155, 166, 164];
const RIVER_BLUE_GREY: Rgb = [155, 173, 173];
const RIVER_REFLECTION: Rgb = [205, 214, 211];
const WARM_PARTICLE: Rgb = [255, 244, 220];
const COOL_PARTICLE: Rgb = [225, 246, 255];
const SECTION_COLOR_DURATION_MS = 1200;
const PARALLAX_EASE_MS = 300;
const DEVICE_TILT_DEAD_ZONE = 1.25;
const DEVICE_TILT_RANGE_X = 18;
const DEVICE_TILT_RANGE_Y = 22;
const TAU = Math.PI * 2;
const DEGREE = Math.PI / 180;

// Each normalized response is independent: 0 stays anchored and 1 receives
// the light camera's full translation, cursor-weighted scale, or plane tilt.
const LIGHT_DEPTH_PROFILES = {
  sun: { translation: 0.02, perspective: 0.02, tilt: 0.01 },
  farHaze: { translation: 0.05, perspective: 0.04, tilt: 0.03 },
  distantHill: { translation: 0.065, perspective: 0.055, tilt: 0.04 },
  river: { translation: 0.09, perspective: 0.075, tilt: 0.055 },
  farCloud: { translation: 0.2, perspective: 0.16, tilt: 0.14 },
  middleHaze: { translation: 0.32, perspective: 0.28, tilt: 0.24 },
  middleCloud: { translation: 0.45, perspective: 0.4, tilt: 0.36 },
  nearHaze: { translation: 0.6, perspective: 0.56, tilt: 0.5 },
  foregroundMist: { translation: 0.78, perspective: 0.7, tilt: 0.64 },
} as const satisfies Record<string, AtmosphericDepthProfile>;

const PARTICLE_DEPTH_RANGE = {
  translation: [0.36, 0.54],
  perspective: [0.32, 0.48],
} as const;

const DESKTOP_CLOUD_SPECS: CloudSpec[] = [
  { x: -0.04, y: 0.2, width: 0.3, aspect: 3, speed: 2.7, direction: 1, opacity: 0.11, layer: 'far', sprite: 'farA' },
  { x: 0.31, y: 0.32, width: 0.24, aspect: 2.8, speed: 3.8, direction: -1, opacity: 0.09, layer: 'far', sprite: 'farB' },
  { x: 0.67, y: 0.16, width: 0.28, aspect: 3.1, speed: 3.2, direction: 1, opacity: 0.12, layer: 'far', sprite: 'farA' },
  { x: 0.97, y: 0.48, width: 0.26, aspect: 2.9, speed: 4.1, direction: -1, opacity: 0.1, layer: 'far', sprite: 'farB' },
  { x: -0.1, y: 0.5, width: 0.43, aspect: 2.35, speed: 5.1, direction: 1, opacity: 0.16, layer: 'middle', sprite: 'middleA' },
  { x: 0.49, y: 0.61, width: 0.36, aspect: 2.2, speed: 6.6, direction: -1, opacity: 0.18, layer: 'middle', sprite: 'middleB' },
  { x: 0.94, y: 0.36, width: 0.4, aspect: 2.3, speed: 4.7, direction: -1, opacity: 0.16, layer: 'middle', sprite: 'middleA' },
  { x: -0.14, y: 0.88, width: 0.72, aspect: 2.55, speed: 3.4, direction: 1, opacity: 0.14, layer: 'foreground', sprite: 'foreground' },
  { x: 0.93, y: 0.84, width: 0.66, aspect: 2.5, speed: 2.9, direction: -1, opacity: 0.15, layer: 'foreground', sprite: 'foreground' },
];

const COMPACT_CLOUD_SPECS: CloudSpec[] = [
  { x: -0.08, y: 0.24, width: 0.55, aspect: 3, speed: 2.5, direction: 1, opacity: 0.1, layer: 'far', sprite: 'farA' },
  { x: 0.78, y: 0.42, width: 0.48, aspect: 2.8, speed: 3.3, direction: -1, opacity: 0.115, layer: 'far', sprite: 'farB' },
  { x: -0.12, y: 0.57, width: 0.78, aspect: 2.3, speed: 4.2, direction: 1, opacity: 0.155, layer: 'middle', sprite: 'middleA' },
  { x: 0.79, y: 0.66, width: 0.72, aspect: 2.2, speed: 5.2, direction: -1, opacity: 0.17, layer: 'middle', sprite: 'middleB' },
  { x: 0.84, y: 0.9, width: 1.24, aspect: 2.6, speed: 2.8, direction: -1, opacity: 0.14, layer: 'foreground', sprite: 'foreground' },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${clamp(alpha, 0, 1)})`;
}

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  const mix = clamp(amount, 0, 1);
  return [
    from[0] + (to[0] - from[0]) * mix,
    from[1] + (to[1] - from[1]) * mix,
    from[2] + (to[2] - from[2]) * mix,
  ];
}

function parseColor(value: string): Rgb | null {
  const color = value.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  if (shortHex) {
    return shortHex.slice(1).map((channel) => Number.parseInt(channel + channel, 16)) as Rgb;
  }

  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (longHex) {
    return longHex.slice(1).map((channel) => Number.parseInt(channel, 16)) as Rgb;
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(color);
  if (!rgb) return null;
  return [
    clamp(Number(rgb[1]), 0, 255),
    clamp(Number(rgb[2]), 0, 255),
    clamp(Number(rgb[3]), 0, 255),
  ];
}

function resolveActiveColor(value: string): Rgb {
  let resolved = value.trim();
  const variable = /^var\(\s*(--[\w-]+)(?:\s*,[^)]+)?\s*\)$/.exec(resolved);
  if (variable && typeof document !== 'undefined') {
    resolved = getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  }
  return parseColor(resolved) ?? [...DEFAULT_ACTIVE_COLOR];
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function featherSprite(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.filter = 'none';
  context.globalCompositeOperation = 'destination-in';
  const horizontal = context.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, 'rgba(255,255,255,0)');
  horizontal.addColorStop(0.1, 'rgba(255,255,255,1)');
  horizontal.addColorStop(0.9, 'rgba(255,255,255,1)');
  horizontal.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, width, height);

  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, 'rgba(255,255,255,0)');
  vertical.addColorStop(0.12, 'rgba(255,255,255,1)');
  vertical.addColorStop(0.86, 'rgba(255,255,255,1)');
  vertical.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function createCloudSprite(kind: CloudLayerKind, seed: number) {
  const width = kind === 'foreground' ? 720 : 600;
  const height = kind === 'foreground' ? 320 : 280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(seed);
  const isFar = kind === 'far';
  const isForeground = kind === 'foreground';
  const puffCount = isFar ? 13 : isForeground ? 22 : 18;
  context.globalCompositeOperation = 'source-over';
  context.filter = `blur(${isFar ? 13 : isForeground ? 22 : 17}px)`;

  for (let index = 0; index < (isFar ? 9 : 12); index += 1) {
    const progress = index / Math.max((isFar ? 9 : 12) - 1, 1);
    const x = width * (0.08 + progress * 0.84) + (random() - 0.5) * width * 0.1;
    const y = height * (isForeground ? 0.64 : 0.59) + (random() - 0.5) * height * 0.13;
    context.fillStyle = rgba(
      index % 3 === 0 ? [162, 169, 218] as Rgb : [128, 181, 220] as Rgb,
      isFar ? 0.42 : 0.5,
    );
    context.beginPath();
    context.ellipse(
      x,
      y,
      width * (0.075 + random() * 0.055),
      height * (isFar ? 0.07 : 0.12) * (0.75 + random() * 0.55),
      (random() - 0.5) * 0.12,
      0,
      TAU,
    );
    context.fill();
  }

  context.filter = `blur(${isFar ? 8 : isForeground ? 16 : 11}px)`;

  for (let index = 0; index < puffCount; index += 1) {
    const progress = index / Math.max(puffCount - 1, 1);
    const x = width * (0.1 + progress * 0.8) + (random() - 0.5) * width * 0.12;
    const arc = Math.sin(progress * Math.PI);
    const y = height * (isForeground ? 0.58 : 0.53)
      - arc * height * (isFar ? 0.06 : 0.15)
      + (random() - 0.5) * height * 0.16;
    const radiusX = width * (isFar ? 0.075 : isForeground ? 0.09 : 0.08)
      * (0.72 + random() * 0.75);
    const radiusY = height * (isFar ? 0.075 : isForeground ? 0.16 : 0.14)
      * (0.68 + random() * 0.72);
    const tint = index % 3 === 0 ? [205, 229, 247] as Rgb : [255, 255, 255] as Rgb;
    context.fillStyle = rgba(tint, isFar ? 0.76 : 0.9);
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, (random() - 0.5) * 0.18, 0, TAU);
    context.fill();
  }

  context.filter = `blur(${isFar ? 4 : 6}px)`;
  context.lineCap = 'round';
  context.lineWidth = isFar ? 8 : isForeground ? 17 : 12;
  for (let index = 0; index < (isFar ? 7 : 9); index += 1) {
    const baseY = height * (0.38 + random() * 0.33);
    context.strokeStyle = rgba(index % 2 === 0 ? SKY_CYAN : SKY_LAVENDER, isFar ? 0.24 : 0.2);
    context.beginPath();
    context.moveTo(width * (0.03 + random() * 0.08), baseY);
    context.bezierCurveTo(
      width * 0.28,
      baseY - height * (0.12 + random() * 0.12),
      width * 0.68,
      baseY + height * (random() - 0.5) * 0.16,
      width * (0.91 + random() * 0.06),
      baseY - height * (random() - 0.5) * 0.08,
    );
    context.stroke();
  }

  if (!isFar) {
    context.filter = 'blur(3px)';
    for (let index = 0; index < 8; index += 1) {
      const x = width * (0.16 + random() * 0.68);
      const y = height * (0.38 + random() * 0.26);
      context.fillStyle = `rgba(255,255,255,${0.18 + random() * 0.16})`;
      context.beginPath();
      context.ellipse(x, y, width * (0.025 + random() * 0.03), height * (0.035 + random() * 0.05), 0, 0, TAU);
      context.fill();
    }
  }

  featherSprite(context, width, height);
  return canvas;
}

function createHazeSprite(color: Rgb, seed: number) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const random = createSeededRandom(seed);
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 12; index += 1) {
    const x = size * (0.28 + random() * 0.44);
    const y = size * (0.28 + random() * 0.44);
    const radius = size * (0.22 + random() * 0.2);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rgba(color, 0.11 + random() * 0.05));
    gradient.addColorStop(0.5, rgba(color, 0.04));
    gradient.addColorStop(1, rgba(color, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  featherSprite(context, size, size);
  return canvas;
}

function createSunSprite() {
  const size = 640;
  const center = size * 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.save();
  context.translate(center, center);
  context.filter = 'blur(16px)';
  context.lineCap = 'round';
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 + 0.18;
    context.rotate(angle);
    const ray = context.createLinearGradient(0, 0, center * 0.84, 0);
    ray.addColorStop(0, 'rgba(255,247,226,0.16)');
    ray.addColorStop(1, 'rgba(255,247,226,0)');
    context.strokeStyle = ray;
    context.lineWidth = index % 2 === 0 ? 9 : 5;
    context.beginPath();
    context.moveTo(center * 0.05, 0);
    context.lineTo(center * (index % 2 === 0 ? 0.82 : 0.58), 0);
    context.stroke();
    context.rotate(-angle);
  }
  context.restore();

  const outer = context.createRadialGradient(center, center, 0, center, center, center);
  outer.addColorStop(0, 'rgba(255,253,244,0.82)');
  outer.addColorStop(0.05, 'rgba(255,249,229,0.56)');
  outer.addColorStop(0.17, 'rgba(255,236,198,0.24)');
  outer.addColorStop(0.48, 'rgba(255,225,181,0.09)');
  outer.addColorStop(1, 'rgba(255,225,181,0)');
  context.fillStyle = outer;
  context.fillRect(0, 0, size, size);

  const core = context.createRadialGradient(center, center, 0, center, center, size * 0.05);
  core.addColorStop(0, 'rgba(255,255,252,0.98)');
  core.addColorStop(0.36, 'rgba(255,252,240,0.82)');
  core.addColorStop(1, 'rgba(255,241,211,0)');
  context.fillStyle = core;
  context.fillRect(0, 0, size, size);
  return canvas;
}

function createDistantHillSprite(kind: keyof DistantHillSprites) {
  const width = 1200;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const profiles: Record<keyof DistantHillSprites, {
    masses: ReadonlyArray<{
      ridge: ReadonlyArray<readonly [number, number]>;
      opacity: number;
      lift: number;
      blurScale: number;
    }>;
    highlight: Rgb;
    shadow: Rgb;
    blur: number;
    fadeStart: number;
  }> = {
    far: {
      masses: [
        {
          ridge: [
            [0.5, 0.96], [0.58, 0.8], [0.67, 0.64], [0.76, 0.56],
            [0.84, 0.58], [0.93, 0.68], [1.02, 0.83], [1.1, 0.96],
          ],
          opacity: 0.26,
          lift: 0.52,
          blurScale: 1.35,
        },
        {
          ridge: [
            [0.13, 0.96], [0.22, 0.76], [0.31, 0.61], [0.4, 0.53],
            [0.49, 0.55], [0.59, 0.64], [0.69, 0.77], [0.79, 0.91],
            [0.87, 0.97],
          ],
          opacity: 0.54,
          lift: 0.28,
          blurScale: 1.18,
        },
        {
          ridge: [
            [-0.154, 0.97], [-0.084, 0.57], [-0.004, 0.27], [0.076, 0.15],
            [0.156, 0.17], [0.246, 0.25], [0.336, 0.41], [0.426, 0.6],
            [0.526, 0.78], [0.626, 0.95], [0.716, 1.04],
          ],
          opacity: 1,
          lift: 0,
          blurScale: 1,
        },
      ],
      highlight: [137, 138, 147],
      shadow: [96, 105, 118],
      blur: 12,
      fadeStart: 0.58,
    },
    middle: {
      masses: [
        {
          ridge: [
            [0.57, 0.97], [0.65, 0.76], [0.74, 0.6], [0.83, 0.56],
            [0.92, 0.64], [1.01, 0.79], [1.09, 0.96],
          ],
          opacity: 0.23,
          lift: 0.56,
          blurScale: 1.3,
        },
        {
          ridge: [
            [0.23, 0.97], [0.31, 0.71], [0.4, 0.52], [0.49, 0.45],
            [0.58, 0.49], [0.67, 0.62], [0.76, 0.8], [0.85, 0.96],
          ],
          opacity: 0.56,
          lift: 0.3,
          blurScale: 1.15,
        },
        {
          ridge: [
            [-0.1, 0.94], [-0.02, 0.59], [0.07, 0.36], [0.15, 0.28],
            [0.24, 0.32], [0.33, 0.44], [0.42, 0.62], [0.52, 0.8],
            [0.62, 0.96],
          ],
          opacity: 0.9,
          lift: 0.08,
          blurScale: 1,
        },
      ],
      highlight: [160, 160, 168],
      shadow: [100, 112, 125],
      blur: 8,
      fadeStart: 0.66,
    },
    near: {
      masses: [
        {
          ridge: [
            [0.62, 0.97], [0.7, 0.77], [0.78, 0.62], [0.86, 0.59],
            [0.94, 0.68], [1.02, 0.82], [1.09, 0.97],
          ],
          opacity: 0.2,
          lift: 0.58,
          blurScale: 1.28,
        },
        {
          ridge: [
            [0.24, 0.97], [0.32, 0.7], [0.41, 0.53], [0.5, 0.47],
            [0.59, 0.52], [0.68, 0.66], [0.77, 0.83], [0.86, 0.97],
          ],
          opacity: 0.5,
          lift: 0.32,
          blurScale: 1.12,
        },
        {
          ridge: [
            [-0.1, 0.96], [-0.02, 0.67], [0.06, 0.47], [0.14, 0.39],
            [0.22, 0.43], [0.31, 0.56], [0.4, 0.72], [0.5, 0.88],
            [0.59, 0.97],
          ],
          opacity: 0.84,
          lift: 0.1,
          blurScale: 1,
        },
      ],
      highlight: [145, 147, 155],
      shadow: [84, 98, 111],
      blur: 6,
      fadeStart: 0.74,
    },
  };
  const profile = profiles[kind];

  for (const mass of profile.masses) {
    context.save();
    context.globalAlpha = mass.opacity;
    context.filter = `blur(${profile.blur * mass.blurScale}px)`;
    context.beginPath();
    const first = mass.ridge[0];
    context.moveTo(first[0] * width, height + profile.blur * 2);
    context.lineTo(first[0] * width, first[1] * height);
    for (let index = 1; index < mass.ridge.length - 1; index += 1) {
      const point = mass.ridge[index];
      const next = mass.ridge[index + 1];
      context.quadraticCurveTo(
        point[0] * width,
        point[1] * height,
        (point[0] + next[0]) * width * 0.5,
        (point[1] + next[1]) * height * 0.5,
      );
    }
    const last = mass.ridge[mass.ridge.length - 1];
    context.lineTo(last[0] * width, last[1] * height);
    context.lineTo(last[0] * width, height + profile.blur * 2);
    context.closePath();
    const highlight = mixRgb(profile.highlight, [247, 247, 249], mass.lift);
    const shadow = mixRgb(profile.shadow, [225, 226, 231], mass.lift);
    const fill = context.createLinearGradient(0, height * 0.12, 0, height);
    fill.addColorStop(0, rgba(highlight, 0.72));
    fill.addColorStop(0.48, rgba(mixRgb(highlight, shadow, 0.58), 0.9));
    fill.addColorStop(1, rgba(shadow, 0.96));
    context.fillStyle = fill;
    context.fill();
    context.restore();
  }

  context.save();
  context.globalCompositeOperation = 'source-atop';
  context.filter = `blur(${profile.blur * 2}px)`;
  const random = createSeededRandom(kind === 'far' ? 8573 : kind === 'middle' ? 9257 : 10103);
  for (let index = 0; index < 5; index += 1) {
    const x = width * (0.12 + random() * 0.58);
    const y = height * (0.4 + random() * 0.36);
    const radius = width * (0.12 + random() * 0.1);
    const mist = context.createRadialGradient(x, y, 0, x, y, radius);
    mist.addColorStop(0, 'rgba(247,248,252,0.2)');
    mist.addColorStop(1, 'rgba(247,248,252,0)');
    context.fillStyle = mist;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = 'destination-in';
  const rightFade = context.createLinearGradient(0, 0, width, 0);
  rightFade.addColorStop(0, 'rgba(255,255,255,1)');
  rightFade.addColorStop(profile.fadeStart, 'rgba(255,255,255,0.98)');
  rightFade.addColorStop(0.86, 'rgba(255,255,255,0.28)');
  rightFade.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = rightFade;
  context.fillRect(0, 0, width, height);
  context.restore();
  return canvas;
}

function createRiverSprite() {
  const width = 720;
  const height = 620;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.save();
  context.filter = 'blur(8px)';
  context.beginPath();
  context.moveTo(width * 0.72, height * 0.04);
  context.bezierCurveTo(
    width * 0.69,
    height * 0.2,
    width * 0.63,
    height * 0.35,
    width * 0.56,
    height * 0.45,
  );
  context.bezierCurveTo(
    width * 0.47,
    height * 0.58,
    width * 0.32,
    height * 0.76,
    width * 0.12,
    height * 1.04,
  );
  context.lineTo(width * 0.52, height * 1.04);
  context.bezierCurveTo(
    width * 0.58,
    height * 0.84,
    width * 0.64,
    height * 0.7,
    width * 0.66,
    height * 0.55,
  );
  context.bezierCurveTo(
    width * 0.68,
    height * 0.38,
    width * 0.76,
    height * 0.2,
    width * 0.78,
    height * 0.04,
  );
  context.closePath();
  const river = context.createLinearGradient(0, 0, width * 0.1, height);
  river.addColorStop(0, rgba(RIVER_REFLECTION, 0.5));
  river.addColorStop(0.38, rgba(RIVER_BLUE_GREY, 0.78));
  river.addColorStop(1, rgba(RIVER_SAGE, 0.68));
  context.fillStyle = river;
  context.fill();
  context.restore();

  context.save();
  context.filter = 'blur(3px)';
  context.beginPath();
  context.moveTo(width * 0.745, height * 0.055);
  context.bezierCurveTo(
    width * 0.71,
    height * 0.24,
    width * 0.64,
    height * 0.4,
    width * 0.59,
    height * 0.5,
  );
  context.bezierCurveTo(
    width * 0.51,
    height * 0.64,
    width * 0.4,
    height * 0.8,
    width * 0.27,
    height * 1.03,
  );
  context.lineTo(width * 0.42, height * 1.03);
  context.bezierCurveTo(
    width * 0.48,
    height * 0.84,
    width * 0.57,
    height * 0.66,
    width * 0.62,
    height * 0.54,
  );
  context.bezierCurveTo(
    width * 0.67,
    height * 0.4,
    width * 0.74,
    height * 0.22,
    width * 0.765,
    height * 0.055,
  );
  context.closePath();
  const reflection = context.createLinearGradient(0, 0, width * 0.12, height);
  reflection.addColorStop(0, rgba(RIVER_REFLECTION, 0.48));
  reflection.addColorStop(0.48, rgba(RIVER_BLUE_GREY, 0.34));
  reflection.addColorStop(1, rgba(RIVER_REFLECTION, 0.12));
  context.fillStyle = reflection;
  context.fill();
  context.restore();

  context.save();
  context.globalCompositeOperation = 'destination-in';
  const fade = context.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, 'rgba(255,255,255,0)');
  fade.addColorStop(0.08, 'rgba(255,255,255,0.82)');
  fade.addColorStop(0.22, 'rgba(255,255,255,1)');
  fade.addColorStop(1, 'rgba(255,255,255,1)');
  context.fillStyle = fade;
  context.fillRect(0, 0, width, height);
  context.restore();
  return canvas;
}

function createAtmosphericSprites(): AtmosphericSprites {
  return {
    clouds: {
      farA: createCloudSprite('far', 1051),
      farB: createCloudSprite('far', 2083),
      middleA: createCloudSprite('middle', 3187),
      middleB: createCloudSprite('middle', 4211),
      foreground: createCloudSprite('foreground', 5279),
    },
    cyanHaze: createHazeSprite(SKY_CYAN, 6311),
    lavenderHaze: createHazeSprite(SKY_LAVENDER, 7411),
    distantHills: {
      far: createDistantHillSprite('far'),
      middle: createDistantHillSprite('middle'),
      near: createDistantHillSprite('near'),
    },
    river: createRiverSprite(),
    sun: createSunSprite(),
  };
}

let atmosphericSpriteCache: AtmosphericSprites | null = null;

function getAtmosphericSprites() {
  atmosphericSpriteCache ??= createAtmosphericSprites();
  return atmosphericSpriteCache;
}

function prewarmLightModeRenderer() {
  getAtmosphericSprites();
}

registerRendererPrewarmer('light', prewarmLightModeRenderer);

function getCloudWidth(sceneWidth: number, compact: boolean, spec: CloudSpec) {
  if (spec.layer === 'far') {
    return clamp(sceneWidth * spec.width, compact ? 150 : 190, compact ? 280 : 480);
  }
  if (spec.layer === 'middle') {
    return clamp(sceneWidth * spec.width, compact ? 210 : 300, compact ? 380 : 680);
  }
  return clamp(sceneWidth * spec.width, compact ? 380 : 620, compact ? 560 : 1040);
}

function createClouds(
  width: number,
  height: number,
  compact: boolean,
  sprites: CloudSprites,
) {
  const specs = compact ? COMPACT_CLOUD_SPECS : DESKTOP_CLOUD_SPECS;
  return specs.map((spec, index): Cloud => {
    const cloudWidth = getCloudWidth(width, compact, spec);
    const depthProfile = spec.layer === 'far'
      ? LIGHT_DEPTH_PROFILES.farCloud
      : spec.layer === 'middle'
        ? LIGHT_DEPTH_PROFILES.middleCloud
        : LIGHT_DEPTH_PROFILES.foregroundMist;
    return {
      x: width * spec.x,
      y: height * spec.y,
      width: cloudWidth,
      height: cloudWidth / spec.aspect,
      depthProfile,
      speed: spec.speed,
      direction: spec.direction,
      phase: index * 1.73 + 0.41,
      opacity: spec.opacity,
      layer: spec.layer,
      sprite: sprites[spec.sprite],
    };
  });
}

function createHazeLayers(
  width: number,
  height: number,
  sprites: AtmosphericSprites,
): HazeLayer[] {
  const shortSide = Math.min(width, height);
  return [
    {
      x: width * 0.2,
      y: height * 0.31,
      width: Math.max(width * 0.7, shortSide * 0.8),
      height: Math.max(height * 0.48, shortSide * 0.52),
      depthProfile: LIGHT_DEPTH_PROFILES.farHaze,
      phase: 0.7,
      driftX: width * 0.012,
      driftY: height * 0.01,
      opacity: 0.44,
      layer: 'far',
      sprite: sprites.cyanHaze,
    },
    {
      x: width * 0.79,
      y: height * 0.48,
      width: Math.max(width * 0.62, shortSide * 0.72),
      height: Math.max(height * 0.55, shortSide * 0.58),
      depthProfile: LIGHT_DEPTH_PROFILES.middleHaze,
      phase: 2.3,
      driftX: width * 0.018,
      driftY: height * 0.014,
      opacity: 0.38,
      layer: 'middle',
      sprite: sprites.lavenderHaze,
    },
    {
      x: width * 0.14,
      y: height * 0.86,
      width: Math.max(width * 0.86, shortSide),
      height: Math.max(height * 0.44, shortSide * 0.5),
      depthProfile: LIGHT_DEPTH_PROFILES.nearHaze,
      phase: 4.8,
      driftX: width * 0.021,
      driftY: height * 0.017,
      opacity: 0.3,
      layer: 'near',
      sprite: sprites.cyanHaze,
    },
  ];
}

function createDistantHills(
  width: number,
  height: number,
  compact: boolean,
  sprites: DistantHillSprites,
): DistantHillLayer[] {
  const hillWidth = Math.max(
    width * (compact ? 1.72 : 1.3),
    height * (compact ? 0.94 : 1.12),
  );
  const centerX = width * (compact ? 0.82 : 0.58);
  return [
    {
      x: centerX,
      y: height * (compact ? 0.64 : 0.6),
      width: hillWidth,
      height: height * (compact ? 0.7 : 0.8),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.43,
      sprite: sprites.far,
    },
    {
      x: centerX - width * 0.015,
      y: height * (compact ? 0.67 : 0.64),
      width: hillWidth * 1.02,
      height: height * (compact ? 0.62 : 0.7),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.24,
      sprite: sprites.middle,
    },
    {
      x: centerX - width * 0.035,
      y: height * (compact ? 0.7 : 0.68),
      width: hillWidth * 1.04,
      height: height * (compact ? 0.58 : 0.62),
      depthProfile: LIGHT_DEPTH_PROFILES.distantHill,
      opacity: 0.26,
      sprite: sprites.near,
    },
  ];
}

function createRiver(
  width: number,
  height: number,
  compact: boolean,
  sprite: HTMLCanvasElement,
): RiverState {
  return {
    x: width * (compact ? 0.35 : 0.335),
    y: height * (compact ? 0.86 : 0.855),
    width: width * (compact ? 0.55 : 0.42),
    height: height * (compact ? 0.28 : 0.33),
    depthProfile: LIGHT_DEPTH_PROFILES.river,
    opacity: compact ? 0.44 : 0.48,
    sprite,
  };
}

function createParticles(width: number, height: number, compact: boolean) {
  const count = compact ? 26 : 48;
  const random = createSeededRandom(compact ? 8111 : 9011);
  return Array.from({ length: count }, (_, index): AtmosphericParticle => {
    const x = random() * width;
    const y = random() * height;
    const size = (compact ? 0.45 : 0.55) + random() * (compact ? 1.05 : 1.35);
    const depthMix = random();
    return {
      x,
      y,
      size,
      depthProfile: {
        translation: PARTICLE_DEPTH_RANGE.translation[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.translation[1] - PARTICLE_DEPTH_RANGE.translation[0]),
        perspective: PARTICLE_DEPTH_RANGE.perspective[0]
          + depthMix
          * (PARTICLE_DEPTH_RANGE.perspective[1] - PARTICLE_DEPTH_RANGE.perspective[0]),
        tilt: 0,
      },
      phase: random() * TAU + index * 0.19,
      drift: 2 + random() * 7,
      speed: 0.55 + random() * 2.1,
      colorIndex: Math.floor(random() * 3),
    };
  });
}

function createScene(
  width: number,
  height: number,
  coarsePointer: boolean,
  sprites: AtmosphericSprites,
): AtmosphericScene {
  const compact = width < 720 || height < 560;
  const shortSide = Math.min(width, height);
  return {
    width,
    height,
    compact,
    motionScale: compact || coarsePointer ? 0.68 : 1,
    sun: {
      x: width * 0.91,
      y: compact ? Math.max(height * 0.2, 120) : height * 0.17,
      radius: shortSide * 0.018,
      glowRadius: shortSide * (compact ? 0.36 : 0.43),
    },
    clouds: createClouds(width, height, compact, sprites.clouds),
    haze: createHazeLayers(width, height, sprites),
    distantHills: createDistantHills(width, height, compact, sprites.distantHills),
    river: createRiver(width, height, compact, sprites.river),
    particles: createParticles(width, height, compact),
    projection: { x: 0, y: 0, scale: 1, alphaScale: 1 },
  };
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
  scene: AtmosphericScene,
  positionX: number,
  positionY: number,
): ParallaxFrame {
  const clampedX = clamp(positionX, -1, 1);
  const clampedY = clamp(positionY, -1, 1);
  return {
    positionX: clampedX,
    positionY: clampedY,
    maximumOffsetX: clamp(scene.width * 0.025, 15, 34) * scene.motionScale,
    maximumOffsetY: clamp(scene.height * 0.019, 10, 22) * scene.motionScale,
    maximumPitch: 7 * DEGREE * scene.motionScale,
    maximumYaw: 10 * DEGREE * scene.motionScale,
    maximumPerspectiveScale: 0.05 * scene.motionScale,
    centerX: scene.width * 0.5,
    centerY: scene.height * 0.5,
    inverseHalfWidth: 2 / Math.max(scene.width, 1),
    inverseHalfHeight: 2 / Math.max(scene.height, 1),
    cursorNormalization: 1 / Math.max(1, Math.abs(clampedX) + Math.abs(clampedY)),
  };
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
) {
  const normalizedX = clamp((x - parallax.centerX) * parallax.inverseHalfWidth, -1.2, 1.2);
  const normalizedY = clamp((y - parallax.centerY) * parallax.inverseHalfHeight, -1.2, 1.2);
  const cursorSide = clamp(
    (normalizedX * parallax.positionX + normalizedY * parallax.positionY)
      * parallax.cursorNormalization,
    -1,
    1,
  );
  const response = cursorSide * clamp(depthProfile.perspective, 0, 1);
  const scale = clamp(1 - response * parallax.maximumPerspectiveScale, 0.94, 1.06);
  output.x = parallax.centerX
    + (x - parallax.centerX) * scale
    + getParallaxOffsetX(parallax, depthProfile.translation);
  output.y = parallax.centerY
    + (y - parallax.centerY) * scale
    + getParallaxOffsetY(parallax, depthProfile.translation);
  output.scale = scale;
  output.alphaScale = clamp(1 - response * 0.09, 0.94, 1.06);
}

function drawDepthImage(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
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
  projectAtDepth(
    parallax,
    x,
    y,
    depthProfile,
    scene.projection,
  );
  const response = clamp(depthProfile.tilt, 0, 1);
  const pitch = -parallax.positionY * parallax.maximumPitch * response;
  const yaw = parallax.positionX * parallax.maximumYaw * response;
  context.save();
  context.translate(scene.projection.x, scene.projection.y);
  context.transform(1, Math.sin(pitch) * 0.11, Math.sin(yaw) * 0.085, 1, 0, 0);
  context.rotate(rotation + (yaw - pitch) * 0.025);
  context.scale(scene.projection.scale, scene.projection.scale);
  context.globalAlpha = opacity * scene.projection.alphaScale;
  context.drawImage(image, -width * 0.5, -height * 0.5, width, height);
  context.restore();
}

function drawSky(context: CanvasRenderingContext2D, scene: AtmosphericScene) {
  const sky = context.createLinearGradient(0, 0, 0, scene.height);
  sky.addColorStop(0, '#d8ecfc');
  sky.addColorStop(0.44, '#eaf5fd');
  sky.addColorStop(0.76, '#f5f9fb');
  sky.addColorStop(1, '#fff5e8');
  context.fillStyle = sky;
  context.fillRect(0, 0, scene.width, scene.height);
}

function drawAtmosphericWash(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  const shortSide = Math.min(scene.width, scene.height);
  const rightGlowColor = mixRgb(
    mixRgb(WARM_RIGHT_GLOW, activeColor, 0.4),
    [255, 255, 255],
    0.35,
  );
  const rightGlowX = scene.width * 1.02
    + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const rightGlowY = scene.height * 0.38
    + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const rightGlowRadius = Math.max(scene.width * 0.6, scene.height * 0.72);
  const rightGlow = context.createRadialGradient(
    rightGlowX,
    rightGlowY,
    0,
    rightGlowX,
    rightGlowY,
    rightGlowRadius,
  );
  rightGlow.addColorStop(0, rgba(rightGlowColor, 0.11));
  rightGlow.addColorStop(0.5, rgba(rightGlowColor, 0.045));
  rightGlow.addColorStop(1, rgba(rightGlowColor, 0));
  context.fillStyle = rightGlow;
  context.fillRect(0, 0, scene.width, scene.height);

  const lowerRightX = scene.width * 0.98
    + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const lowerRightY = scene.height * 0.94
    + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const lowerRight = context.createRadialGradient(
    lowerRightX,
    lowerRightY,
    0,
    lowerRightX,
    lowerRightY,
    shortSide * 0.76,
  );
  lowerRight.addColorStop(0, rgba(rightGlowColor, 0.052));
  lowerRight.addColorStop(1, rgba(rightGlowColor, 0));
  context.fillStyle = lowerRight;
  context.fillRect(0, 0, scene.width, scene.height);

  const accentX = scene.width * 0.08
    + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.middleHaze.translation);
  const accentY = scene.height * 0.69
    + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.middleHaze.translation);
  const accent = context.createRadialGradient(accentX, accentY, 0, accentX, accentY, shortSide * 0.86);
  accent.addColorStop(0, rgba(activeColor, 0.085));
  accent.addColorStop(0.48, rgba(activeColor, 0.035));
  accent.addColorStop(1, rgba(activeColor, 0));
  context.fillStyle = accent;
  context.fillRect(0, 0, scene.width, scene.height);

  const coolX = scene.width * 0.72
    + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const coolY = scene.height * 0.44
    + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const cool = context.createRadialGradient(coolX, coolY, 0, coolX, coolY, shortSide * 0.72);
  cool.addColorStop(0, rgba(SKY_LAVENDER, 0.055));
  cool.addColorStop(1, rgba(SKY_LAVENDER, 0));
  context.fillStyle = cool;
  context.fillRect(0, 0, scene.width, scene.height);
}

function drawSun(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: AtmosphericSprites,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  projectAtDepth(
    parallax,
    scene.sun.x,
    scene.sun.y,
    LIGHT_DEPTH_PROFILES.sun,
    scene.projection,
  );
  const accent = context.createRadialGradient(
    scene.projection.x,
    scene.projection.y,
    scene.sun.radius,
    scene.projection.x,
    scene.projection.y,
    scene.sun.glowRadius * 1.12,
  );
  accent.addColorStop(0, rgba(activeColor, 0.038));
  accent.addColorStop(0.58, rgba(activeColor, 0.012));
  accent.addColorStop(1, rgba(activeColor, 0));
  context.fillStyle = accent;
  context.fillRect(0, 0, scene.width, scene.height);

  const diameter = scene.sun.glowRadius * 2;
  drawDepthImage(
    context,
    scene,
    sprites.sun,
    scene.sun.x,
    scene.sun.y,
    diameter,
    diameter,
    LIGHT_DEPTH_PROFILES.sun,
    0.92,
    parallax,
  );
}

function drawHaze(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  layer: HazeLayerKind,
  parallax: ParallaxFrame,
) {
  for (const haze of scene.haze) {
    if (haze.layer !== layer) continue;
    const x = haze.x + Math.sin(time * 0.000025 + haze.phase) * haze.driftX;
    const y = haze.y + Math.cos(time * 0.000021 + haze.phase) * haze.driftY;
    const pulse = 0.96 + Math.sin(time * 0.000039 + haze.phase * 1.7) * 0.04;
    drawDepthImage(
      context,
      scene,
      haze.sprite,
      x,
      y,
      haze.width,
      haze.height,
      haze.depthProfile,
      haze.opacity * pulse,
      parallax,
    );
  }
}

function drawDistantHills(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  parallax: ParallaxFrame,
) {
  for (const hill of scene.distantHills) {
    drawDepthImage(
      context,
      scene,
      hill.sprite,
      hill.x,
      hill.y,
      hill.width,
      hill.height,
      hill.depthProfile,
      hill.opacity,
      parallax,
    );
  }
}

function drawRiver(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  parallax: ParallaxFrame,
) {
  drawDepthImage(
    context,
    scene,
    scene.river.sprite,
    scene.river.x,
    scene.river.y,
    scene.river.width,
    scene.river.height,
    scene.river.depthProfile,
    scene.river.opacity,
    parallax,
  );
}

function drawRiverGlow(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  parallax: ParallaxFrame,
) {
  projectAtDepth(
    parallax,
    scene.width * 0.66,
    scene.height * 0.81,
    LIGHT_DEPTH_PROFILES.river,
    scene.projection,
  );
  const radius = Math.min(scene.width, scene.height) * 0.4;
  context.save();
  context.translate(scene.projection.x, scene.projection.y);
  context.scale(scene.compact ? 2.2 : 3.25, scene.compact ? 0.85 : 0.72);
  const riverGlowColor = mixRgb(RIVER_BLUE_GREY, SKY_CYAN, 0.72);
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  glow.addColorStop(0, rgba(riverGlowColor, 0.32 * scene.projection.alphaScale));
  glow.addColorStop(0.46, rgba(riverGlowColor, 0.16 * scene.projection.alphaScale));
  glow.addColorStop(0.78, rgba(riverGlowColor, 0.055 * scene.projection.alphaScale));
  glow.addColorStop(1, rgba(riverGlowColor, 0));
  context.fillStyle = glow;
  context.fillRect(-radius, -radius, radius * 2, radius * 2);
  context.restore();
}

function getCloudX(scene: AtmosphericScene, cloud: Cloud, time: number) {
  const margin = 120;
  const minimum = -cloud.width * 0.5 - margin;
  const span = scene.width + cloud.width + margin * 2;
  const travel = cloud.direction * cloud.speed * time * 0.001;
  return minimum + positiveModulo(cloud.x - minimum + travel, span);
}

function drawClouds(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  layer: CloudLayerKind,
  parallax: ParallaxFrame,
) {
  for (const cloud of scene.clouds) {
    if (cloud.layer !== layer) continue;
    const x = getCloudX(scene, cloud, time);
    const y = cloud.y + Math.sin(time * 0.00007 + cloud.phase) * scene.height * 0.006;
    const rotation = Math.sin(time * 0.000031 + cloud.phase) * 0.008;
    drawDepthImage(
      context,
      scene,
      cloud.sprite,
      x,
      y,
      cloud.width,
      cloud.height,
      cloud.depthProfile,
      cloud.opacity,
      parallax,
      rotation,
    );
  }
}

function drawParticles(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  time: number,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  const margin = 24;
  const span = scene.width + margin * 2;
  for (const particle of scene.particles) {
    const x = -margin + positiveModulo(
      particle.x + margin + particle.speed * time * 0.001
        + Math.sin(time * 0.00013 + particle.phase) * particle.drift,
      span,
    );
    const y = particle.y + Math.cos(time * 0.00011 + particle.phase) * particle.drift * 0.6;
    projectAtDepth(
      parallax,
      x,
      y,
      particle.depthProfile,
      scene.projection,
    );
    const shimmer = 0.68 + Math.sin(time * 0.0011 + particle.phase) * 0.2;
    const baseColor = particle.colorIndex === 0
      ? WARM_PARTICLE
      : particle.colorIndex === 1
        ? COOL_PARTICLE
        : mixRgb(COOL_PARTICLE, activeColor, 0.18);
    const size = particle.size * scene.projection.scale;
    context.fillStyle = rgba(baseColor, 0.12 * shimmer * scene.projection.alphaScale);
    context.beginPath();
    context.arc(scene.projection.x, scene.projection.y, size * 2.5, 0, TAU);
    context.fill();
    context.fillStyle = rgba(baseColor, 0.38 * shimmer * scene.projection.alphaScale);
    context.beginPath();
    context.ellipse(scene.projection.x, scene.projection.y, size * 0.65, size, 0, 0, TAU);
    context.fill();
  }
}

function drawEdgeGlow(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  const shortSide = Math.min(scene.width, scene.height);
  const x = getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.nearHaze.translation);
  const y = scene.height
    + getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.nearHaze.translation);
  const lower = context.createRadialGradient(x, y, 0, x, y, shortSide * 0.9);
  lower.addColorStop(0, rgba(activeColor, 0.06));
  lower.addColorStop(0.62, rgba(activeColor, 0.02));
  lower.addColorStop(1, rgba(activeColor, 0));
  context.fillStyle = lower;
  context.fillRect(0, 0, scene.width, scene.height);

  const upperX = scene.width
    + getParallaxOffsetX(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const upperY = getParallaxOffsetY(parallax, LIGHT_DEPTH_PROFILES.farHaze.translation);
  const upper = context.createRadialGradient(
    upperX,
    upperY,
    0,
    upperX,
    upperY,
    shortSide * 0.72,
  );
  upper.addColorStop(0, rgba(SKY_CYAN, 0.045));
  upper.addColorStop(1, rgba(SKY_CYAN, 0));
  context.fillStyle = upper;
  context.fillRect(0, 0, scene.width, scene.height);
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: AtmosphericScene,
  sprites: AtmosphericSprites,
  time: number,
  activeColor: Rgb,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  drawSky(context, scene);
  drawAtmosphericWash(context, scene, activeColor, parallax);
  drawSun(context, scene, sprites, activeColor, parallax);
  drawHaze(context, scene, motionTime, 'far', parallax);
  drawClouds(context, scene, motionTime, 'far', parallax);
  drawDistantHills(context, scene, parallax);
  drawRiver(context, scene, parallax);
  drawHaze(context, scene, motionTime, 'middle', parallax);
  drawRiverGlow(context, scene, parallax);
  drawClouds(context, scene, motionTime, 'middle', parallax);
  drawParticles(context, scene, motionTime, activeColor, parallax);
  drawHaze(context, scene, motionTime, 'near', parallax);
  drawClouds(context, scene, motionTime, 'foreground', parallax);
  drawEdgeGlow(context, scene, activeColor, parallax);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
}

export default function RenderLightMode({
  activeColor,
  session,
  deviceOrientationSession,
}: RenderLightModeProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetColorRef = useRef<Rgb>([...DEFAULT_ACTIVE_COLOR]);
  const redrawStaticSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetColorRef.current = resolveActiveColor(activeColor);
    redrawStaticSceneRef.current?.();
  }, [activeColor]);

  useEffect(() => {
    const background = backgroundRef.current;
    const canvas = canvasRef.current;
    if (!background || !canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const sprites = getAtmosphericSprites();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const parallaxPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const deviceOrientationConstructor = (
      window as typeof window & { DeviceOrientationEvent?: DeviceOrientationEventConstructor }
    ).DeviceOrientationEvent;
    const snapshotCandidate = session.readSnapshot();
    const restoredSnapshot = snapshotCandidate
      && snapshotCandidate.version === RENDERER_SNAPSHOT_VERSION
      && Number.isFinite(snapshotCandidate.capturedAtMs)
      && Number.isFinite(snapshotCandidate.sceneTimeMs)
      && snapshotCandidate.sceneTimeMs >= 0
      && Number.isFinite(snapshotCandidate.color.transitionElapsedMs)
      && snapshotCandidate.color.transitionElapsedMs >= 0
      && isRendererRgbSnapshot(snapshotCandidate.color.current)
      && isRendererRgbSnapshot(snapshotCandidate.color.from)
      && isRendererRgbSnapshot(snapshotCandidate.color.target)
      && isRendererCameraSnapshot(snapshotCandidate.camera)
      ? snapshotCandidate
      : null;
    const restoreTimestamp = Date.now();
    const inactiveElapsed = restoredSnapshot
      ? Math.max(0, restoreTimestamp - restoredSnapshot.capturedAtMs)
      : 0;
    const restoreRgb = (color: readonly number[]): Rgb => [
      clamp(color[0], 0, 255),
      clamp(color[1], 0, 255),
      clamp(color[2], 0, 255),
    ];
    const restoredTransitionElapsed = restoredSnapshot
      ? clamp(
          restoredSnapshot.color.transitionElapsedMs + inactiveElapsed,
          0,
          SECTION_COLOR_DURATION_MS,
        )
      : 0;
    const restoredTransitionProgress = restoredTransitionElapsed
      / SECTION_COLOR_DURATION_MS;
    const restoredTransitionEase = 1 - (1 - restoredTransitionProgress) ** 3;
    const restoredFromColor = restoredSnapshot
      ? restoreRgb(restoredSnapshot.color.from)
      : [...targetColorRef.current] as Rgb;
    const restoredTargetColor = restoredSnapshot
      ? restoreRgb(restoredSnapshot.color.target)
      : [...targetColorRef.current] as Rgb;
    const caughtUpColor: Rgb = restoredSnapshot
      ? [
          restoredFromColor[0]
            + (restoredTargetColor[0] - restoredFromColor[0]) * restoredTransitionEase,
          restoredFromColor[1]
            + (restoredTargetColor[1] - restoredFromColor[1]) * restoredTransitionEase,
          restoredFromColor[2]
            + (restoredTargetColor[2] - restoredFromColor[2]) * restoredTransitionEase,
        ]
      : [...targetColorRef.current] as Rgb;
    const restoredTargetIsCurrent = restoredSnapshot
      && targetColorRef.current.every(
        (channel, index) => Math.abs(channel - restoredTargetColor[index]) <= 0.01,
      );
    let disposed = false;
    let scene: AtmosphericScene | null = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let resizePendingWhileHidden = false;
    let lastPaintTime = 0;
    let previousTime = performance.now();
    let sceneTime = restoredSnapshot
      ? restoredSnapshot.sceneTimeMs + inactiveElapsed
      : 0;
    let reducedMotion = motionPreference.matches;
    const canRestorePointerCamera = !reducedMotion && parallaxPointer.matches;
    const canRestoreTiltCamera = !reducedMotion
      && coarsePointer.matches
      && !parallaxPointer.matches;
    let targetParallaxX = canRestorePointerCamera && restoredSnapshot
      ? clamp(restoredSnapshot.camera.targetX, -1, 1)
      : 0;
    let targetParallaxY = canRestorePointerCamera && restoredSnapshot
      ? clamp(restoredSnapshot.camera.targetY, -1, 1)
      : 0;
    let currentParallaxX = (canRestorePointerCamera || canRestoreTiltCamera)
      && restoredSnapshot
      ? clamp(restoredSnapshot.camera.currentX, -1, 1)
      : 0;
    let currentParallaxY = (canRestorePointerCamera || canRestoreTiltCamera)
      && restoredSnapshot
      ? clamp(restoredSnapshot.camera.currentY, -1, 1)
      : 0;
    let deviceTiltListening = false;
    let deviceTiltBaselineX: number | null = null;
    let deviceTiltBaselineY: number | null = null;
    let tiltPermissionGestureArmed = false;
    let observedPermissionRequest: Promise<'granted' | 'denied'> | null = null;
    const sharedOrientationStatus = deviceOrientationSession.getStatus();
    let deviceOrientationPermission: DeviceOrientationPermissionState =
      !deviceOrientationConstructor
        ? 'unavailable'
        : typeof deviceOrientationConstructor.requestPermission === 'function'
          ? sharedOrientationStatus === 'granted'
            || sharedOrientationStatus === 'denied'
            || sharedOrientationStatus === 'requesting'
            ? sharedOrientationStatus
            : 'prompt'
          : 'granted';
    const currentColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : caughtUpColor;
    const transitionFromColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : restoredTargetIsCurrent
        ? restoredFromColor
        : [...caughtUpColor];
    const transitionTargetColor: Rgb = reducedMotion
      ? [...targetColorRef.current]
      : restoredTargetIsCurrent
        ? restoredTargetColor
        : [...targetColorRef.current];
    let colorTransitionStart = reducedMotion
      ? sceneTime
      : restoredTargetIsCurrent
        ? sceneTime - restoredTransitionElapsed
        : sceneTime;

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
        disposed
        || reducedMotion
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
        disposed
        || deviceTiltListening
        || deviceOrientationPermission !== 'granted'
        || reducedMotion
        || document.hidden
        || parallaxPointer.matches
        || !coarsePointer.matches
      ) {
        return;
      }
      resetDeviceTiltCalibration();
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
      deviceTiltListening = true;
    };

    const stopDeviceTilt = () => {
      if (deviceTiltListening) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        deviceTiltListening = false;
      }
      resetDeviceTiltCalibration();
    };

    const observePermissionRequest = (
      request: Promise<'granted' | 'denied'>,
    ) => {
      if (observedPermissionRequest === request) return;
      observedPermissionRequest = request;
      void request.then((permission) => {
        if (disposed) return;
        deviceOrientationPermission = permission;
        if (permission === 'granted') startDeviceTilt();
      });
    };

    const handleTiltPermissionGesture = () => {
      if (
        disposed
        || deviceOrientationPermission !== 'prompt'
        || !deviceOrientationConstructor?.requestPermission
      ) {
        return;
      }
      tiltPermissionGestureArmed = false;
      window.removeEventListener('pointerdown', handleTiltPermissionGesture);
      deviceOrientationPermission = 'requesting';
      observePermissionRequest(deviceOrientationSession.requestPermission(
        () => deviceOrientationConstructor.requestPermission!(),
      ));
    };

    const armTiltPermissionGesture = () => {
      if (
        disposed
        || tiltPermissionGestureArmed
        || deviceOrientationPermission !== 'prompt'
      ) {
        return;
      }
      window.addEventListener('pointerdown', handleTiltPermissionGesture, { passive: true });
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
      } else if (deviceOrientationPermission === 'requesting') {
        const pendingRequest = deviceOrientationSession.getPendingRequest();
        if (pendingRequest) {
          observePermissionRequest(pendingRequest);
        } else {
          deviceOrientationSession.recoverOrphanedRequest();
          deviceOrientationPermission = 'prompt';
          armTiltPermissionGesture();
        }
      }
    };

    const updateColor = () => {
      const target = targetColorRef.current;
      const targetChanged = target.some(
        (channel, index) => Math.abs(channel - transitionTargetColor[index]) > 0.01,
      );
      if (targetChanged) {
        for (let index = 0; index < 3; index += 1) {
          transitionFromColor[index] = currentColor[index];
          transitionTargetColor[index] = target[index];
        }
        colorTransitionStart = sceneTime;
      }
      if (reducedMotion) {
        for (let index = 0; index < 3; index += 1) currentColor[index] = target[index];
        return;
      }
      const progress = clamp(
        (sceneTime - colorTransitionStart) / SECTION_COLOR_DURATION_MS,
        0,
        1,
      );
      const eased = 1 - (1 - progress) ** 3;
      for (let index = 0; index < 3; index += 1) {
        currentColor[index] = transitionFromColor[index]
          + (transitionTargetColor[index] - transitionFromColor[index]) * eased;
      }
    };

    const paint = (time: number) => {
      if (!scene || disposed || document.hidden) return;
      const elapsed = reducedMotion ? 0 : clamp(time - previousTime, 0, 64);
      previousTime = time;
      if (!reducedMotion) sceneTime += elapsed;
      updateColor();
      if (
        reducedMotion
        || (!parallaxPointer.matches && !deviceTiltListening)
      ) {
        currentParallaxX = 0;
        currentParallaxY = 0;
      } else {
        const ease = 1 - Math.exp(-elapsed / PARALLAX_EASE_MS);
        currentParallaxX += (targetParallaxX - currentParallaxX) * ease;
        currentParallaxY += (targetParallaxY - currentParallaxY) * ease;
      }
      drawScene(
        context,
        scene,
        sprites,
        sceneTime,
        currentColor,
        reducedMotion,
        createParallaxFrame(scene, currentParallaxX, currentParallaxY),
      );
    };

    const animate = (time: number) => {
      if (disposed || reducedMotion || document.hidden) return;
      const frameInterval = coarsePointer.matches || window.innerWidth < 720
        ? 1000 / 30
        : 1000 / 45;
      const sinceLastPaint = time - lastPaintTime;
      if (sinceLastPaint >= frameInterval) {
        lastPaintTime = time - (sinceLastPaint % frameInterval);
        paint(time);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousTime = performance.now();
      lastPaintTime = 0;
      if (disposed || document.hidden) return;
      if (reducedMotion) {
        paint(previousTime);
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      if (disposed) return;
      if (document.hidden) {
        resizePendingWhileHidden = true;
        return;
      }
      resizePendingWhileHidden = false;
      const width = Math.max(1, Math.round(background.clientWidth));
      const height = Math.max(1, Math.round(background.clientHeight));
      const dprLimit = coarsePointer.matches ? 1.25 : 1.5;
      const maxBackingPixels = coarsePointer.matches ? 3_000_000 : 6_000_000;
      const pixelBudgetRatio = Math.sqrt(maxBackingPixels / (width * height));
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit, pixelBudgetRatio);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      scene = createScene(width, height, coarsePointer.matches, sprites);
      paint(performance.now());
    };

    const scheduleResize = () => {
      if (disposed) return;
      if (document.hidden) {
        resizePendingWhileHidden = true;
        return;
      }
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    const resetParallax = () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        reducedMotion
        || document.hidden
        || !parallaxPointer.matches
        || event.pointerType === 'touch'
      ) {
        return;
      }
      targetParallaxX = clamp(event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, -1, 1);
      targetParallaxY = clamp(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1, -1, 1);
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
      resetParallax();
      currentParallaxX = 0;
      currentParallaxY = 0;
      if (reducedMotion) {
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        for (let index = 0; index < 3; index += 1) {
          currentColor[index] = targetColorRef.current[index];
          transitionFromColor[index] = targetColorRef.current[index];
          transitionTargetColor[index] = targetColorRef.current[index];
        }
      }
      configureDeviceTilt();
      startAnimation();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        currentParallaxX = 0;
        currentParallaxY = 0;
        resetParallax();
        disarmTiltPermissionGesture();
        stopDeviceTilt();
        return;
      }
      previousTime = performance.now();
      lastPaintTime = 0;
      const appliedPendingResize = resizePendingWhileHidden;
      if (appliedPendingResize) resize();
      configureDeviceTilt();
      if (!reducedMotion || !appliedPendingResize) startAnimation();
    };

    redrawStaticSceneRef.current = () => {
      if (!reducedMotion || document.hidden || disposed) return;
      for (let index = 0; index < 3; index += 1) {
        currentColor[index] = targetColorRef.current[index];
        transitionFromColor[index] = targetColorRef.current[index];
        transitionTargetColor[index] = targetColorRef.current[index];
      }
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(background);
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
    if (!reducedMotion) startAnimation();

    return () => {
      session.writeSnapshot({
        version: RENDERER_SNAPSHOT_VERSION,
        capturedAtMs: Date.now(),
        sceneTimeMs: Math.max(0, sceneTime),
        color: {
          current: cloneRendererRgb(currentColor),
          from: cloneRendererRgb(transitionFromColor),
          target: cloneRendererRgb(transitionTargetColor),
          transitionElapsedMs: clamp(
            sceneTime - colorTransitionStart,
            0,
            SECTION_COLOR_DURATION_MS,
          ),
        },
        camera: {
          currentX: clamp(currentParallaxX, -1, 1),
          currentY: clamp(currentParallaxY, -1, 1),
          targetX: clamp(targetParallaxX, -1, 1),
          targetY: clamp(targetParallaxY, -1, 1),
        },
      });
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
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
  }, [deviceOrientationSession, session]);

  return (
    <div ref={backgroundRef} className="ambient-background light-atmosphere" aria-hidden="true">
      <canvas ref={canvasRef} className="light-atmosphere-canvas" aria-hidden="true" />
    </div>
  );
}
