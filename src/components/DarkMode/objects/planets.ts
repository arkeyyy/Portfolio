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
  featureColor: Rgb,
  highlightColor: Rgb,
  shadowColor: Rgb,
  renderTheme: CosmicRenderTheme,
  phase: number,
  viewPose: ParallaxPose,
) {
  const { planetSurface } = renderTheme;
  const featureAlpha = planetSurface.featureAlpha;
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

  if (kind === 'violet') {
    for (let band = -4; band <= 4; band += 1) {
      const offsetY = band * radius * 0.17;
      context.fillStyle = rgba(
        band % 2 === 0 ? featureColor : highlightColor,
        featureAlpha * (band === 0 ? 1.1 : 0.62),
      );
      context.beginPath();
      context.ellipse(0, offsetY, radius * 1.04, radius * (band === 0 ? 0.065 : 0.032), 0, 0, TAU);
      context.fill();
    }
    context.fillStyle = rgba(highlightColor, planetSurface.violetStormAlpha);
    context.beginPath();
    context.ellipse(radius * 0.38, radius * 0.12, radius * 0.2, radius * 0.09, -0.08, 0, TAU);
    context.fill();
  } else if (kind === 'amber') {
    for (let band = -2; band <= 2; band += 1) {
      const offsetY = band * radius * 0.3;
      context.fillStyle = rgba(
        band === 0 ? highlightColor : featureColor,
        featureAlpha * (band === 0 ? 0.95 : 0.58),
      );
      context.beginPath();
      context.ellipse(0, offsetY, radius * 1.05, radius * (band === 0 ? 0.13 : 0.08), 0, 0, TAU);
      context.fill();
    }
  } else if (kind === 'rocky') {
    context.fillStyle = rgba(shadowColor, planetSurface.rockyShadowAlpha);
    context.beginPath();
    context.ellipse(radius * 0.42, 0, radius * 0.7, radius * 1.08, 0.08, 0, TAU);
    context.fill();
    for (let crater = 0; crater < 9; crater += 1) {
      const craterX = (seededRandom(phase * 17 + crater * 3.7) - 0.5) * radius * 1.2;
      const craterY = (seededRandom(phase * 23 + crater * 5.1) - 0.5) * radius * 1.15;
      const craterRadius = radius * (0.08 + seededRandom(phase * 29 + crater * 7.3) * 0.11);
      context.fillStyle = rgba(shadowColor, planetSurface.rockyCraterAlpha);
      context.beginPath();
      context.arc(craterX, craterY, craterRadius, 0, TAU);
      context.fill();
      context.strokeStyle = rgba(highlightColor, planetSurface.rockyCraterRimAlpha);
      context.lineWidth = Math.max(0.45, radius * 0.016);
      context.stroke();
    }
  } else if (kind === 'ocean') {
    context.fillStyle = rgba(featureColor, planetSurface.oceanFeatureAlpha);
    context.beginPath();
    context.ellipse(-radius * 0.28, -radius * 0.18, radius * 0.34, radius * 0.21, 0.42, 0, TAU);
    context.ellipse(radius * 0.3, radius * 0.22, radius * 0.28, radius * 0.18, -0.3, 0, TAU);
    context.ellipse(radius * 0.18, -radius * 0.5, radius * 0.16, radius * 0.1, 0.16, 0, TAU);
    context.fill();
    context.strokeStyle = rgba(highlightColor, planetSurface.oceanCloudAlpha);
    context.lineWidth = Math.max(0.65, radius * 0.035);
    context.beginPath();
    context.arc(-radius * 0.08, -radius * 0.02, radius * 0.7, 0.18, Math.PI * 0.88);
    context.stroke();
  } else {
    context.fillStyle = rgba(highlightColor, planetSurface.iceFacetAlpha);
    for (let facet = 0; facet < 5; facet += 1) {
      const angle = (facet / 5) * TAU;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      context.lineTo(
        Math.cos(angle + TAU / 5) * radius,
        Math.sin(angle + TAU / 5) * radius,
      );
      context.closePath();
      if (facet % 2 === 0) context.fill();
    }
    context.strokeStyle = rgba(featureColor, planetSurface.iceFissureAlpha);
    context.lineWidth = Math.max(0.65, radius * 0.038);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-radius * 0.18, -radius * 0.82);
    context.lineTo(radius * 0.03, -radius * 0.28);
    context.lineTo(-radius * 0.13, radius * 0.05);
    context.lineTo(radius * 0.24, radius * 0.72);
    context.moveTo(radius * 0.03, -radius * 0.28);
    context.lineTo(radius * 0.48, -radius * 0.08);
    context.moveTo(-radius * 0.13, radius * 0.05);
    context.lineTo(-radius * 0.5, radius * 0.38);
    context.stroke();
  }

  context.restore();
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
    x - radius * 0.32 + yaw * radius * 0.78,
    y - radius * 0.36 + pitch * radius * 0.7,
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
    featureColor,
    highlightColor,
    shadowColor,
    renderTheme,
    phase,
    viewPose,
  );

  context.strokeStyle = rgba(rimColor, atmosphereAlpha);
  context.lineWidth = Math.max(0.75, radius * 0.025);
  context.beginPath();
  context.arc(x, y, radius + context.lineWidth * 0.5, 0, TAU);
  context.stroke();

  if (kind === 'ice') {
    context.strokeStyle = rgba(featureColor, renderTheme.planetAtmosphere.iceOuterAlpha);
    context.lineWidth = Math.max(0.6, radius * 0.022);
    context.beginPath();
    context.arc(x, y, radius * 1.16, 0, TAU);
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
    );
    context.restore();
  }
}
