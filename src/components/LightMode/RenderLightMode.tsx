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
import type { AdaptiveQuality } from './core/adaptiveQuality';
import {
  QUALITY_PROFILES,
  createAdaptiveQuality,
  recordQualityPaint,
  resetQualityMeasurements,
  updateQualityWeights,
} from './core/adaptiveQuality';
import { resolveActiveColor } from './core/colorCanvas';
import type {
  ParallaxFrame,
  ProjectionViewport,
  Rgb,
} from './core/contracts';
import type { FramePlanes } from './core/framePlanes';
import {
  createFramePlanes,
  disposeFramePlanes,
  preparePlane,
} from './core/framePlanes';
import { clamp, DEGREE } from './core/math';
import { createParallaxFrame } from './core/parallax';
import { DEFAULT_ACTIVE_COLOR } from './core/theme';
import {
  createAtmosphericParticleSprites,
  createParticles,
  drawParticles,
  updateAtmosphericParticleTint,
} from './objects/atmosphericParticles';
import type {
  AtmosphericParticle,
  AtmosphericParticleSprites,
} from './objects/atmosphericParticles';
import {
  createBackgroundWashSprites,
  drawAtmosphericWash,
  drawSky,
} from './objects/backgroundWash';
import type { BackgroundWashSprites } from './objects/backgroundWash';
import {
  createClouds,
  createCloudSprites,
  drawClouds,
} from './objects/clouds';
import type { Cloud, CloudSprites } from './objects/clouds';
import {
  createDistantHills,
  createDistantHillSprites,
  drawDistantHills,
} from './objects/distantHills';
import type {
  DistantHillLayer,
  DistantHillSprites,
} from './objects/distantHills';
import {
  createEdgeGlowSprites,
  drawEdgeGlow,
  drawForegroundGlowTint,
} from './objects/edgeGlows';
import type { EdgeGlowSprites } from './objects/edgeGlows';
import {
  createForegroundTrees,
  createForegroundTreesSprite,
  drawForegroundTrees,
} from './objects/foregroundForest';
import type { ForegroundTreeLine } from './objects/foregroundForest';
import {
  createHazeLayers,
  createHazeSprites,
  drawHaze,
} from './objects/haze';
import type { HazeLayer, HazeSprites } from './objects/haze';
import {
  createRiverGlowSprites,
  drawRiverGlow,
} from './objects/riverGlow';
import type { RiverGlowSprites } from './objects/riverGlow';
import {
  createRiverLightMoteSprites,
  createRiverLightMotes,
  drawRiverLightMotes,
} from './objects/riverLightMotes';
import type {
  RiverLightMote,
  RiverLightMoteSprites,
} from './objects/riverLightMotes';
import {
  createRiverParticleSprites,
  createRiverParticles,
  drawRiverParticles,
} from './objects/riverParticles';
import type {
  RiverParticle,
  RiverParticleSprites,
} from './objects/riverParticles';
import {
  createRisingRiverFogPatches,
  createRisingRiverFogPatchSprites,
  drawRisingRiverFogPatches,
} from './objects/risingRiverFogPatches';
import type {
  RisingRiverFogPatch,
  RisingRiverFogPatchSprites,
} from './objects/risingRiverFogPatches';
import {
  createRisingRiverFragments,
  createRisingRiverFragmentSprites,
  drawRisingRiverFragments,
} from './objects/risingRiverFragments';
import type {
  RisingRiverFragment,
  RisingRiverFragmentSprites,
} from './objects/risingRiverFragments';
import {
  createRisingRiverGlows,
  createRisingRiverGlowSprites,
  drawRisingRiverGlows,
} from './objects/risingRiverGlows';
import type {
  RisingRiverGlow,
  RisingRiverGlowSprites,
} from './objects/risingRiverGlows';
import {
  createSun,
  createSunSprites,
  drawSun,
  drawSunAccent,
} from './objects/sun';
import type { SunSprites, SunState } from './objects/sun';

type RenderLightModeProps = {
  activeColor: string;
  session: RendererSession<LightRendererSnapshot>;
  deviceOrientationSession: DeviceOrientationSession;
};

type LightModeSpriteBundle = {
  background: BackgroundWashSprites;
  edgeGlows: EdgeGlowSprites;
  particles: AtmosphericParticleSprites;
  clouds: CloudSprites;
  haze: HazeSprites;
  distantHills: DistantHillSprites;
  foregroundTrees: HTMLCanvasElement;
  riverGlow: RiverGlowSprites;
  riverLightMotes: RiverLightMoteSprites;
  riverParticles: RiverParticleSprites;
  risingRiverFragments: RisingRiverFragmentSprites;
  risingRiverFogPatches: RisingRiverFogPatchSprites;
  risingRiverGlows: RisingRiverGlowSprites;
  sun: SunSprites;
};

type LightScene = ProjectionViewport & {
  sun: SunState;
  clouds: Cloud[];
  haze: HazeLayer[];
  distantHills: DistantHillLayer[];
  foregroundTrees: ForegroundTreeLine;
  riverLightMotes: RiverLightMote[];
  riverParticles: RiverParticle[];
  risingRiverFragments: RisingRiverFragment[];
  risingRiverFogPatches: RisingRiverFogPatch[];
  risingRiverGlows: RisingRiverGlow[];
  particles: AtmosphericParticle[];
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

const SECTION_COLOR_DURATION_MS = 1200;
const PARALLAX_EASE_MS = 300;
const DEVICE_TILT_DEAD_ZONE = 1.25;
const DEVICE_TILT_RANGE_X = 18;
const DEVICE_TILT_RANGE_Y = 22;

function createLightModeSprites(): LightModeSpriteBundle {
  return {
    background: createBackgroundWashSprites(),
    edgeGlows: createEdgeGlowSprites(),
    particles: createAtmosphericParticleSprites(),
    clouds: createCloudSprites(),
    haze: createHazeSprites(),
    distantHills: createDistantHillSprites(),
    foregroundTrees: createForegroundTreesSprite(),
    riverGlow: createRiverGlowSprites(),
    riverLightMotes: createRiverLightMoteSprites(),
    riverParticles: createRiverParticleSprites(),
    risingRiverFragments: createRisingRiverFragmentSprites(),
    risingRiverFogPatches: createRisingRiverFogPatchSprites(),
    risingRiverGlows: createRisingRiverGlowSprites(),
    sun: createSunSprites(),
  };
}

let lightModeSpriteCache: LightModeSpriteBundle | null = null;

function getLightModeSpriteBundle() {
  if (!lightModeSpriteCache) lightModeSpriteCache = createLightModeSprites();
  return lightModeSpriteCache;
}

function prewarmLightModeRenderer() {
  getLightModeSpriteBundle();
}

registerRendererPrewarmer('light', prewarmLightModeRenderer);

function createScene(
  width: number,
  height: number,
  coarsePointer: boolean,
  sprites: LightModeSpriteBundle,
): LightScene {
  const compact = width < 720 || height < 560;
  const motionScale = compact || coarsePointer ? 0.68 : 1;
  return {
    width,
    height,
    compact,
    motionScale,
    pixelRatio: 1,
    parallax: {
      positionX: 0,
      positionY: 0,
      maximumOffsetX: clamp(width * 0.025, 15, 34) * motionScale,
      maximumOffsetY: clamp(height * 0.019, 10, 22) * motionScale,
      maximumPitch: 7 * DEGREE * motionScale,
      maximumYaw: 10 * DEGREE * motionScale,
      maximumPerspectiveScale: 0.05 * motionScale,
      centerX: width * 0.5,
      centerY: height * 0.5,
      inverseHalfWidth: 2 / Math.max(width, 1),
      inverseHalfHeight: 2 / Math.max(height, 1),
      cursorNormalization: 1,
    },
    sun: createSun(width, height, compact),
    clouds: createClouds(width, height, compact, sprites.clouds),
    haze: createHazeLayers(width, height, sprites.haze),
    distantHills: createDistantHills(width, height, compact, sprites.distantHills),
    foregroundTrees: createForegroundTrees(width, height, compact, sprites.foregroundTrees),
    riverLightMotes: createRiverLightMotes(width, height, compact),
    riverParticles: createRiverParticles(compact),
    risingRiverFragments: createRisingRiverFragments(width, height, compact),
    risingRiverFogPatches: createRisingRiverFogPatches(width, height, compact),
    risingRiverGlows: createRisingRiverGlows(width, height, compact),
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

function updateFramePlanes(
  planes: FramePlanes,
  scene: LightScene,
  sprites: LightModeSpriteBundle,
  activeColor: Rgb,
  parallax: ParallaxFrame,
) {
  const colorChanged = !planes.valid
    || planes.color[0] !== activeColor[0]
    || planes.color[1] !== activeColor[1]
    || planes.color[2] !== activeColor[2];
  const cameraChanged = !planes.valid
    || planes.cameraX !== parallax.positionX
    || planes.cameraY !== parallax.positionY;
  if (!colorChanged && !cameraChanged) return;

  preparePlane(planes.sky, scene, false);
  drawSky(planes.sky.context, scene, sprites.background.sky);
  drawAtmosphericWash(
    planes.sky.context,
    scene,
    activeColor,
    parallax,
    sprites.background,
    planes,
  );
  drawSunAccent(
    planes.sky.context,
    scene,
    activeColor,
    parallax,
    sprites.sun,
    planes,
  );
  preparePlane(planes.edge, scene, true);
  drawEdgeGlow(
    planes.edge.context,
    scene,
    activeColor,
    parallax,
    sprites.edgeGlows,
    planes,
  );
  preparePlane(planes.tint, scene, true);
  drawForegroundGlowTint(
    planes.tint.context,
    scene,
    activeColor,
    parallax,
    sprites.edgeGlows,
    planes,
  );

  if (colorChanged) {
    updateAtmosphericParticleTint(sprites.particles, activeColor);
    planes.color[0] = activeColor[0];
    planes.color[1] = activeColor[1];
    planes.color[2] = activeColor[2];
  }
  planes.cameraX = parallax.positionX;
  planes.cameraY = parallax.positionY;
  planes.valid = true;
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: LightScene,
  sprites: LightModeSpriteBundle,
  time: number,
  activeColor: Rgb,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
  planes: FramePlanes,
  quality: AdaptiveQuality,
) {
  const motionTime = reducedMotion ? 0 : time;
  updateFramePlanes(planes, scene, sprites, activeColor, parallax);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  context.drawImage(planes.sky.canvas, -1, -1, scene.width + 2, scene.height + 2);
  drawSun(context, scene, sprites.sun, parallax);
  drawRiverGlow(context, scene, motionTime, parallax, sprites.riverGlow);
  drawHaze(context, scene, motionTime, 'far', parallax);
  drawClouds(context, scene, motionTime, 'far', parallax);
  drawDistantHills(context, scene, parallax);
  drawRisingRiverFragments(
    context,
    scene,
    sprites.risingRiverFragments,
    motionTime,
    parallax,
  );
  drawHaze(context, scene, motionTime, 'middle', parallax);
  drawClouds(context, scene, motionTime, 'middle', parallax);
  drawRisingRiverFogPatches(
    context,
    scene,
    sprites.risingRiverFogPatches,
    motionTime,
    parallax,
  );
  drawRisingRiverGlows(
    context,
    scene,
    sprites.risingRiverGlows,
    motionTime,
    parallax,
  );
  drawRiverLightMotes(
    context,
    scene,
    sprites.riverLightMotes,
    motionTime,
    parallax,
  );
  drawRiverParticles(
    context,
    scene,
    sprites.riverParticles,
    motionTime,
    parallax,
    quality,
  );
  drawParticles(
    context,
    scene,
    motionTime,
    sprites.particles,
    parallax,
    quality,
  );
  drawHaze(context, scene, motionTime, 'near', parallax);
  drawClouds(context, scene, motionTime, 'foreground', parallax);
  context.globalAlpha = 1;
  context.drawImage(planes.edge.canvas, 0, 0, scene.width, scene.height);
  drawForegroundTrees(context, scene, parallax);
  context.globalCompositeOperation = 'color';
  context.drawImage(planes.tint.canvas, 0, 0, scene.width, scene.height);
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

    const sprites = getLightModeSpriteBundle();
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
    let scene: LightScene | null = null;
    let planes: FramePlanes | null = null;
    let sceneCoarsePointer = coarsePointer.matches;
    const quality = createAdaptiveQuality(performance.now());
    let animationFrame = 0;
    let resizeFrame = 0;
    let resizePendingWhileHidden = false;
    let lastPaintTime = 0;
    let lastDeliveredPaintTime = 0;
    let previousAnimationTime = 0;
    let refreshInterval = 1000 / 60;
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
      const targetChanged = Math.abs(target[0] - transitionTargetColor[0]) > 0.01
        || Math.abs(target[1] - transitionTargetColor[1]) > 0.01
        || Math.abs(target[2] - transitionTargetColor[2]) > 0.01;
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

    const paint = (time: number, scheduledElapsed = 0, frameInterval = 0) => {
      if (!scene || !planes || disposed || document.hidden) return;
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
        if (Math.abs(targetParallaxX - currentParallaxX) < 0.00001) currentParallaxX = targetParallaxX;
        if (Math.abs(targetParallaxY - currentParallaxY) < 0.00001) currentParallaxY = targetParallaxY;
      }
      if (!reducedMotion) updateQualityWeights(quality, elapsed);
      const paintStart = performance.now();
      drawScene(
        context,
        scene,
        sprites,
        sceneTime,
        currentColor,
        reducedMotion,
        createParallaxFrame(scene, currentParallaxX, currentParallaxY),
        planes,
        quality,
      );
      if (!reducedMotion && frameInterval > 0) {
        recordQualityPaint(quality, time, performance.now() - paintStart, scheduledElapsed, frameInterval);
      }
    };

    const animate = (time: number) => {
      if (disposed || reducedMotion || document.hidden) return;
      const refreshElapsed = time - previousAnimationTime;
      previousAnimationTime = time;
      if (refreshElapsed >= 4 && refreshElapsed <= 25) {
        refreshInterval += (refreshElapsed - refreshInterval) * 0.1;
      }
      const profile = QUALITY_PROFILES[quality.tier];
      const frameInterval = 1000 / (coarsePointer.matches || window.innerWidth < 720
        ? profile.mobileFps : profile.desktopFps);
      const sinceLastPaint = time - lastPaintTime;
      // A small tolerance avoids halving delivery at nominal 60 Hz due to
      // fractional RAF timestamps. Keep the schedule phase, not paint duration.
      if (lastPaintTime === 0 || sinceLastPaint >= frameInterval - 0.25) {
        const deliveredElapsed = lastDeliveredPaintTime === 0
          ? frameInterval : time - lastDeliveredPaintTime;
        // Capped 45/27 FPS schedules naturally alternate vsync gaps. Discount
        // one refresh of quantization rather than treating those gaps as load.
        const scheduledElapsed = frameInterval + Math.max(
          0, deliveredElapsed - frameInterval - refreshInterval,
        );
        lastPaintTime = lastPaintTime === 0 ? time
          : lastPaintTime + Math.max(1, Math.floor((sinceLastPaint + 0.25) / frameInterval)) * frameInterval;
        lastDeliveredPaintTime = time;
        paint(time, scheduledElapsed, frameInterval);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousTime = performance.now();
      lastPaintTime = 0;
      lastDeliveredPaintTime = 0;
      previousAnimationTime = 0;
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
      const backingWidth = Math.max(1, Math.round(width * dpr));
      const backingHeight = Math.max(1, Math.round(height * dpr));
      const geometryChanged = !scene || scene.width !== width || scene.height !== height
        || sceneCoarsePointer !== coarsePointer.matches;
      const backingChanged = canvas.width !== backingWidth || canvas.height !== backingHeight
        || scene?.pixelRatio !== dpr;
      if (!geometryChanged && !backingChanged) return;
      if (backingChanged) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (geometryChanged) {
        disposeFramePlanes(planes);
        planes = createFramePlanes(width, height);
        scene = createScene(width, height, coarsePointer.matches, sprites);
        sceneCoarsePointer = coarsePointer.matches;
      }
      if (scene) scene.pixelRatio = dpr;
      resetQualityMeasurements(quality, performance.now());
      lastPaintTime = lastDeliveredPaintTime = 0;
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

    // ResizeObserver does not fire when only display density changes.
    // Re-arm the exact-resolution query without retaining obsolete listeners.
    let resolutionPreference = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    );
    const handleResolutionChange = () => {
      if (disposed) return;
      resolutionPreference.removeEventListener('change', handleResolutionChange);
      resolutionPreference = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      resolutionPreference.addEventListener('change', handleResolutionChange);
      scheduleResize();
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
      quality.tier = 0;
      quality.triangleWeights.fill(1);
      quality.particleWeights.fill(1);
      resetQualityMeasurements(quality, performance.now());
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
      lastDeliveredPaintTime = 0;
      resetQualityMeasurements(quality, previousTime);
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
    resolutionPreference.addEventListener('change', handleResolutionChange);
    window.screen.orientation?.addEventListener('change', handleScreenOrientationChange);
    window.addEventListener('orientationchange', handleScreenOrientationChange);
    window.addEventListener('resize', scheduleResize, { passive: true });
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
      resolutionPreference.removeEventListener('change', handleResolutionChange);
      window.screen.orientation?.removeEventListener('change', handleScreenOrientationChange);
      window.removeEventListener('orientationchange', handleScreenOrientationChange);
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', handleWindowBlur);
      document.documentElement.removeEventListener('pointerleave', resetParallax);
      document.removeEventListener('visibilitychange', handleVisibility);
      disarmTiltPermissionGesture();
      stopDeviceTilt();
      redrawStaticSceneRef.current = null;
      disposeFramePlanes(planes);
      planes = null;
      scene = null;
      canvas.width = canvas.height = 0;
    };
  }, [deviceOrientationSession, session]);

  return (
    <div ref={backgroundRef} className="ambient-background light-atmosphere" aria-hidden="true">
      <canvas ref={canvasRef} className="light-atmosphere-canvas" aria-hidden="true" />
    </div>
  );
}
