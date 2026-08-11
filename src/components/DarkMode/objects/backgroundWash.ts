import type {
  CosmicRenderTheme,
  DarkSceneViewport,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { DEEP_SPACE } from '../core/theme';

export function drawBackgroundWash(
  context: CanvasRenderingContext2D,
  viewport: DarkSceneViewport,
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
) {
  const { width, height, compact } = viewport;
  const centerX = compact ? width * 0.52 : width * 0.48;
  const centerY = compact ? height * 0.57 : height * 0.62;
  const radius = Math.max(width, height) * 0.78;
  const wash = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const centerColor = mixRgb(DEEP_SPACE, activeColor, 0.24);
  wash.addColorStop(0, rgba(centerColor, renderTheme.backgroundWash.centerAlpha));
  wash.addColorStop(0.48, rgba(DEEP_SPACE, renderTheme.backgroundWash.depthAlpha));
  wash.addColorStop(1, rgba(DEEP_SPACE, 0));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}
