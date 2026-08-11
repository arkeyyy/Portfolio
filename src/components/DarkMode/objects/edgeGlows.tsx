import type { ParallaxFrame } from '../core/contracts';
import { clamp } from '../core/math';

type EdgeGlowDepthSpec = {
  variable: string;
  normalizedX: number;
  normalizedY: number;
  perspectiveStrength: number;
};

const EDGE_GLOW_DEPTH_SPECS: readonly EdgeGlowDepthSpec[] = [
  {
    variable: '--edge-glow-top-left-depth-scale',
    normalizedX: -0.82,
    normalizedY: -0.76,
    perspectiveStrength: 0.42,
  },
  {
    variable: '--edge-glow-mid-left-depth-scale',
    normalizedX: -0.94,
    normalizedY: -0.04,
    perspectiveStrength: 0.36,
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

export function EdgeGlows() {
  return (
    <div className="ambient-edge-glows">
      <span className="ambient-edge-glow-depth ambient-edge-glow-depth-top-left">
        <span className="ambient-edge-glow ambient-edge-glow-top-left" />
      </span>
      <span className="ambient-edge-glow-depth ambient-edge-glow-depth-mid-left">
        <span className="ambient-edge-glow ambient-edge-glow-mid-left" />
      </span>
      <span className="ambient-edge-glow-depth ambient-edge-glow-depth-top-right">
        <span className="ambient-edge-glow ambient-edge-glow-top-right" />
      </span>
      <span className="ambient-edge-glow-depth ambient-edge-glow-depth-bottom-right">
        <span className="ambient-edge-glow ambient-edge-glow-bottom-right" />
      </span>
    </div>
  );
}

EdgeGlows.syncDepth = syncEdgeGlowDepth;
