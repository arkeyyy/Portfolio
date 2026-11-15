import { clamp, seededRandom, smoothstep, TAU } from '../core/math';

export type NebulaFilamentSprites = {
  distant: HTMLCanvasElement;
  illuminated: HTMLCanvasElement;
};

type GasNoise = { size: number; values: Float32Array };

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
  if (!dustContext || !gasContext) return { distant, illuminated };

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
  return { distant, illuminated };
}

// Shares the nebula's depth surface and slow breathing. Dust and emission use
// one locked transform so lit edges cannot slide away from their dark channels.
export function drawNebulaFilaments(
  context: CanvasRenderingContext2D,
  sprites: NebulaFilamentSprites,
  width: number,
  height: number,
  motionTime: number,
  alpha: number,
) {
  const x = -width * 0.5 + Math.sin(motionTime * 0.000017 + 0.7) * 2;
  const y = -height * 0.5 + Math.cos(motionTime * 0.000014 + 1.2) * 1.5;
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = alpha * 0.66;
  context.drawImage(sprites.distant, x, y, width, height);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = alpha * 0.96;
  context.drawImage(sprites.illuminated, x, y, width, height);
}
