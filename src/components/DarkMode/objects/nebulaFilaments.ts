import { clamp, seededRandom, smoothstep, TAU } from '../core/math';

export type NebulaFilamentSprites = {
  distant: HTMLCanvasElement;
  illuminated: HTMLCanvasElement;
  patches: readonly SmokePatch[];
  dustPlane: SmokePlane;
  gasPlane: SmokePlane;
  lastMotionTime: number;
};

type GasNoise = { size: number; values: Float32Array };
type SmokePlane = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D | null };

type SmokePatch = {
  x: number;
  y: number;
  atlasX: number;
  atlasY: number;
  phase: number;
  rate: number;
  driftX: number;
  driftY: number;
  curl: number;
};

const TEXTURE_WIDTH = 640;
const TEXTURE_HEIGHT = 320;
const PATCH_SIZE = 240;
const PATCH_STRIDE = 160;
const PATCH_GUTTER = 2;
const PATCH_CELL = PATCH_SIZE + PATCH_GUTTER * 2;
const PATCH_COLUMNS = 4;
const PATCH_ROWS = 2;
const FLOW_MARGIN = 64;

function createSmokePlane(): SmokePlane {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH + FLOW_MARGIN * 2;
  canvas.height = TEXTURE_HEIGHT + FLOW_MARGIN * 2;
  return { canvas, context: canvas.getContext('2d') };
}

function createSmokePatches(): SmokePatch[] {
  return Array.from({ length: PATCH_COLUMNS * PATCH_ROWS }, (_, index) => {
    const seed = 61_307 + index * 37.9;
    return {
      x: (index % PATCH_COLUMNS + 0.5) * PATCH_STRIDE,
      y: (Math.floor(index / PATCH_COLUMNS) + 0.5) * PATCH_STRIDE,
      atlasX: index % PATCH_COLUMNS * PATCH_CELL + PATCH_GUTTER,
      atlasY: Math.floor(index / PATCH_COLUMNS) * PATCH_CELL + PATCH_GUTTER,
      phase: seededRandom(seed) * TAU,
      rate: 0.00013 + seededRandom(seed + 1.7) * 0.00008,
      driftX: 7 + seededRandom(seed + 3.1) * 6,
      driftY: 5 + seededRandom(seed + 5.3) * 5,
      curl: (seededRandom(seed + 7.9) > 0.5 ? 1 : -1)
        * (0.035 + seededRandom(seed + 9.7) * 0.035),
    };
  });
}

function smokeWeight(position: number, center: number) {
  return smoothstep(clamp((PATCH_SIZE * 0.5 - Math.abs(position - center)) / 80, 0, 1));
}

// Bake overlapping, feathered pieces instead of moving the whole nebula as a
// flat card. Atlas gutters prevent neighbouring pieces bleeding when scaled.
function bakeSmokeAtlas(context: CanvasRenderingContext2D, patches: readonly SmokePatch[]) {
  const source = context.getImageData(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const xWeights = new Float32Array(TEXTURE_WIDTH);
  const yWeights = new Float32Array(TEXTURE_HEIGHT);
  for (let x = 0; x < TEXTURE_WIDTH; x += 1) {
    for (let column = 0; column < PATCH_COLUMNS; column += 1) {
      xWeights[x] += smokeWeight(x, (column + 0.5) * PATCH_STRIDE);
    }
  }
  for (let y = 0; y < TEXTURE_HEIGHT; y += 1) {
    for (let row = 0; row < PATCH_ROWS; row += 1) {
      yWeights[y] += smokeWeight(y, (row + 0.5) * PATCH_STRIDE);
    }
  }
  context.canvas.width = PATCH_COLUMNS * PATCH_CELL;
  context.canvas.height = PATCH_ROWS * PATCH_CELL;
  const atlas = context.createImageData(context.canvas.width, context.canvas.height);
  for (const patch of patches) {
    for (let y = 0; y < PATCH_SIZE; y += 1) {
      const sourceY = patch.y - PATCH_SIZE * 0.5 + y;
      if (sourceY < 0 || sourceY >= TEXTURE_HEIGHT) continue;
      const weightY = smokeWeight(sourceY, patch.y) / yWeights[sourceY];
      for (let x = 0; x < PATCH_SIZE; x += 1) {
        const sourceX = patch.x - PATCH_SIZE * 0.5 + x;
        if (sourceX < 0 || sourceX >= TEXTURE_WIDTH) continue;
        const weight = weightY * smokeWeight(sourceX, patch.x) / xWeights[sourceX];
        if (weight <= 0) continue;
        const from = (sourceY * TEXTURE_WIDTH + sourceX) * 4;
        const to = ((patch.atlasY + y) * context.canvas.width + patch.atlasX + x) * 4;
        atlas.data[to] = source.data[from];
        atlas.data[to + 1] = source.data[from + 1];
        atlas.data[to + 2] = source.data[from + 2];
        // Linear weights reconstruct the original premultiplied color in a
        // cached additive plane. Scene opacity is applied once, after mixing.
        atlas.data[to + 3] = source.data[from + 3] * weight;
      }
    }
  }
  context.putImageData(atlas, 0, 0);
}

function createGasNoise(size: number, seed: number): GasNoise {
  return {
    size,
    values: Float32Array.from(
      { length: size * size },
      (_, index) => seededRandom(seed + index * 13.7),
    ),
  };
}

// Only used while baking the two sprites. Wrapped lattices keep domain-warped
// samples continuous even where the gas folds back beyond the texture bounds.
function sampleGas(noise: GasNoise, x: number, y: number) {
  const gx = ((x % 1 + 1) % 1) * noise.size;
  const gy = ((y % 1 + 1) % 1) * noise.size;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const nx = (ix + 1) % noise.size;
  const ny = (iy + 1) % noise.size;
  const sx = smoothstep(gx - ix);
  const sy = smoothstep(gy - iy);
  const topLeft = noise.values[iy * noise.size + ix];
  const bottomLeft = noise.values[ny * noise.size + ix];
  const top = topLeft + (noise.values[iy * noise.size + nx] - topLeft) * sx;
  const bottom = bottomLeft + (noise.values[ny * noise.size + nx] - bottomLeft) * sx;
  return top + (bottom - top) * sy;
}

export function createNebulaFilamentSprites(): NebulaFilamentSprites {
  const distant = document.createElement('canvas');
  const illuminated = document.createElement('canvas');
  distant.width = illuminated.width = 640;
  distant.height = illuminated.height = 320;
  const dustContext = distant.getContext('2d');
  const gasContext = illuminated.getContext('2d');
  const patches = createSmokePatches();
  const sprites: NebulaFilamentSprites = {
    distant, illuminated, patches,
    dustPlane: createSmokePlane(),
    gasPlane: createSmokePlane(),
    lastMotionTime: Number.NaN,
  };
  if (!dustContext || !gasContext) return { ...sprites, patches: [] };

  const warp = createGasNoise(7, 48_170);
  const broad = createGasNoise(13, 49_713);
  const folds = createGasNoise(29, 51_191);
  const fine = createGasNoise(67, 53_317);
  const grain = createGasNoise(137, 55_109);
  const dust = dustContext.createImageData(640, 320);
  const gas = gasContext.createImageData(640, 320);

  // A broken, meandering emission ridge rather than stacked blurred circles.
  // Multiscale turbulence supplies detail; dark interstellar lanes separate
  // illuminated folds. Both stay feathered inside the existing cloud envelope.
  for (let y = 0; y < 320; y += 1) {
    const v = y / 320;
    for (let x = 0; x < 640; x += 1) {
      const u = x / 640;
      const edge = smoothstep(clamp(Math.min(u, 1 - u) / 0.17, 0, 1))
        * smoothstep(clamp(Math.min(v, 1 - v) / 0.2, 0, 1));
      if (edge === 0) continue;
      const wx = sampleGas(warp, u, v * 0.72);
      const wy = sampleGas(warp, u + 0.43, v * 0.72 + 0.27);
      const px = u + (wx - 0.5) * 0.14;
      const py = v + (wy - 0.5) * 0.26;
      const mass = sampleGas(broad, px * 0.86, py * 0.72);
      const fold = sampleGas(folds, px, py * 0.82);
      const detail = sampleGas(fine, px, py);
      const fleck = sampleGas(grain, px, py);
      const spine = 0.49 + Math.sin(u * TAU * 1.13 + 0.4) * 0.13
        + (wx - 0.5) * 0.13;
      const envelope = Math.exp(-Math.pow((v - spine) / (0.12 + mass * 0.13), 2)) * edge;
      const turbulence = mass * 0.47 + fold * 0.29 + detail * 0.17 + fleck * 0.07;
      const density = Math.pow(clamp((turbulence - 0.31) * 2.55, 0, 1), 1.8);
      const lane = 1 - smoothstep(clamp((fold - 0.26) / 0.36, 0, 1));
      const ridge = Math.pow(1 - Math.abs(fold * 2 - 1), 5) * detail;
      const emission = envelope * (density * 0.68 + ridge * 0.24)
        * (1 - lane * 0.78);
      // Cooler illuminated gas, with restrained lilac/rose on its outer folds.
      // Section-colored cloud light underneath remains the dominant hue.
      const rose = smoothstep(clamp((mass + (v - spine) * 0.9 - 0.44) * 3, 0, 1));
      const index = (y * 640 + x) * 4;
      gas.data[index] = 93 + rose * 78 + ridge * 30;
      gas.data[index + 1] = 153 - rose * 52 + ridge * 38;
      gas.data[index + 2] = 206 - rose * 8 + ridge * 24;
      gas.data[index + 3] = emission * 205;
      dust.data[index] = 10;
      dust.data[index + 1] = 8;
      dust.data[index + 2] = 28;
      dust.data[index + 3] = envelope * (lane * 0.58 + (1 - density) * 0.17) * 255;
    }
  }
  dustContext.putImageData(dust, 0, 0);
  gasContext.putImageData(gas, 0, 0);

  // Embedded stellar pinpoints are baked once, not another animated star loop.
  for (let index = 0; index < 230; index += 1) {
    const seed = 58_117 + index * 19.3;
    const u = 0.13 + seededRandom(seed) * 0.74;
    const v = 0.49 + Math.sin(u * TAU * 1.13 + 0.4) * 0.13
      + (seededRandom(seed + 1.7) - 0.5) * 0.29;
    const radius = 0.22 + seededRandom(seed + 3.9) * 0.42;
    gasContext.fillStyle = `rgba(202,218,255,${0.12 + seededRandom(seed + 7.1) * 0.38})`;
    gasContext.beginPath();
    gasContext.arc(u * 640, v * 320, radius, 0, TAU);
    gasContext.fill();
  }
  bakeSmokeAtlas(dustContext, patches);
  bakeSmokeAtlas(gasContext, patches);
  return sprites;
}

function updateSmokePlanes(
  sprites: NebulaFilamentSprites,
  motionTime: number,
) {
  if (sprites.lastMotionTime === motionTime) return;
  for (let pass = 0; pass < 2; pass += 1) {
    const plane = pass === 0 ? sprites.dustPlane : sprites.gasPlane;
    const context = plane.context;
    if (!context) continue;
    // Only these small, fixed offscreen planes are cleared. Feather weights
    // add instead of stacking opacity, avoiding overlap seams at every alpha.
    context.clearRect(0, 0, plane.canvas.width, plane.canvas.height);
    context.globalCompositeOperation = 'lighter';
    const sprite = pass === 0 ? sprites.distant : sprites.illuminated;
    for (const patch of sprites.patches) {
      const phase = motionTime * patch.rate + patch.phase;
      const roll = Math.sin(phase) - Math.sin(patch.phase);
      const rise = Math.cos(phase * 0.79) - Math.cos(patch.phase * 0.79);
      const eddy = Math.sin(phase * 1.31 + 1.2) - Math.sin(patch.phase * 1.31 + 1.2);
      const stretch = 1 + roll * 0.035;
      context.save();
      context.translate(
        FLOW_MARGIN + patch.x + roll * patch.driftX,
        FLOW_MARGIN + patch.y + rise * patch.driftY,
      );
      context.rotate(eddy * patch.curl);
      // Opposing stretch and gentle shear make local curls billow without
      // inflating the entire cloud or synchronizing into a breathing pulse.
      context.transform(stretch, eddy * 0.022, rise * 0.018, 1 / stretch, 0, 0);
      context.drawImage(
        sprite,
        patch.atlasX, patch.atlasY, PATCH_SIZE, PATCH_SIZE,
        -PATCH_SIZE * 0.5, -PATCH_SIZE * 0.5, PATCH_SIZE, PATCH_SIZE,
      );
      context.restore();
    }
  }
  sprites.lastMotionTime = motionTime;
}

// Each pocket rolls and stretches at its own pace. Its dust and emission share
// exactly the same flow, while neighbouring pockets overlap and mix softly.
// Analytic scene-time motion needs no simulation state or snapshot additions.
export function drawNebulaFilaments(
  context: CanvasRenderingContext2D,
  sprites: NebulaFilamentSprites,
  width: number,
  height: number,
  motionTime: number,
  alpha: number,
) {
  if (alpha <= 0.001) return;
  updateSmokePlanes(sprites, motionTime);
  const scaleX = width / TEXTURE_WIDTH;
  const scaleY = height / TEXTURE_HEIGHT;
  const x = -width * 0.5 - FLOW_MARGIN * scaleX;
  const y = -height * 0.5 - FLOW_MARGIN * scaleY;
  const planeWidth = sprites.dustPlane.canvas.width * scaleX;
  const planeHeight = sprites.dustPlane.canvas.height * scaleY;
  context.save();
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = alpha * 0.66;
  context.drawImage(sprites.dustPlane.canvas, x, y, planeWidth, planeHeight);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = alpha * 0.96;
  context.drawImage(sprites.gasPlane.canvas, x, y, planeWidth, planeHeight);
  context.restore();
}
