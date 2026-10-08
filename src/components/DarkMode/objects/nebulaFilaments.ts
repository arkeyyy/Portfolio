import { seededRandom, TAU } from '../core/math';

export type NebulaFilamentSprites = {
  distant: HTMLCanvasElement;
  illuminated: HTMLCanvasElement;
};

function createFilamentLayer(layer: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.globalCompositeOperation = 'lighter';
  // Short, branching gas ridges stay inside the broad nebula envelope. Their
  // luminosity comes from many fine strands, not another diffuse bloom.
  for (let ridge = 0; ridge < 15; ridge += 1) {
    const seed = 48_170 + layer * 809 + ridge * 53.7;
    const startX = 0.17 + seededRandom(seed) * 0.52;
    const reach = 0.1 + seededRandom(seed + 1.9) * 0.12;
    const height = 0.37 + seededRandom(seed + 4.1) * 0.27;
    const bend = (seededRandom(seed + 7.3) - 0.5) * 0.05;
    const phase = seededRandom(seed + 9.7) * TAU;
    const alpha = 0.04 + seededRandom(seed + 12.1) * 0.045;
    const color = layer === 0 ? '121,137,222' : '151,195,237';
    const tipFade = context.createLinearGradient(
      startX * canvas.width, 0, (startX + reach) * canvas.width, 0,
    );
    tipFade.addColorStop(0, `rgba(${color},0)`);
    tipFade.addColorStop(0.24, `rgba(${color},${alpha})`);
    tipFade.addColorStop(0.67, `rgba(${color},${alpha})`);
    tipFade.addColorStop(1, `rgba(${color},0)`);
    for (let strand = 0; strand < 3; strand += 1) {
      context.filter = strand === 0 ? 'blur(2px)' : 'blur(0.45px)';
      context.strokeStyle = tipFade;
      context.lineWidth = strand === 0 ? 3.5 : 0.55 + strand * 0.35;
      context.beginPath();
      for (let point = 0; point <= 58; point += 1) {
        const progress = point / 58;
        const taper = Math.sin(progress * Math.PI);
        const x = (startX + progress * reach) * canvas.width;
        const y = (
          height + Math.sin(progress * Math.PI) * bend
          + Math.sin((startX + progress * reach) * TAU + phase * 0.08) * 0.038
          + Math.sin(progress * TAU * 2.1 + phase) * 0.005 * taper
        ) * canvas.height + strand * 2 * taper;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
  }
  context.filter = 'none';
  context.globalCompositeOperation = 'destination-in';
  const edge = context.createRadialGradient(320, 160, 22, 320, 160, 312);
  edge.addColorStop(0, 'rgba(255,255,255,0.4)');
  edge.addColorStop(0.3, 'rgba(255,255,255,0.92)');
  edge.addColorStop(0.7, 'rgba(255,255,255,0.8)');
  edge.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = edge;
  context.fillRect(0, 0, 640, 320);
  context.globalCompositeOperation = 'source-over';
  return canvas;
}

export function createNebulaFilamentSprites(): NebulaFilamentSprites {
  return { distant: createFilamentLayer(0), illuminated: createFilamentLayer(1) };
}

// Called inside the nebula's depth-surface, position, rotation and scale. Small
// independent drift cannot detach the strands from their parent cloud.
export function drawNebulaFilaments(
  context: CanvasRenderingContext2D,
  sprites: NebulaFilamentSprites,
  width: number,
  height: number,
  motionTime: number,
  alpha: number,
) {
  context.globalAlpha = alpha * 0.58;
  context.drawImage(
    sprites.distant,
    -width * 0.51 + Math.sin(motionTime * 0.000017 + 0.7) * 2.5,
    -height * 0.51 + Math.cos(motionTime * 0.000014 + 1.2) * 1.6,
    width * 1.02,
    height * 1.02,
  );
  context.globalAlpha = alpha * 0.68;
  context.drawImage(
    sprites.illuminated,
    -width * 0.5 + Math.sin(motionTime * 0.000023 + 2.3) * 3,
    -height * 0.5 + Math.cos(motionTime * 0.000019 + 0.4) * 2,
    width,
    height,
  );
}
