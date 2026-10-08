import type {
  DepthFieldProjection,
  OrbitGeometry,
  ParallaxFrame,
  RenderViewport,
} from '../core/contracts';
import { seededRandom, TAU } from '../core/math';
import { projectAtParallaxDepth } from '../core/parallax';
import { DEPTH_FIELD_LAYERS } from '../core/theme';

type OrbitalDustParticle = {
  angle: number;
  speed: number;
  laneScale: number;
  size: number;
  opacity: number;
  variant: number;
  warm: boolean;
  glintPhase: number;
  glintSpeed: number;
};

export type OrbitalDustField = {
  main: OrbitalDustParticle[];
  inner: OrbitalDustParticle[];
  projection: DepthFieldProjection;
};

const CELL_SIZE = 32;
const BODY_EXTENT = 20;

// Artwork is allocated only by the coordinator's existing prewarmer. The six
// tiny cells keep irregular grain silhouettes separate from the star sprites.
export function createOrbitalDustSprites(): HTMLCanvasElement {
  const atlas = document.createElement('canvas');
  atlas.width = CELL_SIZE * 3;
  atlas.height = CELL_SIZE * 2;
  const context = atlas.getContext('2d');
  // Optional detail must not prevent the existing scene from painting.
  if (!context) return atlas;

  for (let row = 0; row < 2; row += 1) {
    for (let variant = 0; variant < 3; variant += 1) {
      context.save();
      context.translate(variant * CELL_SIZE + 16, row * CELL_SIZE + 16);
      const bloom = context.createRadialGradient(0, 0, 0, 0, 0, 14);
      bloom.addColorStop(0, row === 0 ? 'rgba(167,192,219,0.15)' : 'rgba(220,193,148,0.16)');
      bloom.addColorStop(0.5, row === 0 ? 'rgba(118,155,188,0.04)' : 'rgba(191,163,128,0.04)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = bloom;
      context.fillRect(-14, -14, 28, 28);
      context.rotate(variant * 1.12 - 0.32);
      context.fillStyle = row === 0 ? '#8798ad' : '#baa181';
      context.beginPath();
      if (variant === 0) {
        context.moveTo(-9, -2);
        context.lineTo(-2, -5);
        context.lineTo(10, 1);
        context.lineTo(2, 5);
        context.lineTo(-6, 3);
      } else if (variant === 1) {
        context.moveTo(-8, 5);
        context.lineTo(-4, -6);
        context.lineTo(8, -2);
        context.lineTo(5, 4);
        context.lineTo(-1, 6);
      } else {
        context.moveTo(-10, 0);
        context.lineTo(-3, -4);
        context.lineTo(10, -1);
        context.lineTo(4, 3);
        context.lineTo(-7, 4);
      }
      context.closePath();
      context.fill();
      context.fillStyle = row === 0 ? 'rgba(197,211,225,0.36)' : 'rgba(232,209,170,0.38)';
      context.beginPath();
      context.moveTo(-6, -1);
      context.lineTo(-2, -4);
      context.lineTo(7, 0);
      context.lineTo(0, 1);
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  return atlas;
}

function createDustLane(
  count: number,
  compact: boolean,
  inner: boolean,
): OrbitalDustParticle[] {
  const seedOffset = inner ? 71903 : 68417;
  return Array.from({ length: count }, (_, index) => {
    const seed = seedOffset + index * 37.1;
    // Four loose accumulations leave breathing room between granular arcs.
    const cluster = index % 4;
    const clusterCenter = cluster * 1.49 + (inner ? 0.61 : 0.28);
    const lane = Math.floor(seededRandom(seed + 2.3) * (inner ? 3 : 4));
    return {
      angle: clusterCenter + (seededRandom(seed + 1.1) - 0.5) * 0.72,
      speed: (inner ? -1 : 1) * (0.000008 + seededRandom(seed + 3.7) * 0.000006),
      laneScale: (inner ? 1 + (lane - 1) * 0.065 : 0.91 + lane * 0.052)
        + (seededRandom(seed + 4.9) - 0.5) * 0.016,
      size: (compact ? 0.7 : 0.8) + seededRandom(seed + 6.1) ** 1.6 * (compact ? 1.6 : 2.2),
      opacity: 0.24 + seededRandom(seed + 7.9) * 0.2,
      variant: Math.floor(seededRandom(seed + 9.3) * 3),
      warm: seededRandom(seed + 10.7) < 0.22,
      glintPhase: seededRandom(seed + 12.1) * TAU,
      glintSpeed: TAU / (9000 + seededRandom(seed + 13.7) * 9000),
    };
  });
}

export function createOrbitalDust(compact: boolean): OrbitalDustField {
  return {
    main: createDustLane(compact ? 13 : 24, compact, false),
    inner: createDustLane(compact ? 9 : 16, compact, true),
    projection: { x: 0, y: 0, scale: 1, alphaScale: 1 },
  };
}

export function drawOrbitalDust(
  context: CanvasRenderingContext2D,
  viewport: RenderViewport,
  field: OrbitalDustField,
  atlas: HTMLCanvasElement,
  orbit: OrbitGeometry,
  ring: 'main' | 'inner',
  time: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const particles = field[ring];
  const projection = field.projection;
  const layer = DEPTH_FIELD_LAYERS.mainRing;
  const motionTime = reducedMotion ? 0 : time;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);

  context.save();
  context.globalCompositeOperation = 'source-over';
  for (const particle of particles) {
    const angle = particle.angle + motionTime * particle.speed;
    const localX = Math.cos(angle) * orbit.radiusX * particle.laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * particle.laneScale;
    projectAtParallaxDepth(
      parallax,
      orbit.centerX + localX * cosTilt - localY * sinTilt,
      orbit.centerY + localX * sinTilt + localY * cosTilt,
      layer.translationDepth,
      layer.perspectiveDepth,
      layer.perspectiveStrength,
      projection,
    );
    const nearSide = (Math.sin(angle) + 1) * 0.5;
    const size = particle.size * (0.82 + nearSide * 0.18) * projection.scale
      * CELL_SIZE / BODY_EXTENT;
    const half = size * 0.5;
    if (
      projection.x + half < 0 || projection.x - half > viewport.width
      || projection.y + half < 0 || projection.y - half > viewport.height
    ) continue;

    const glint = ((Math.sin(motionTime * particle.glintSpeed + particle.glintPhase) + 1) * 0.5) ** 8;
    context.globalAlpha = particle.opacity * (0.56 + nearSide * 0.44)
      * (0.76 + glint * 0.24) * projection.alphaScale;
    context.drawImage(
      atlas,
      particle.variant * CELL_SIZE,
      particle.warm ? CELL_SIZE : 0,
      CELL_SIZE,
      CELL_SIZE,
      projection.x - half,
      projection.y - half,
      size,
      size,
    );
  }
  context.restore();
}
