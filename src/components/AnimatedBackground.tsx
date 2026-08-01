import { useEffect, useRef } from 'react';

type Rgb = [number, number, number];

type Star = {
  x: number;
  y: number;
  size: number;
  depth: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
  tintStrength: number;
};

type RingParticle = {
  angle: number;
  size: number;
  lane: number;
  speed: number;
  phase: number;
  colorSeed: number;
  colorOffset: number;
};

type Planet = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  driftX: number;
  driftY: number;
  ringed: boolean;
};

type OrbitGeometry = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  tilt: number;
};

type CloudSprites = {
  alpha: HTMLCanvasElement;
  active: HTMLCanvasElement;
  accent: HTMLCanvasElement;
  activeContext: CanvasRenderingContext2D;
  lastActiveColor: string;
};

type Scene = {
  width: number;
  height: number;
  compact: boolean;
  stars: Star[];
  ringParticles: RingParticle[];
  planets: Planet[];
  orbit: OrbitGeometry;
  clouds: CloudSprites;
};

const TAU = Math.PI * 2;
const STAR_COLOR_FADE_MS = 1500;
const DEFAULT_ACTIVE_COLOR: Rgb = [0, 175, 255];
const CLOUD_ACCENT: Rgb = [72, 78, 255];
const DEEP_SPACE: Rgb = [10, 14, 54];
const DARK_STAR_NEUTRAL: Rgb = [225, 234, 255];
const LIGHT_STAR_NEUTRAL: Rgb = [42, 53, 88];
const BRAND_STAR_COLORS: readonly Rgb[] = [
  [0, 175, 255],
  [255, 183, 0],
  [7, 236, 152],
  [255, 111, 97],
  [127, 84, 255],
  [233, 14, 230],
];

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha})`;
}

function mixRgb(first: Rgb, second: Rgb, amount: number): Rgb {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
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

function getPaletteColor(index: number, activeColor: Rgb): Rgb {
  return index === 0
    ? activeColor
    : BRAND_STAR_COLORS[(index - 1) % BRAND_STAR_COLORS.length];
}

function getAnimatedStarColor(
  seed: number,
  offset: number,
  time: number,
  activeColor: Rgb,
  neutralColor: Rgb,
  tintStrength: number,
) {
  const localTime = time + offset;
  const segment = Math.floor(localTime / STAR_COLOR_FADE_MS);
  const progress = smoothstep((localTime % STAR_COLOR_FADE_MS) / STAR_COLOR_FADE_MS);
  const paletteSize = BRAND_STAR_COLORS.length + 1;
  const fromIndex = Math.floor(seededRandom(seed * 31.7 + segment * 17.3) * paletteSize);
  const toIndex = Math.floor(seededRandom(seed * 31.7 + (segment + 1) * 17.3) * paletteSize);
  const transitioningColor = mixRgb(
    getPaletteColor(fromIndex, activeColor),
    getPaletteColor(toIndex, activeColor),
    progress,
  );
  return mixRgb(neutralColor, transitioningColor, tintStrength);
}

function createCloudAlphaSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 760;
  canvas.height = 380;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.globalCompositeOperation = 'lighter';
  context.filter = 'blur(18px)';
  for (let index = 0; index < 6; index += 1) {
    const y = canvas.height * (0.34 + index * 0.055);
    const bend = (seededRandom(index * 4.7 + 20) - 0.5) * canvas.height * 0.34;
    context.strokeStyle = `rgba(255, 255, 255, ${0.07 + index * 0.008})`;
    context.lineWidth = 18 + seededRandom(index * 6.3 + 21) * 22;
    context.beginPath();
    context.moveTo(canvas.width * 0.08, y);
    context.bezierCurveTo(
      canvas.width * 0.3,
      y - bend,
      canvas.width * 0.62,
      y + bend,
      canvas.width * 0.92,
      y - bend * 0.25,
    );
    context.stroke();
  }

  context.filter = 'blur(11px)';
  for (let index = 0; index < 34; index += 1) {
    const broadLayer = index < 10;
    const x = canvas.width * (0.12 + seededRandom(index * 5.1 + 1) * 0.76);
    const y = canvas.height * (0.2 + seededRandom(index * 7.7 + 2) * 0.62);
    const radius = canvas.width * (
      broadLayer
        ? 0.13 + seededRandom(index * 9.3 + 3) * 0.07
        : 0.035 + seededRandom(index * 9.3 + 3) * 0.065
    );
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const coreAlpha = broadLayer
      ? 0.11 + seededRandom(index * 11.9 + 4) * 0.1
      : 0.16 + seededRandom(index * 11.9 + 4) * 0.14;
    gradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(0.28, `rgba(255, 255, 255, ${coreAlpha * 0.68})`);
    gradient.addColorStop(0.66, `rgba(255, 255, 255, ${coreAlpha * 0.14})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.filter = 'none';

  return canvas;
}

function createTintCanvas(alphaCanvas: HTMLCanvasElement, color: Rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = alphaCanvas.width;
  canvas.height = alphaCanvas.height;
  const context = canvas.getContext('2d');
  if (!context) return { canvas, context: null };

  context.drawImage(alphaCanvas, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(color, 1);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-over';
  return { canvas, context };
}

function createCloudSprites(): CloudSprites | null {
  const alpha = createCloudAlphaSprite();
  const activeTint = createTintCanvas(alpha, DEFAULT_ACTIVE_COLOR);
  const accentTint = createTintCanvas(alpha, CLOUD_ACCENT);
  if (!activeTint.context || !accentTint.context) return null;

  return {
    alpha,
    active: activeTint.canvas,
    accent: accentTint.canvas,
    activeContext: activeTint.context,
    lastActiveColor: '',
  };
}

function updateActiveCloudTint(clouds: CloudSprites, color: Rgb) {
  const quantizedColor: Rgb = [
    Math.round(color[0] / 12) * 12,
    Math.round(color[1] / 12) * 12,
    Math.round(color[2] / 12) * 12,
  ];
  const colorKey = `${quantizedColor[0]}-${quantizedColor[1]}-${quantizedColor[2]}`;
  if (colorKey === clouds.lastActiveColor) return;

  const { activeContext: context, active, alpha } = clouds;
  context.clearRect(0, 0, active.width, active.height);
  context.globalCompositeOperation = 'source-over';
  context.drawImage(alpha, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = rgba(quantizedColor, 1);
  context.fillRect(0, 0, active.width, active.height);
  context.globalCompositeOperation = 'source-over';
  clouds.lastActiveColor = colorKey;
}

function createScene(width: number, height: number, clouds: CloudSprites): Scene {
  const compact = width < 720;
  const starCount = compact
    ? clamp(Math.round((width * height) / 5200), 72, 105)
    : clamp(Math.round((width * height) / 8600), 110, 190);
  const ringParticleCount = compact ? 86 : 168;
  const stars = Array.from({ length: starCount }, (_, index): Star => ({
    x: seededRandom(index * 3.1 + 1),
    y: seededRandom(index * 5.7 + 2),
    size: 0.45 + seededRandom(index * 7.9 + 3) * 1.65,
    depth: 0.35 + seededRandom(index * 9.1 + 4) * 0.65,
    phase: seededRandom(index * 11.3 + 5) * TAU,
    colorSeed: index * 1.73 + 0.41,
    colorOffset: seededRandom(index * 13.7 + 6) * STAR_COLOR_FADE_MS,
    tintStrength: 0.28 + seededRandom(index * 15.1 + 7) * 0.72,
  }));
  const ringParticles = Array.from(
    { length: ringParticleCount },
    (_, index): RingParticle => ({
      angle: seededRandom(index * 4.3 + 8) * TAU,
      size: 0.65 + seededRandom(index * 6.7 + 9) * 1.9,
      lane: Math.floor(seededRandom(index * 8.9 + 10) * 4),
      speed: 0.000026 + seededRandom(index * 10.1 + 11) * 0.000012,
      phase: seededRandom(index * 12.5 + 12) * TAU,
      colorSeed: index * 2.11 + 1.7,
      colorOffset: seededRandom(index * 14.3 + 13) * STAR_COLOR_FADE_MS,
    }),
  );
  const planets: Planet[] = [
    { x: 0.91, y: 0.25, size: compact ? 0.054 : 0.09, speed: 0.000021, phase: 0.3, driftX: 14, driftY: 8, ringed: false },
    { x: 0.025, y: 0.78, size: compact ? 0.045 : 0.072, speed: 0.000017, phase: 2.1, driftX: 7, driftY: 11, ringed: true },
    { x: 0.39, y: 0.56, size: 0.027, speed: 0.000026, phase: 4.2, driftX: 8, driftY: 6, ringed: false },
    { x: 0.79, y: 0.73, size: 0.042, speed: 0.000019, phase: 5.4, driftX: 10, driftY: 9, ringed: false },
    { x: 0.58, y: 0.16, size: 0.021, speed: 0.000024, phase: 1.4, driftX: 7, driftY: 10, ringed: true },
  ];
  const orbit: OrbitGeometry = compact
    ? {
        centerX: width * 0.47,
        centerY: height * 0.7,
        radiusX: width * 0.91,
        radiusY: Math.max(height * 0.27, 125),
        tilt: 0.14,
      }
    : {
        centerX: width * 0.34,
        centerY: height * 0.82,
        radiusX: width * 0.76,
        radiusY: Math.max(height * 0.35, 210),
        tilt: 0.14,
      };
  return { width, height, compact, stars, ringParticles, planets, orbit, clouds };
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: Rgb,
  alpha: number,
) {
  if (size > 1.35) {
    context.fillStyle = rgba(color, alpha * 0.18);
    context.beginPath();
    context.arc(x, y, size * 3.1, 0, TAU);
    context.fill();
  }

  context.fillStyle = rgba(color, alpha);
  context.beginPath();
  context.arc(x, y, size, 0, TAU);
  context.fill();
}

function drawBackgroundWash(
  context: CanvasRenderingContext2D,
  scene: Scene,
  activeColor: Rgb,
  isDark: boolean,
) {
  const { width, height } = scene;
  const centerX = scene.compact ? width * 0.52 : width * 0.48;
  const centerY = scene.compact ? height * 0.57 : height * 0.62;
  const radius = Math.max(width, height) * 0.78;
  const wash = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const centerColor = mixRgb(DEEP_SPACE, activeColor, 0.24);
  wash.addColorStop(0, rgba(centerColor, isDark ? 0.12 : 0.024));
  wash.addColorStop(0.48, rgba(DEEP_SPACE, isDark ? 0.065 : 0.012));
  wash.addColorStop(1, rgba(DEEP_SPACE, 0));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function drawFieldStars(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  const neutralColor = isDark ? DARK_STAR_NEUTRAL : LIGHT_STAR_NEUTRAL;

  for (const star of scene.stars) {
    const motionTime = reducedMotion ? 0 : time;
    const x = star.x * scene.width + Math.sin(motionTime * 0.00022 + star.phase) * 13 * star.depth;
    const y = star.y * scene.height + Math.cos(motionTime * 0.00017 + star.phase) * 9 * star.depth;
    const twinkle = reducedMotion ? 0.72 : 0.58 + Math.sin(time * 0.0013 + star.phase) * 0.28;
    const color = getAnimatedStarColor(
      star.colorSeed,
      star.colorOffset,
      reducedMotion ? 0 : time,
      activeColor,
      neutralColor,
      star.tintStrength,
    );
    const alpha = (isDark ? 0.34 : 0.2) * star.depth * twinkle;
    drawStar(context, x, y, star.size * (0.72 + star.depth * 0.5), color, alpha);
  }
}

function drawRingTrails(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  const { orbit } = scene;
  const motionTime = reducedMotion ? 0 : time;
  context.save();
  context.translate(orbit.centerX, orbit.centerY);
  context.rotate(orbit.tilt);

  for (let lane = 0; lane < 4; lane += 1) {
    const laneScale = 0.91 + lane * 0.052;
    const trailColor = mixRgb(activeColor, CLOUD_ACCENT, lane * 0.16);
    context.lineWidth = 0.65 + lane * 0.28;
    context.strokeStyle = rgba(trailColor, isDark ? 0.09 - lane * 0.01 : 0.045 - lane * 0.005);
    context.setLineDash([]);
    context.beginPath();
    context.ellipse(0, 0, orbit.radiusX * laneScale, orbit.radiusY * laneScale, 0, 0, TAU);
    context.stroke();

    context.lineWidth = 1.05 + lane * 0.24;
    context.strokeStyle = rgba(trailColor, isDark ? 0.17 : 0.075);
    context.setLineDash([
      orbit.radiusX * (0.17 + lane * 0.015),
      orbit.radiusX * 0.055,
      orbit.radiusX * 0.045,
      orbit.radiusX * 0.08,
    ]);
    context.lineDashOffset = -motionTime * (0.014 + lane * 0.002);
    context.beginPath();
    context.ellipse(0, 0, orbit.radiusX * laneScale, orbit.radiusY * laneScale, 0, 0, TAU);
    context.stroke();
  }

  context.setLineDash([]);
  context.restore();
}

function drawCloudCore(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  updateActiveCloudTint(scene.clouds, mixRgb(activeColor, CLOUD_ACCENT, 0.16));
  const motionTime = reducedMotion ? 0 : time;
  const centerX = scene.compact ? scene.width * 0.5 : scene.width * 0.46;
  const centerY = scene.compact ? scene.height * 0.61 : scene.height * 0.66;
  const cloudWidth = Math.min(scene.width * (scene.compact ? 1.15 : 0.82), 1120);
  const cloudHeight = cloudWidth * 0.5;
  const driftX = Math.sin(motionTime * 0.000052) * (scene.compact ? 8 : 16);
  const driftY = Math.cos(motionTime * 0.000041) * 9;
  const scalePulse = 1 + Math.sin(motionTime * 0.000036) * 0.025;

  context.save();
  context.globalCompositeOperation = isDark ? 'screen' : 'source-over';
  context.translate(centerX + driftX, centerY + driftY);
  context.rotate(-0.055 + Math.sin(motionTime * 0.000021) * 0.018);
  context.scale(scalePulse, scalePulse);
  context.globalAlpha = isDark ? 0.4 : 0.085;
  context.drawImage(
    scene.clouds.accent,
    -cloudWidth * 0.58,
    -cloudHeight * 0.52,
    cloudWidth * 1.16,
    cloudHeight * 1.04,
  );
  context.globalAlpha = isDark ? 0.7 : 0.155;
  context.drawImage(
    scene.clouds.active,
    -cloudWidth * 0.5,
    -cloudHeight * 0.5,
    cloudWidth,
    cloudHeight,
  );
  context.restore();

  const glowRadius = Math.max(cloudWidth * 0.42, 160);
  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  glow.addColorStop(0, rgba(mixRgb(activeColor, [120, 170, 255], 0.28), isDark ? 0.04 : 0.018));
  glow.addColorStop(0.46, rgba(activeColor, isDark ? 0.018 : 0.008));
  glow.addColorStop(1, rgba(activeColor, 0));
  context.fillStyle = glow;
  context.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);
}

function drawRingParticles(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  const neutralColor = isDark ? DARK_STAR_NEUTRAL : LIGHT_STAR_NEUTRAL;
  const { orbit } = scene;
  const cosTilt = Math.cos(orbit.tilt);
  const sinTilt = Math.sin(orbit.tilt);
  const motionTime = reducedMotion ? 0 : time;

  for (const particle of scene.ringParticles) {
    const angle = particle.angle + motionTime * particle.speed;
    const laneScale = 0.91 + particle.lane * 0.052;
    const localX = Math.cos(angle) * orbit.radiusX * laneScale;
    const localY = Math.sin(angle) * orbit.radiusY * laneScale;
    const x = orbit.centerX + localX * cosTilt - localY * sinTilt;
    const y = orbit.centerY + localX * sinTilt + localY * cosTilt;
    const depth = (Math.sin(angle) + 1) * 0.5;
    const twinkle = reducedMotion ? 0.78 : 0.68 + Math.sin(time * 0.0016 + particle.phase) * 0.3;
    const color = getAnimatedStarColor(
      particle.colorSeed,
      particle.colorOffset,
      motionTime,
      activeColor,
      neutralColor,
      0.82,
    );
    const alpha = (isDark ? 0.88 : 0.4) * (0.5 + depth * 0.5) * twinkle;
    const size = particle.size * (0.84 + depth * 0.76);
    drawStar(context, x, y, size, color, alpha);
  }
}

function drawPlanet(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  activeColor: Rgb,
  isDark: boolean,
  ringed: boolean,
  phase: number,
) {
  const rimColor = mixRgb(activeColor, [112, 126, 255], 0.38);
  const atmosphereAlpha = isDark ? 0.34 : 0.13;

  if (ringed) {
    context.save();
    context.translate(x, y);
    context.rotate(0.32 + phase * 0.025);
    context.scale(1, 0.34);
    context.strokeStyle = rgba(rimColor, isDark ? 0.26 : 0.1);
    context.lineWidth = Math.max(1, radius * 0.045);
    context.beginPath();
    context.ellipse(0, 0, radius * 1.75, radius * 1.05, 0, 0, TAU);
    context.stroke();
    context.restore();
  }

  const gradient = context.createRadialGradient(
    x - radius * 0.32,
    y - radius * 0.36,
    radius * 0.06,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, rgba(rimColor, isDark ? 0.62 : 0.3));
  gradient.addColorStop(0.27, rgba(mixRgb(DEEP_SPACE, rimColor, 0.24), isDark ? 0.92 : 0.38));
  gradient.addColorStop(0.78, rgba(DEEP_SPACE, isDark ? 0.96 : 0.46));
  gradient.addColorStop(1, rgba([2, 4, 18], isDark ? 0.98 : 0.5));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();

  context.strokeStyle = rgba(rimColor, atmosphereAlpha);
  context.lineWidth = Math.max(0.75, radius * 0.025);
  context.beginPath();
  context.arc(x, y, radius + context.lineWidth * 0.5, 0, TAU);
  context.stroke();
}

function drawPlanets(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  const planetCount = scene.compact ? 3 : scene.planets.length;
  const minDimension = Math.min(scene.width, scene.height);
  const motionTime = reducedMotion ? 0 : time;

  for (let index = 0; index < planetCount; index += 1) {
    const planet = scene.planets[index];
    const phase = planet.phase + motionTime * planet.speed;
    const x = planet.x * scene.width + Math.sin(phase) * planet.driftX;
    const y = planet.y * scene.height + Math.cos(phase) * planet.driftY;
    drawPlanet(
      context,
      x,
      y,
      minDimension * planet.size,
      activeColor,
      isDark,
      planet.ringed,
      planet.phase,
    );
  }
}

function drawScene(
  context: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  activeColor: Rgb,
  isDark: boolean,
  reducedMotion: boolean,
) {
  context.clearRect(0, 0, scene.width, scene.height);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  drawBackgroundWash(context, scene, activeColor, isDark);
  drawFieldStars(context, scene, time, activeColor, isDark, reducedMotion);
  drawRingTrails(context, scene, time, activeColor, isDark, reducedMotion);
  drawCloudCore(context, scene, time, activeColor, isDark, reducedMotion);
  drawRingParticles(context, scene, time, activeColor, isDark, reducedMotion);
  drawPlanets(context, scene, time, activeColor, isDark, reducedMotion);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
}

export default function AnimatedBackground({ activeColor }: { activeColor: string }) {
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
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const cloudSprites = createCloudSprites();
    if (!cloudSprites) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    let scene: Scene | null = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastPaintTime = 0;
    let previousTime = performance.now();
    let isDark = document.documentElement.classList.contains('dark');
    let reducedMotion = motionPreference.matches;
    const currentColor: Rgb = [...targetColorRef.current];

    const paint = (time: number) => {
      if (!scene) return;
      const elapsed = clamp(time - previousTime, 0, 64);
      previousTime = time;
      const colorEase = 1 - Math.exp(-elapsed / 240);
      currentColor[0] += (targetColorRef.current[0] - currentColor[0]) * colorEase;
      currentColor[1] += (targetColorRef.current[1] - currentColor[1]) * colorEase;
      currentColor[2] += (targetColorRef.current[2] - currentColor[2]) * colorEase;
      drawScene(context, scene, time, currentColor, isDark, reducedMotion);
    };

    const animate = (time: number) => {
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
      previousTime = performance.now();
      lastPaintTime = 0;
      if (reducedMotion || document.hidden) {
        paint(previousTime);
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      const dprLimit = coarsePointer.matches ? 1.25 : 1.5;
      const maxBackingPixels = coarsePointer.matches ? 3_000_000 : 6_000_000;
      const pixelBudgetRatio = Math.sqrt(maxBackingPixels / (width * height));
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit, pixelBudgetRatio);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = createScene(width, height, cloudSprites);
      paint(performance.now());
    };

    const scheduleResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    const handleMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      if (reducedMotion) {
        currentColor[0] = targetColorRef.current[0];
        currentColor[1] = targetColorRef.current[1];
        currentColor[2] = targetColorRef.current[2];
      }
      startAnimation();
    };

    const handleVisibility = () => startAnimation();
    const handleThemeChange = () => {
      isDark = document.documentElement.classList.contains('dark');
      if (reducedMotion) paint(performance.now());
    };

    redrawStaticSceneRef.current = () => {
      if (!reducedMotion) return;
      currentColor[0] = targetColorRef.current[0];
      currentColor[1] = targetColorRef.current[1];
      currentColor[2] = targetColorRef.current[2];
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    const themeObserver = new MutationObserver(handleThemeChange);
    resizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    motionPreference.addEventListener('change', handleMotionPreference);
    document.addEventListener('visibilitychange', handleVisibility);
    resize();
    startAnimation();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motionPreference.removeEventListener('change', handleMotionPreference);
      document.removeEventListener('visibilitychange', handleVisibility);
      redrawStaticSceneRef.current = null;
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <canvas ref={canvasRef} className="cosmic-canvas" />
      <div className="ambient-noise" />
    </div>
  );
}
