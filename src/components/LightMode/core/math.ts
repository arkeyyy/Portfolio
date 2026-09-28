const TAU = Math.PI * 2;
const DEGREE = Math.PI / 180;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp((value - edgeStart) / Math.max(edgeEnd - edgeStart, 0.0001), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export { TAU, DEGREE, clamp, smoothstep, positiveModulo, createSeededRandom };

