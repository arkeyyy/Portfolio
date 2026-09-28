import { clamp } from './math';

type QualityTier = 0 | 1 | 2;
type AdaptiveQuality = {
  tier: QualityTier;
  warmupUntil: number;
  changedAt: number;
  paintEma: number;
  overloadPaints: number;
  stablePaints: number;
  lateSamples: Uint8Array;
  sampleIndex: number;
  sampleCount: number;
  lateCount: number;
  triangleWeights: Float64Array;
  particleWeights: Float64Array;
};

const QUALITY_PROFILES = [
  { desktopFps: 60, mobileFps: 30, triangles: 1, particles: 1 },
  { desktopFps: 45, mobileFps: 27, triangles: 0.75, particles: 0.5 },
  { desktopFps: 30, mobileFps: 24, triangles: 0.5, particles: 0.25 },
] as const;
const QUALITY_FADE_MS = 650;

function createAdaptiveQuality(now: number): AdaptiveQuality {
  return {
    tier: 0, warmupUntil: now + 2000, changedAt: -Infinity,
    paintEma: 0, overloadPaints: 0, stablePaints: 0,
    lateSamples: new Uint8Array(120), sampleIndex: 0, sampleCount: 0, lateCount: 0,
    triangleWeights: new Float64Array([1, 1, 1, 1]),
    particleWeights: new Float64Array([1, 1, 1, 1]),
  };
}

function resetQualityMeasurements(quality: AdaptiveQuality, now: number) {
  quality.warmupUntil = now + 2000;
  quality.paintEma = 0;
  quality.overloadPaints = quality.stablePaints = 0;
  quality.sampleIndex = quality.sampleCount = quality.lateCount = 0;
  quality.lateSamples.fill(0);
}

function recordQualityPaint(
  quality: AdaptiveQuality,
  now: number,
  cost: number,
  scheduledElapsed: number,
  interval: number,
) {
  if (now < quality.warmupUntil) return;
  quality.paintEma = quality.sampleCount === 0 ? cost
    : quality.paintEma + (cost - quality.paintEma) * 0.05;
  quality.lateCount -= quality.lateSamples[quality.sampleIndex];
  const late = scheduledElapsed > interval * 1.35 ? 1 : 0;
  quality.lateSamples[quality.sampleIndex] = late;
  quality.lateCount += late;
  quality.sampleIndex = (quality.sampleIndex + 1) % quality.lateSamples.length;
  quality.sampleCount = Math.min(quality.sampleCount + 1, quality.lateSamples.length);
  quality.overloadPaints = quality.paintEma > interval * 0.72
    ? quality.overloadPaints + 1 : 0;
  quality.stablePaints = quality.paintEma < interval * 0.42 && late === 0
    ? quality.stablePaints + 1 : 0;
  if (now - quality.changedAt < 10_000) return;
  const overloaded = quality.overloadPaints >= 90
    || (quality.sampleCount === 120 && quality.lateCount > 18);
  if (overloaded && quality.tier < 2) {
    quality.tier = (quality.tier + 1) as QualityTier;
  } else if (quality.stablePaints >= 360 && quality.tier > 0) {
    quality.tier = (quality.tier - 1) as QualityTier;
  } else {
    return;
  }
  quality.changedAt = now;
  resetQualityMeasurements(quality, now);
}

function updateQualityWeights(quality: AdaptiveQuality, elapsed: number) {
  const profile = QUALITY_PROFILES[quality.tier];
  const step = Math.max(elapsed, 0) / QUALITY_FADE_MS;
  for (let band = 0; band < 4; band += 1) {
    const rank = (band + 1) * 0.25;
    const triangleTarget = rank <= profile.triangles ? 1 : 0;
    const particleTarget = rank <= profile.particles ? 1 : 0;
    quality.triangleWeights[band] += clamp(
      triangleTarget - quality.triangleWeights[band], -step, step,
    );
    quality.particleWeights[band] += clamp(
      particleTarget - quality.particleWeights[band], -step, step,
    );
  }
}

function qualityOpacity(rank: number, weights: Float64Array) {
  return weights[Math.min(Math.floor(rank * 4), 3)];
}

function qualityRank(index: number, salt: number) {
  let hash = (index ^ salt) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000;
}

export type { AdaptiveQuality, QualityTier };
export {
  QUALITY_PROFILES,
  createAdaptiveQuality,
  resetQualityMeasurements,
  recordQualityPaint,
  updateQualityWeights,
  qualityOpacity,
  qualityRank,
};

