export const TAU = Math.PI * 2;

export function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function snapToPixel(value: number, pixelRatio: number) {
  return Math.round(value * pixelRatio) / pixelRatio;
}

export function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}
