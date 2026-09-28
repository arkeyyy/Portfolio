import { useEffect, useRef } from 'react';
import {
  RENDERER_SNAPSHOT_VERSION,
  cloneRendererRgb,
  isRendererCameraSnapshot,
  isRendererRgbSnapshot,
} from '../../background-renderer/session';
import type {
  DarkRendererSnapshot,
  DeviceOrientationSession,
  RendererSession,
} from '../../background-renderer/session';
import { registerRendererPrewarmer } from '../../background-renderer/prewarm';
import type {
  OrbitGeometry,
  ParallaxFrame,
  Rgb,
} from './core/contracts';
import { createCancer, createCancerSprites } from './objects/constellationCancer';
import { createLibra, createLibraSprites } from './objects/constellationLibra';
import {
  drawConstellation,
  drawConstellationCloud,
} from './objects/constellationShared';
import type {
  Constellation,
  ConstellationSprites,
} from './objects/constellationShared';
import { createQuasar, createQuasarSprite, drawQuasar } from './objects/quasar';
import type { Quasar } from './objects/quasar';
import {
  createAuroraSprites,
  drawAuroraBorealis,
} from './objects/auroraBorealis';
import type { AuroraSprites } from './objects/auroraBorealis';
import { drawAtmosphericFogStage } from './objects/atmosphericFog';
import { drawForegroundClouds } from './objects/foregroundClouds';
import {
  createNebulaSprites,
  updateNebulaSpriteTints,
} from './objects/nebulaAssets';
import type { NebulaSprites } from './objects/nebulaAssets';
import { drawNebulaGlow } from './objects/nebulaGlow';
import { createFieldStars, drawFieldStars } from './objects/fieldStars';
import type { FieldStar } from './objects/fieldStars';
import { createGoldStars, drawGoldStars } from './objects/goldStars';
import type { GoldStar } from './objects/goldStars';
import {
  createStarClusters,
  drawStarClusterHighlights,
  drawStarClusterSprites,
} from './objects/starClusters';
import type { StarCluster } from './objects/starClusters';
import type {
  RingParticle,
  SecondaryRingSystem,
} from './objects/cosmicRingShared';
import {
  createMainRingOrbit,
  createMainRingParticles,
  drawMainRingParticles,
  drawMainRingTrails,
} from './objects/mainCosmicRing';
import {
  createInnerCosmicRing,
  drawInnerCosmicRing,
} from './objects/innerCosmicRing';
import {
  createDistantCosmicRing,
  drawDistantCosmicRing,
} from './objects/distantCosmicRing';
import { drawBackgroundWash } from './objects/backgroundWash';
import { EdgeGlows } from './objects/edgeGlows';
import {
  createPlanets,
  drawPlanets,
  getPlanetRenderStates,
} from './objects/planets';
import type { Planet } from './objects/planets';
import {
  createVortex,
  createVortexSprites,
  drawVortex,
} from './objects/centralVortex';
import type { Vortex, VortexSprites } from './objects/centralVortex';
import {
  createDistantCyclone,
  createDistantCycloneSprites,
  drawDistantCyclone,
} from './objects/distantCyclone';
import type {
  DistantCyclone,
  DistantCycloneSprites,
} from './objects/distantCyclone';
import { clamp } from './core/math';
import {
  createParallaxFrame,
  drawAtParallaxDepth,
  drawOnDepthFieldSurface,
  getDepthFieldSurface,
} from './core/parallax';
import {
  COSMIC_RENDER_THEME,
  DEFAULT_ACTIVE_COLOR,
  DEPTH_FIELD_LAYERS,
  PARALLAX_DEPTH,
} from './core/theme';

type Scene = {
  width: number;
  height: number;
  pixelRatio: number;
  compact: boolean;
  stars: FieldStar[];
  goldStars: GoldStar[];
  starClusters: StarCluster[];
  ringParticles: RingParticle[];
  planets: Planet[];
  orbit: OrbitGeometry;
  secondaryRings: {
    distant: SecondaryRingSystem;
    inner: SecondaryRingSystem;
  };
  clouds: NebulaSprites;
  aurora: AuroraSprites;
  quasar: Quasar;
  libra: Constellation;
  cancer: Constellation;
  distantCyclone: DistantCyclone;
  vortex: Vortex;
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

const SECTION_COLOR_EASE_MS = 520;
const PARALLAX_EASE_MS = 260;
const DEVICE_TILT_DEAD_ZONE = 1.25;
const DEVICE_TILT_RANGE_X = 18;
const DEVICE_TILT_RANGE_Y = 22;
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

type DarkModeSpriteBundle = {
  cloudSprites: NebulaSprites;
  auroraSprites: AuroraSprites;
  quasarSprite: HTMLCanvasElement;
  libraSprites: ConstellationSprites;
  cancerSprites: ConstellationSprites;
  vortexSprites: VortexSprites;
  distantCycloneSprites: DistantCycloneSprites;
};

let darkModeSpriteCache: DarkModeSpriteBundle | null = null;

function getDarkModeSpriteBundle(): DarkModeSpriteBundle | null {
  if (darkModeSpriteCache) return darkModeSpriteCache;

  const cloudSprites = createNebulaSprites();
  const auroraSprites = createAuroraSprites();
  const quasarSprite = createQuasarSprite();
  const libraSprites = createLibraSprites();
  const cancerSprites = createCancerSprites();
  const vortexSprites = createVortexSprites();
  const distantCycloneSprites = createDistantCycloneSprites();
  if (
    !cloudSprites
    || !auroraSprites
    || !vortexSprites
    || !distantCycloneSprites
  ) return null;

  darkModeSpriteCache = {
    cloudSprites,
    auroraSprites,
    quasarSprite,
    libraSprites,
    cancerSprites,
    vortexSprites,
    distantCycloneSprites,
  };
  return darkModeSpriteCache;
}

function prewarmDarkModeRenderer() {
  getDarkModeSpriteBundle();
}

registerRendererPrewarmer('dark', prewarmDarkModeRenderer);

function createScene(
  width: number,
  height: number,
  clouds: NebulaSprites,
  aurora: AuroraSprites,
  quasarSprite: HTMLCanvasElement,
  libraSprites: ConstellationSprites,
  cancerSprites: ConstellationSprites,
  vortexSprites: VortexSprites,
  distantCycloneSprites: DistantCycloneSprites,
  pixelRatio: number,
): Scene {
  const compact = width < 720;
  const stars = createFieldStars(width, height, compact);
  const goldStars = createGoldStars(width, height, compact);
  const ringParticles = createMainRingParticles(compact);
  const planets = createPlanets(compact);
  const orbit = createMainRingOrbit(width, height, compact);
  const quasar = createQuasar(width, height, compact, quasarSprite);
  const libra = createLibra(width, height, compact, libraSprites);
  const cancer = createCancer(width, height, compact, cancerSprites);
  const vortex = createVortex(vortexSprites, compact);
  const distantCyclone = createDistantCyclone(distantCycloneSprites);
  const secondaryRings: Scene['secondaryRings'] = {
    distant: createDistantCosmicRing(width, height, compact),
    inner: createInnerCosmicRing(orbit, compact),
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
    libra,
    cancer,
    distantCyclone,
    vortex,
  };
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const renderTheme = COSMIC_RENDER_THEME;
  const planetStates = getPlanetRenderStates(
    scene.planets,
    scene.width,
    scene.height,
    scene.orbit,
    time,
    reducedMotion,
    parallax,
  );
  const mainRingSurface = getDepthFieldSurface(
    parallax,
    scene.orbit.centerX,
    scene.orbit.centerY,
    DEPTH_FIELD_LAYERS.mainRing,
  );
  const distantRingSurface = getDepthFieldSurface(
    parallax,
    scene.secondaryRings.distant.centerX,
    scene.secondaryRings.distant.centerY,
    DEPTH_FIELD_LAYERS.distantRing,
  );
  updateNebulaSpriteTints(scene.clouds, activeColor);
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  drawBackgroundWash(context, scene, activeColor, renderTheme);
  drawConstellationCloud(
    context,
    scene.cancer,
    time,
    renderTheme,
    renderTheme.cancer,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.cancerHaze,
  );
  drawConstellationCloud(
    context,
    scene.libra,
    time,
    renderTheme,
    renderTheme.libra,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.libraHaze,
  );
  drawConstellation(
    context,
    scene.cancer,
    scene.compact,
    time,
    renderTheme,
    renderTheme.cancer,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.cancer,
  );
  drawConstellation(
    context,
    scene.libra,
    scene.compact,
    time,
    renderTheme,
    renderTheme.libra,
    reducedMotion,
    parallax,
    DEPTH_FIELD_LAYERS.libra,
  );
  drawAtmosphericFogStage(
    context,
    scene,
    scene.clouds,
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
    drawQuasar(
      context,
      scene.quasar,
      scene.pixelRatio,
      time,
      renderTheme,
      reducedMotion,
      viewPose,
    );
  });
  drawOnDepthFieldSurface(context, distantRingSurface, () => {
    drawDistantCyclone(
      context,
      scene.distantCyclone,
      scene.secondaryRings.distant,
      scene.compact,
      time,
      renderTheme,
      reducedMotion,
    );
  });
  drawDistantCosmicRing(
    context,
    scene.compact,
    scene.pixelRatio,
    scene.secondaryRings.distant,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawStarClusterSprites(
    context,
    scene.starClusters,
    scene.pixelRatio,
    time,
    renderTheme,
    reducedMotion,
    'far',
    parallax,
  );
  drawFieldStars(
    context,
    scene.stars,
    scene.width,
    scene.height,
    time,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawGoldStars(
    context,
    scene.goldStars,
    scene.width,
    scene.height,
    time,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawAtmosphericFogStage(
    context,
    scene,
    scene.clouds,
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
    drawAuroraBorealis(
      context,
      scene.aurora,
      scene.orbit,
      scene,
      time,
      activeColor,
      renderTheme,
      reducedMotion,
    );
  });
  drawMainRingTrails(
    context,
    scene.compact,
    scene.orbit,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawInnerCosmicRing(
    context,
    scene.compact,
    scene.pixelRatio,
    scene.secondaryRings.inner,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawStarClusterSprites(
    context,
    scene.starClusters,
    scene.pixelRatio,
    time,
    renderTheme,
    reducedMotion,
    'ring',
    parallax,
  );
  drawNebulaGlow(
    context,
    scene,
    scene.clouds,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawOnDepthFieldSurface(context, mainRingSurface, () => {
    drawVortex(
      context,
      scene.vortex,
      scene.secondaryRings.inner,
      scene,
      time,
      activeColor,
      renderTheme,
      reducedMotion,
    );
  });
  drawStarClusterHighlights(
    context,
    scene.starClusters,
    scene.pixelRatio,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    'far',
    parallax,
  );
  drawStarClusterHighlights(
    context,
    scene.starClusters,
    scene.pixelRatio,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    'ring',
    parallax,
  );
  drawMainRingParticles(
    context,
    scene.orbit,
    scene.ringParticles,
    time,
    activeColor,
    renderTheme,
    reducedMotion,
    parallax,
  );
  drawAtmosphericFogStage(
    context,
    scene,
    scene.clouds,
    time,
    renderTheme,
    reducedMotion,
    'near',
    parallax,
  );
  drawForegroundClouds(
    context,
    scene,
    scene.clouds,
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

type RenderDarkModeProps = {
  activeColor: string;
  session: RendererSession<DarkRendererSnapshot>;
  deviceOrientationSession: DeviceOrientationSession;
  onFirstPaint: () => void;
};

export default function RenderDarkMode({
  activeColor,
  session,
  deviceOrientationSession,
  onFirstPaint,
}: RenderDarkModeProps) {
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
    let startupFrame = 0;
    let startupTimer = 0;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const initialize = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const background = canvas?.parentElement;
    if (!canvas || !context || !background) return;
    const sprites = getDarkModeSpriteBundle();
    if (!sprites) return;
    const {
      cloudSprites,
      auroraSprites,
      quasarSprite,
      libraSprites,
      cancerSprites,
      vortexSprites,
      distantCycloneSprites,
    } = sprites;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const parallaxPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const deviceOrientationConstructor = (
      window as typeof window & {
        DeviceOrientationEvent?: DeviceOrientationEventConstructor;
      }
    ).DeviceOrientationEvent;
    const snapshotCandidate = session.readSnapshot();
    const restoredSnapshot = snapshotCandidate
      && snapshotCandidate.version === RENDERER_SNAPSHOT_VERSION
      && Number.isFinite(snapshotCandidate.capturedAtMs)
      && Number.isFinite(snapshotCandidate.sceneTimeMs)
      && snapshotCandidate.sceneTimeMs >= 0
      && isRendererRgbSnapshot(snapshotCandidate.color.current)
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
    const restoredColor = restoredSnapshot
      ? restoreRgb(restoredSnapshot.color.current)
      : [...targetColorRef.current] as Rgb;
    if (restoredSnapshot) {
      const restoredTarget = restoreRgb(restoredSnapshot.color.target);
      const catchUpEase = 1 - Math.exp(-inactiveElapsed / SECTION_COLOR_EASE_MS);
      for (let index = 0; index < 3; index += 1) {
        restoredColor[index] += (restoredTarget[index] - restoredColor[index]) * catchUpEase;
      }
    }
    let scene: Scene | null = null;
    let firstPaintReported = false;
    let animationFrame = 0;
    let resizeFrame = 0;
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
    let styledParallaxX = Number.NaN;
    let styledParallaxY = Number.NaN;
    let disposed = false;
    let resizePendingWhileHidden = false;
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
    const currentColor: Rgb = restoredColor;

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
      if (disposed) return;
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

    const paint = (time: number) => {
      if (!scene || disposed || document.hidden) return;
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
        EdgeGlows.syncDepth(background, parallax);
        styledParallaxX = currentParallaxX;
        styledParallaxY = currentParallaxY;
      }
      drawScene(
        context,
        scene,
        sceneTime,
        currentColor,
        reducedMotion,
        parallax,
      );
      if (!firstPaintReported) {
        firstPaintReported = true;
        onFirstPaint();
      }
    };

    const animate = (time: number) => {
      if (disposed || reducedMotion || document.hidden) return;
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
        libraSprites,
        cancerSprites,
        vortexSprites,
        distantCycloneSprites,
        dpr,
      );
      styledParallaxX = Number.NaN;
      styledParallaxY = Number.NaN;
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
        disposed
        || reducedMotion
        || document.hidden
        || !parallaxPointer.matches
        || event.pointerType === 'touch'
      ) return;
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
      currentColor[0] = targetColorRef.current[0];
      currentColor[1] = targetColorRef.current[1];
      currentColor[2] = targetColorRef.current[2];
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(canvas);
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
          target: cloneRendererRgb(targetColorRef.current),
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
    };
    if (document.documentElement.classList.contains('portfolio-booting')) {
      startupFrame = window.requestAnimationFrame(() => {
        startupTimer = window.setTimeout(() => {
          if (!cancelled) cleanup = initialize();
        }, 0);
      });
    } else {
      cleanup = initialize();
    }
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startupFrame);
      window.clearTimeout(startupTimer);
      cleanup?.();
    };
  }, [deviceOrientationSession, onFirstPaint, session]);

  return (
    <div className="ambient-background" aria-hidden="true">
      <EdgeGlows />
      <canvas ref={canvasRef} className="cosmic-canvas" />
    </div>
  );
}
