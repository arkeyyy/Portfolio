import type {
  CosmicRenderTheme,
  DarkSceneViewport,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import {
  drawOnDepthFieldSurface,
  getDepthFieldSurface,
} from '../core/parallax';
import {
  DEPTH_FIELD_LAYERS,
  FOREGROUND_CLOUD_PURPLE,
} from '../core/theme';
import type { NebulaSprites } from './nebulaAssets';

export function drawForegroundClouds(
  context: CanvasRenderingContext2D,
  viewport: DarkSceneViewport,
  sprites: NebulaSprites,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const motionTime = reducedMotion ? 0 : time;
  const cloudWidth = Math.min(
    viewport.width * (viewport.compact ? 1.35 : 0.76),
    viewport.compact ? 660 : 1050,
  );
  const cloudHeight = cloudWidth * 0.5;
  const centerX = viewport.width * (viewport.compact ? 0.08 : 0.06);
  const centerY = viewport.height * (viewport.compact ? 0.92 : 0.94);
  const driftX = reducedMotion ? 0 : Math.sin(motionTime * 0.000038 + 1.4) * 13;
  const driftY = reducedMotion ? 0 : Math.cos(motionTime * 0.000031 + 0.7) * 7;
  const scalePulse = reducedMotion
    ? 1
    : 1 + Math.sin(motionTime * 0.000028 + 2.2) * 0.015;
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
      sprites.purple,
      -cloudWidth * 0.62,
      -cloudHeight * 0.54,
      cloudWidth * 1.18,
      cloudHeight * 1.08,
    );
    context.globalAlpha = renderTheme.foregroundClouds.activeAlpha
      * opacityPulse
      * surface.alphaScale;
    context.drawImage(
      sprites.active,
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
