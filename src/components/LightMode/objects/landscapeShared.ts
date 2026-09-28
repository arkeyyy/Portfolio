import { clamp } from '../core/math';

type ForestSkylinePoint = readonly [x: number, y: number];

function sampleForestSkyline(
  skyline: ReadonlyArray<ForestSkylinePoint>,
  x: number,
) {
  for (let index = 0; index < skyline.length - 1; index += 1) {
    const start = skyline[index];
    const end = skyline[index + 1];
    if (x < start[0] || x > end[0]) continue;
    const mix = clamp((x - start[0]) / Math.max(0.0001, end[0] - start[0]), 0, 1);
    const easedMix = mix * mix * (3 - 2 * mix);
    return start[1] + (end[1] - start[1]) * easedMix;
  }
  return x <= skyline[0][0] ? skyline[0][1] : skyline[skyline.length - 1][1];
}

export type { ForestSkylinePoint };
export { sampleForestSkyline };

