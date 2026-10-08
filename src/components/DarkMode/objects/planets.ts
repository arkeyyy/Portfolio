import type {
  CosmicRenderTheme,
  DepthFieldProjection,
  OrbitGeometry,
  ParallaxFrame,
  ParallaxPose,
  Rgb,
} from '../core/contracts';
import { mixRgb, rgba } from '../core/colorCanvas';
import { clamp, seededRandom, TAU } from '../core/math';
import {
  applyParallaxPlaneTilt,
  getParallaxPose,
  projectAtParallaxDepth,
} from '../core/parallax';
import {
  DEPTH_FIELD_LAYERS,
  PARALLAX_DEPTH,
} from '../core/theme';

type PlanetKind = 'violet' | 'amber' | 'rocky' | 'ocean' | 'ice';

const PLANET_PARALLAX_TILT_SCALE = 1.45;
const PLANET_MATERIAL_SIZE = 192;
const PLANET_MATERIAL_INDEX: Record<PlanetKind, number> = {
  violet: 0, amber: 1, rocky: 2, ocean: 3, ice: 4,
};

export type PlanetSprites = {
  materials: HTMLCanvasElement;
  shading: HTMLCanvasElement;
};

const PLANET_PALETTES: Record<
  PlanetKind,
  { highlight: Rgb; mid: Rgb; shadow: Rgb; feature: Rgb }
> = {
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

const PLANET_SECTION_TINT = {
  highlight: 0.22,
  mid: 0.3,
  shadow: 0.18,
  feature: 0.26,
  rim: 0.5,
  trail: 0.42,
} as const;

// Material landmarks use permanent seeds; animation rotates the cached artwork.
// Five material cells and one shading plane retain 864 KiB at every viewport.
export function createPlanetSprites(): PlanetSprites {
  const size = PLANET_MATERIAL_SIZE;
  const materials = document.createElement('canvas');
  materials.width = size * 5;
  materials.height = size;
  const context = materials.getContext('2d');
  if (context) {
    for (const kind of Object.keys(PLANET_MATERIAL_INDEX) as PlanetKind[]) {
      const index = PLANET_MATERIAL_INDEX[kind];
      const palette = PLANET_PALETTES[kind];
      const seed = 1709 + index * 821;
      context.save();
      context.translate(index * size + size / 2, size / 2);
      context.scale(size / 2, size / 2);
      context.beginPath();
      context.arc(0, 0, 0.995, 0, TAU);
      context.clip();

      if (kind === 'violet' || kind === 'amber') {
        // Unequal, meandering ribbons replace equally spaced elliptical stripes.
        for (let band = 0; band < 25; band += 1) {
          const y = -1.05 + band * 0.088;
          const thickness = 0.018 + seededRandom(seed + band * 17) * 0.055;
          const wave = seededRandom(seed + band * 29) * TAU;
          context.fillStyle = rgba(
            band % 4 === 0 ? palette.shadow : band % 3 === 0 ? palette.highlight : palette.feature,
            0.06 + seededRandom(seed + band * 41) * 0.17,
          );
          context.beginPath();
          for (let step = 0; step <= 40; step += 1) {
            const x = -1.2 + step * 0.06;
            const bend = Math.sin(x * 3.4 + wave) * 0.035
              + Math.sin(x * 10.5 + wave * 0.7) * 0.012;
            if (step === 0) context.moveTo(x, y + bend);
            else context.lineTo(x, y + bend);
          }
          for (let step = 40; step >= 0; step -= 1) {
            const x = -1.2 + step * 0.06;
            const bend = Math.sin(x * 3.4 + wave) * 0.035
              + Math.sin(x * 10.5 + wave * 0.7) * 0.012;
            context.lineTo(x, y + bend + thickness * (0.78 + Math.sin(x * 6 + wave) * 0.22));
          }
          context.closePath();
          context.fill();
        }
        for (let storm = 0; storm < 3; storm += 1) {
          const x = storm === 0 ? 0.32 : -0.5 + seededRandom(seed + storm * 67) * 0.8;
          const y = storm === 0 ? 0.13 : -0.65 + seededRandom(seed + storm * 89) * 1.3;
          const width = storm === 0 ? 0.2 : 0.06 + storm * 0.023;
          for (let contour = 0; contour < 5; contour += 1) {
            const scale = 1 - contour * 0.15;
            context.strokeStyle = rgba(contour % 2 ? palette.shadow : palette.highlight, 0.16);
            context.lineWidth = 0.009 + contour * 0.001;
            context.beginPath();
            context.ellipse(x, y, width * scale, width * scale * 0.36, -0.12, 0, TAU);
            context.stroke();
          }
        }
      } else if (kind === 'rocky') {
        for (let basin = 0; basin < 8; basin += 1) {
          const x = (seededRandom(seed + basin * 23) - 0.5) * 1.8;
          const y = (seededRandom(seed + basin * 41) - 0.5) * 1.8;
          context.fillStyle = rgba(palette.shadow, 0.09);
          context.beginPath();
          context.ellipse(x, y, 0.18 + basin * 0.019, 0.12 + basin * 0.014, basin, 0, TAU);
          context.fill();
        }
        for (let crater = 0; crater < 25; crater += 1) {
          const x = (seededRandom(seed + crater * 31.7) - 0.5) * 1.7;
          const y = (seededRandom(seed + crater * 47.3) - 0.5) * 1.7;
          const radius = 0.025 + seededRandom(seed + crater * 67.1) ** 2 * 0.14;
          const foreshorten = Math.sqrt(Math.max(0.18, 1 - x * x * 0.68));
          context.fillStyle = rgba(palette.shadow, 0.32);
          context.beginPath();
          context.ellipse(x, y, radius * foreshorten, radius, 0, 0, TAU);
          context.fill();
          context.lineWidth = 0.008;
          context.strokeStyle = rgba(palette.highlight, 0.35);
          context.beginPath();
          context.ellipse(x, y, radius * foreshorten, radius, 0, Math.PI * 0.95, Math.PI * 1.65);
          context.stroke();
          context.strokeStyle = rgba(palette.shadow, 0.3);
          context.beginPath();
          context.ellipse(x, y, radius * foreshorten * 0.8, radius * 0.8, 0, -0.1, Math.PI * 0.65);
          context.stroke();
        }
      } else if (kind === 'ocean') {
        for (let island = 0; island < 9; island += 1) {
          const x = (seededRandom(seed + island * 29) - 0.5) * 1.5;
          const y = (seededRandom(seed + island * 53) - 0.5) * 1.65;
          const radius = 0.05 + seededRandom(seed + island * 71) * 0.25;
          const phase = seededRandom(seed + island * 97) * TAU;
          context.fillStyle = rgba(palette.feature, 0.22 + island % 3 * 0.045);
          context.beginPath();
          for (let point = 0; point <= 48; point += 1) {
            const angle = point / 48 * TAU;
            const coast = radius * (0.76 + Math.sin(angle * 3 + phase) * 0.14
              + Math.sin(angle * 7 - phase) * 0.09 + Math.sin(angle * 11 + phase) * 0.045);
            const px = x + Math.cos(angle) * coast;
            const py = y + Math.sin(angle) * coast * 0.66;
            if (point === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
          }
          context.closePath();
          context.fill();
          context.lineWidth = 0.006;
          context.strokeStyle = rgba(palette.highlight, 0.12);
          context.stroke();
        }
        for (let cloud = 0; cloud < 12; cloud += 1) {
          const y = -0.82 + cloud * 0.143;
          const x = -0.68 + seededRandom(seed + cloud * 113) * 0.75;
          context.strokeStyle = rgba(palette.highlight, 0.12 + cloud % 3 * 0.045);
          context.lineWidth = 0.014 + cloud % 3 * 0.006;
          context.lineCap = 'round';
          context.beginPath();
          context.moveTo(x, y);
          context.bezierCurveTo(x + 0.15, y - 0.08, x + 0.3, y + 0.11, x + 0.58, y - 0.015);
          context.stroke();
        }
      } else {
        for (let sheet = 0; sheet < 9; sheet += 1) {
          const x = (seededRandom(seed + sheet * 41) - 0.5) * 1.6;
          const y = (seededRandom(seed + sheet * 67) - 0.5) * 1.6;
          context.fillStyle = rgba(palette.highlight, 0.045 + sheet % 3 * 0.025);
          context.beginPath();
          context.ellipse(x, y, 0.25 + sheet * 0.012, 0.1 + sheet * 0.009, sheet * 0.73, 0, TAU);
          context.fill();
        }
        for (let fissure = 0; fissure < 7; fissure += 1) {
          let x = -0.83 + fissure * 0.26;
          let y = -1.05;
          context.lineWidth = fissure % 2 ? 0.008 : 0.013;
          context.strokeStyle = rgba(palette.feature, fissure % 2 ? 0.17 : 0.25);
          context.beginPath();
          context.moveTo(x, y);
          for (let joint = 0; joint < 10; joint += 1) {
            const dx = (seededRandom(seed + fissure * 71 + joint * 37) - 0.5) * 0.27;
            x += dx;
            y += 0.22;
            context.lineTo(x, y);
            if (joint % 3 === 1) {
              context.lineTo(x + dx * 2.8 + 0.09, y + 0.06);
              context.moveTo(x, y);
            }
          }
          context.stroke();
        }
      }
      // Fine mineral/cloud grain is permanent artwork, not flickering noise.
      for (let grain = 0; grain < 480; grain += 1) {
        const x = (seededRandom(seed + grain * 17.3) - 0.5) * 2;
        const y = (seededRandom(seed + grain * 31.7) - 0.5) * 2;
        context.fillStyle = rgba(grain % 3 ? palette.highlight : palette.shadow, 0.025 + grain % 4 * 0.01);
        context.fillRect(x, y, 0.007 + grain % 3 * 0.003, 0.006);
      }
      context.restore();
    }
  }

  const shading = document.createElement('canvas');
  shading.width = size;
  shading.height = size;
  const shade = shading.getContext('2d');
  if (shade) {
    shade.translate(size / 2, size / 2);
    shade.scale(size / 2, size / 2);
    shade.beginPath();
    shade.arc(0, 0, 1, 0, TAU);
    shade.clip();
    const terminator = shade.createLinearGradient(-0.58, -0.62, 0.75, 0.72);
    terminator.addColorStop(0, 'rgba(2,4,18,0)');
    terminator.addColorStop(0.36, 'rgba(2,4,18,0)');
    terminator.addColorStop(0.57, 'rgba(2,4,18,0.06)');
    terminator.addColorStop(0.78, 'rgba(2,4,18,0.34)');
    terminator.addColorStop(1, 'rgba(2,4,18,0.7)');
    shade.fillStyle = terminator;
    shade.fillRect(-1, -1, 2, 2);
  }
  return { materials, shading };
}

type PlanetBase = {
  size: number;
  phase: number;
  spinSpeed: number;
  ringed: boolean;
  kind: PlanetKind;
};

export type OrbitingPlanet = PlanetBase & {
  motion: 'orbit';
  angle: number;
  lane: number;
  speed: number;
  direction: 1 | -1;
};

export type RoguePlanet = PlanetBase & {
  motion: 'rogue';
  x: number;
  y: number;
  velocityX: number;
  waveY: number;
  waveSpeed: number;
};

export type Planet = OrbitingPlanet | RoguePlanet;
export type PlanetLayer = Planet['motion'] | 'distant-rogue';

export type PlanetRenderState = {
  planet: Planet;
  x: number;
  y: number;
  radius: number;
  surfacePhase: number;
  viewPose: ParallaxPose;
};

export function createPlanets(compact: boolean): Planet[] {
  return [
    {
      motion: 'rogue',
      x: 0.91,
      y: 0.25,
      size: compact ? 0.034 : 0.048,
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
}

function drawPlanetRing(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: Rgb,
  renderTheme: CosmicRenderTheme,
  phase: number,
  viewPose: ParallaxPose,
  foreground: boolean,
) {
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);
  context.save();
  context.translate(x, y);
  context.rotate(0.32 + phase * 0.025 + yaw * 0.8);
  applyParallaxPlaneTilt(context, viewPose, 0.75);
  context.scale(1, clamp(0.34 + pitch * 0.9, 0.2, 0.5));
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
  renderTheme: CosmicRenderTheme,
  phase: number,
  viewPose: ParallaxPose,
  sprites: PlanetSprites,
) {
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.clip();
  context.rotate(-0.14 + phase * 0.035 + yaw * 0.24);
  context.transform(1, pitch * 0.18, yaw * 0.12, 1, 0, 0);
  context.translate(yaw * radius * 0.72, pitch * radius * 0.62);
  context.globalAlpha *= renderTheme.planetSurface.featureAlpha / 0.4;
  context.drawImage(
    sprites.materials,
    PLANET_MATERIAL_INDEX[kind] * PLANET_MATERIAL_SIZE,
    0,
    PLANET_MATERIAL_SIZE,
    PLANET_MATERIAL_SIZE,
    -radius,
    -radius,
    radius * 2,
    radius * 2,
  );
  context.restore();
  // Fixed illumination is separate from rotating landmarks and camera tilt.
  context.drawImage(sprites.shading, x - radius, y - radius, radius * 2, radius * 2);
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
  viewPose: ParallaxPose,
  sprites: PlanetSprites,
) {
  const palette = PLANET_PALETTES[kind];
  const highlightColor = mixRgb(palette.highlight, activeColor, PLANET_SECTION_TINT.highlight);
  const midColor = mixRgb(palette.mid, activeColor, PLANET_SECTION_TINT.mid);
  const shadowColor = mixRgb(palette.shadow, activeColor, PLANET_SECTION_TINT.shadow);
  const featureColor = mixRgb(palette.feature, activeColor, PLANET_SECTION_TINT.feature);
  const rimColor = mixRgb(palette.feature, activeColor, PLANET_SECTION_TINT.rim);
  const atmosphereAlpha = kind === 'rocky'
    ? renderTheme.planetAtmosphere.rockyAlpha
    : kind === 'ice'
      ? renderTheme.planetAtmosphere.iceAlpha
      : renderTheme.planetAtmosphere.standardAlpha;
  const pitch = Math.sin(viewPose.pitch);
  const yaw = Math.sin(viewPose.yaw);

  if (ringed) {
    drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, viewPose, false);
  }

  const gradient = context.createRadialGradient(
    x - radius * 0.32 + yaw * radius * 0.22,
    y - radius * 0.36 + pitch * radius * 0.18,
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
    renderTheme,
    phase,
    viewPose,
    sprites,
  );

  // A quiet full limb and directional lit rim imply an atmosphere, not a neon disc.
  context.strokeStyle = rgba(rimColor, atmosphereAlpha * 0.3);
  context.lineWidth = Math.max(0.6, radius * 0.018);
  context.beginPath();
  context.arc(x, y, radius + context.lineWidth * 0.5, 0, TAU);
  context.stroke();

  context.strokeStyle = rgba(rimColor, atmosphereAlpha * 0.76);
  context.lineWidth = Math.max(0.65, radius * 0.025);
  context.beginPath();
  context.arc(x, y, radius + context.lineWidth * 0.3, Math.PI * 1.03, Math.PI * 1.72);
  context.stroke();

  if (kind === 'ice') {
    context.strokeStyle = rgba(featureColor, renderTheme.planetAtmosphere.iceOuterAlpha * 0.48);
    context.lineWidth = Math.max(0.6, radius * 0.022);
    context.beginPath();
    context.arc(x, y, radius * 1.08, Math.PI * 1.03, Math.PI * 1.72);
    context.stroke();
  }

  const tiltMagnitude = Math.hypot(viewPose.pitch, viewPose.yaw);
  if (tiltMagnitude > 0.002) {
    const facingAngle = Math.atan2(pitch, yaw);
    const directionalAlpha = atmosphereAlpha * clamp(tiltMagnitude / 0.2, 0, 0.62);
    context.strokeStyle = rgba(highlightColor, directionalAlpha);
    context.lineWidth = Math.max(0.85, radius * 0.052);
    context.lineCap = 'round';
    context.beginPath();
    context.arc(
      x,
      y,
      radius + context.lineWidth * 0.42,
      facingAngle - 1.02,
      facingAngle + 1.02,
    );
    context.stroke();
  }

  if (ringed) {
    drawPlanetRing(context, x, y, radius, rimColor, renderTheme, phase, viewPose, true);
  }
}

export function getPlanetRenderStates(
  planets: readonly Planet[],
  width: number,
  height: number,
  orbit: OrbitGeometry,
  time: number,
  reducedMotion: boolean,
  parallax: ParallaxFrame,
) {
  const minDimension = Math.min(width, height);
  const motionTime = reducedMotion ? 0 : time;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const states = planets.map((planet): PlanetRenderState => {
    const surfacePhase = planet.phase + motionTime * planet.spinSpeed;
    let x: number;
    let y: number;
    let radius = minDimension * planet.size;
    let orientationDepth: number | undefined;

    if (planet.motion === 'orbit') {
      const angle = planet.angle + motionTime * planet.speed * planet.direction;
      const laneScale = 0.5 + planet.lane * 0.33;
      const localX = Math.cos(angle) * orbit.radiusX * laneScale;
      const localY = Math.sin(angle) * orbit.radiusY * laneScale;
      x = orbit.centerX + localX * cosTilt - localY * sinTilt;
      y = orbit.centerY + localX * sinTilt + localY * cosTilt;
      const orbitDepth = (Math.sin(angle) + 1) * 0.5;
      radius *= 0.82 + orbitDepth * 0.28;
      orientationDepth = 0.32 + orbitDepth * 0.28;
    } else {
      const offscreenMargin = radius * 2.4;
      const travelWidth = width + offscreenMargin * 2;
      const travelledX = planet.x * width + motionTime * planet.velocityX + offscreenMargin;
      x = ((travelledX % travelWidth) + travelWidth) % travelWidth - offscreenMargin;
      y = planet.y * height
        + Math.sin(planet.phase + motionTime * planet.waveSpeed) * planet.waveY;
    }

    const parallaxDepth = planet.kind === 'violet'
      ? PARALLAX_DEPTH.distant
      : PARALLAX_DEPTH.middle;
    const viewPose = getParallaxPose(
      parallax,
      parallaxDepth,
      PLANET_PARALLAX_TILT_SCALE,
      orientationDepth ?? parallaxDepth,
    );
    if (planet.motion === 'orbit') {
      const projection: DepthFieldProjection = { x, y, scale: 1, alphaScale: 1 };
      projectAtParallaxDepth(
        parallax,
        x,
        y,
        DEPTH_FIELD_LAYERS.mainRing.translationDepth,
        DEPTH_FIELD_LAYERS.mainRing.perspectiveDepth,
        DEPTH_FIELD_LAYERS.mainRing.perspectiveStrength,
        projection,
      );
      x = projection.x;
      y = projection.y;
      radius *= projection.scale;
    } else {
      x += viewPose.offsetX;
      y += viewPose.offsetY;
    }

    return { planet, x, y, radius, surfacePhase, viewPose };
  });

  const collisionPadding = minDimension * 0.016;
  for (let pass = 0; pass < 4; pass += 1) {
    for (let firstIndex = 0; firstIndex < states.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < states.length; secondIndex += 1) {
        const first = states[firstIndex];
        const second = states[secondIndex];
        let deltaX = second.x - first.x;
        let deltaY = second.y - first.y;
        let distance = Math.hypot(deltaX, deltaY);
        const firstClearance = first.radius * (first.planet.ringed ? 1.5 : 1.08);
        const secondClearance = second.radius * (second.planet.ringed ? 1.5 : 1.08);
        const minimumDistance = firstClearance + secondClearance + collisionPadding;
        if (distance >= minimumDistance) continue;

        if (distance < 0.001) {
          const fallbackAngle = seededRandom(firstIndex * 31 + secondIndex * 47 + 8.3) * TAU;
          deltaX = Math.cos(fallbackAngle);
          deltaY = Math.sin(fallbackAngle);
          distance = 1;
        }

        const correction = (minimumDistance - distance) * 0.52;
        const normalX = deltaX / distance;
        const normalY = deltaY / distance;
        first.x -= normalX * correction;
        first.y -= normalY * correction;
        second.x += normalX * correction;
        second.y += normalY * correction;
      }
    }
  }

  return states;
}

export function drawPlanets(
  context: CanvasRenderingContext2D,
  states: readonly PlanetRenderState[],
  activeColor: Rgb,
  renderTheme: CosmicRenderTheme,
  layer: PlanetLayer,
  sprites: PlanetSprites,
) {
  for (const { planet, x, y, radius, surfacePhase, viewPose } of states) {
    const belongsToLayer = layer === 'distant-rogue'
      ? planet.motion === 'rogue' && planet.kind === 'violet'
      : layer === 'rogue'
        ? planet.motion === 'rogue' && planet.kind !== 'violet'
        : planet.motion === 'orbit';
    if (!belongsToLayer) continue;
    context.save();
    if (layer === 'distant-rogue') context.globalAlpha *= 0.72;

    if (planet.motion === 'rogue') {
      const direction = Math.sign(planet.velocityX) || 1;
      const trailEndX = x - direction * radius * 3.2;
      const trailColor = mixRgb(
        PLANET_PALETTES[planet.kind].feature,
        activeColor,
        PLANET_SECTION_TINT.trail,
      );
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
      viewPose,
      sprites,
    );
    context.restore();
  }
}
