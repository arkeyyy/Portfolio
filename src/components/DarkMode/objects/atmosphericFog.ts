import type {
  AtmosphericFogStage,
  CosmicRenderTheme,
  DarkSceneViewport,
  ParallaxFrame,
} from '../core/contracts';
import {
  drawOnDepthFieldSurface,
  getDepthFieldSurface,
} from '../core/parallax';
import type { NebulaSprites } from './nebulaAssets';

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

function drawAtmosphericFogLayer(
  context: CanvasRenderingContext2D,
  viewport: DarkSceneViewport,
  sprites: NebulaSprites,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  layer: AtmosphericFogLayer,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const fogHeight = viewport.height * layer.heightScale;
  const fogWidth = Math.max(viewport.width * layer.widthScale, fogHeight * 2.1);
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
  const centerX = viewport.width * layer.centerX + driftX;
  const centerY = viewport.height * layer.centerY + driftY;
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
      sprites.purple,
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
      sprites.active,
      -fogWidth * 0.48,
      -fogHeight * 0.46,
      fogWidth * 0.96,
      fogHeight * 0.92,
    );
    context.restore();
    context.restore();
  });
}

export function drawAtmosphericFogStage(
  context: CanvasRenderingContext2D,
  viewport: DarkSceneViewport,
  sprites: NebulaSprites,
  time: number,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  stage: AtmosphericFogStage,
  parallax: ParallaxFrame,
) {
  for (const layer of ATMOSPHERIC_FOG_LAYERS) {
    if (layer.stage !== stage || (viewport.compact && !layer.compactVisible)) continue;
    drawAtmosphericFogLayer(
      context,
      viewport,
      sprites,
      time,
      renderTheme,
      reducedMotion,
      layer,
      parallax,
    );
  }
}
