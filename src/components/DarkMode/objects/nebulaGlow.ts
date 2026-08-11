import type {
  CosmicRenderTheme,
  DarkSceneViewport,
  ParallaxFrame,
  Rgb,
} from '../core/contracts';
import {
  getNebulaAccentColor,
  mixRgb,
  rgba,
} from '../core/colorCanvas';
import {
  drawOnDepthFieldSurface,
  getDepthFieldSurface,
} from '../core/parallax';
import { DEPTH_FIELD_LAYERS } from '../core/theme';
import type { NebulaSprites } from './nebulaAssets';

type NebulaGlowLobe = {
  offsetX: number;
  offsetY: number;
  radiusScale: number;
  scaleX: number;
  scaleY: number;
  accentMix: number;
  alphaScale: number;
  phase: number;
};

const LEFT_NEBULA_GLOW_LOBES: readonly NebulaGlowLobe[] = [
  {
    offsetX: -0.32,
    offsetY: -0.04,
    radiusScale: 0.27,
    scaleX: 1.42,
    scaleY: 0.76,
    accentMix: 0.58,
    alphaScale: 0.78,
    phase: 1.2,
  },
  {
    offsetX: -0.56,
    offsetY: 0.1,
    radiusScale: 0.22,
    scaleX: 1.58,
    scaleY: 0.68,
    accentMix: 0.76,
    alphaScale: 0.56,
    phase: 4.4,
  },
];

export function drawNebulaGlow(
  context: CanvasRenderingContext2D,
  viewport: DarkSceneViewport,
  sprites: NebulaSprites,
  time: number,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const nebulaAccentColor = getNebulaAccentColor(activeColor);
  const motionTime = reducedMotion ? 0 : time;
  const centerX = viewport.compact ? viewport.width * 0.5 : viewport.width * 0.46;
  const centerY = viewport.compact ? viewport.height * 0.61 : viewport.height * 0.66;
  const cloudWidth = Math.min(
    viewport.width * (viewport.compact ? 1.15 : 0.82),
    1120,
  );
  const cloudHeight = cloudWidth * 0.5;
  const driftX = Math.sin(motionTime * 0.000052) * (viewport.compact ? 8 : 16);
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
      sprites.accent,
      -cloudWidth * 0.58,
      -cloudHeight * 0.52,
      cloudWidth * 1.16,
      cloudHeight * 1.04,
    );
    context.globalAlpha = renderTheme.clouds.activeAlpha * surface.alphaScale;
    context.drawImage(
      sprites.active,
      -cloudWidth * 0.5,
      -cloudHeight * 0.5,
      cloudWidth,
      cloudHeight,
    );
    context.restore();

    for (const lobe of LEFT_NEBULA_GLOW_LOBES) {
      const lobePulse = reducedMotion
        ? 1
        : 0.96 + Math.sin(motionTime * 0.000047 + lobe.phase) * 0.04;
      const lobeX = cloudX
        + cloudWidth * lobe.offsetX
        + (reducedMotion ? 0 : Math.sin(motionTime * 0.000031 + lobe.phase) * 9);
      const lobeY = cloudY
        + cloudHeight * lobe.offsetY
        + (reducedMotion ? 0 : Math.cos(motionTime * 0.000027 + lobe.phase) * 6);
      const lobeRadius = Math.max(cloudWidth * lobe.radiusScale, 120) * lobePulse;
      const lobeColor = mixRgb(activeColor, nebulaAccentColor, lobe.accentMix);
      const lobeGlow = context.createRadialGradient(0, 0, 0, 0, 0, lobeRadius);
      lobeGlow.addColorStop(
        0,
        rgba(
          lobeColor,
          renderTheme.clouds.glowCoreAlpha * lobe.alphaScale * surface.alphaScale,
        ),
      );
      lobeGlow.addColorStop(
        0.48,
        rgba(
          mixRgb(activeColor, lobeColor, 0.42),
          renderTheme.clouds.glowMidAlpha * lobe.alphaScale * surface.alphaScale,
        ),
      );
      lobeGlow.addColorStop(1, rgba(lobeColor, 0));

      context.save();
      context.globalCompositeOperation = renderTheme.cloudCompositeOperation;
      context.translate(lobeX, lobeY);
      context.scale(lobe.scaleX, lobe.scaleY);
      context.fillStyle = lobeGlow;
      context.fillRect(-lobeRadius, -lobeRadius, lobeRadius * 2, lobeRadius * 2);
      context.restore();
    }

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
