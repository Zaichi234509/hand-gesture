import { GESTURE_DEFINITIONS } from '../data/defaultQuest';
import { CameraFilter, GestureId, Point3D } from '../types';

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

const FINGERTIPS = new Set([4, 8, 12, 16, 20]);

export function getFilterCss(filter: CameraFilter): string {
  switch (filter) {
    case 'warm_film':
      return 'contrast(1.03) saturate(1.08) sepia(0.12) brightness(1.03)';
    case 'mono':
      return 'grayscale(1) contrast(1.08) brightness(1.02)';
    default:
      return 'contrast(1.02) brightness(1.02)';
  }
}

export function drawSimulatorBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    20,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72
  );
  grad.addColorStop(0, '#232226');
  grad.addColorStop(1, '#151518');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid dots
  ctx.fillStyle = 'rgba(250, 248, 245, 0.06)';
  const step = 32;
  for (let x = step; x < width; x += step) {
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawHandsOverlay(
  ctx: CanvasRenderingContext2D,
  hands: Point3D[][],
  width: number,
  height: number,
  activeGesture: GestureId | null,
  holdProgress: number,
  anchor: { x: number; y: number } | null,
  isAlreadyUnlocked: boolean
): void {
  // Draw corner framing reticles
  drawCornerReticles(ctx, width, height, Boolean(activeGesture));

  if (!hands || hands.length === 0) return;

  for (const hand of hands) {
    if (hand.length < 21) continue;

    // Subtle soft glow behind palm center
    const palmX = hand[9].x * width;
    const palmY = hand[9].y * height;
    const glow = ctx.createRadialGradient(palmX, palmY, 4, palmX, palmY, 90);
    glow.addColorStop(
      0,
      activeGesture ? 'rgba(224, 99, 107, 0.16)' : 'rgba(250, 248, 245, 0.08)'
    );
    glow.addColorStop(1, 'rgba(224, 99, 107, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(palmX, palmY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Draw clean bone threads
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.65;
    ctx.strokeStyle = activeGesture
      ? 'rgba(252, 232, 234, 0.78)'
      : 'rgba(250, 248, 245, 0.56)';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const a = hand[startIdx];
      const b = hand[endIdx];
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }

    // Draw landmark nodes
    hand.forEach((pt, idx) => {
      const x = pt.x * width;
      const y = pt.y * height;
      const isTip = FINGERTIPS.has(idx);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 4.2 : 2.4, 0, Math.PI * 2);
      ctx.fillStyle = isTip
        ? activeGesture
          ? '#E0636B'
          : '#F5B8BC'
        : 'rgba(250, 248, 245, 0.88)';
      ctx.fill();

      if (isTip) {
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();
      }
    });
  }

  // Draw floating hold-ring + minimal pill near detected gesture anchor
  if (activeGesture && anchor) {
    const def = GESTURE_DEFINITIONS[activeGesture];
    const ax = Math.max(88, Math.min(width - 88, anchor.x * width));
    const ay = Math.max(54, Math.min(height - 54, anchor.y * height - 42));

    // Circular hold ring around anchor point
    const ringRadius = 22;
    const rawX = anchor.x * width;
    const rawY = anchor.y * height;

    ctx.save();
    ctx.beginPath();
    ctx.arc(rawX, rawY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (holdProgress > 0) {
      ctx.beginPath();
      ctx.arc(
        rawX,
        rawY,
        ringRadius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, holdProgress)
      );
      ctx.strokeStyle = '#E0636B';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Floating label pill above
    const statusText = isAlreadyUnlocked
      ? `${def.symbol} ${def.gestureName} · Unlocked`
      : `${def.symbol} ${def.gestureName}`;

    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(statusText).width;
    const pillW = textWidth + 24;
    const pillH = 28;
    const pillX = ax - pillW / 2;
    const pillY = ay - pillH / 2;

    ctx.fillStyle = 'rgba(24, 24, 27, 0.78)';
    roundRect(ctx, pillX, pillY, pillW, pillH, 999);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FAF8F5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, ax, ay + 0.5);
    ctx.restore();
  }
}

function drawCornerReticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  active: boolean
): void {
  const pad = 18;
  const len = 14;
  ctx.save();
  ctx.strokeStyle = active ? 'rgba(224, 99, 107, 0.75)' : 'rgba(250, 248, 245, 0.32)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + len);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + len, pad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - pad - len, pad);
  ctx.lineTo(width - pad, pad);
  ctx.lineTo(width - pad, pad + len);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pad, height - pad - len);
  ctx.lineTo(pad, height - pad);
  ctx.lineTo(pad + len, height - pad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - pad - len, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.lineTo(width - pad, height - pad - len);
  ctx.stroke();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function downloadKeepsakeSnapshot(options: {
  videoEl: HTMLVideoElement | null;
  overlayCanvas: HTMLCanvasElement | null;
  isSimulator: boolean;
  filter: CameraFilter;
  recipientName: string;
  senderName: string;
  caption: string;
}): void {
  const { videoEl, overlayCanvas, isSimulator, filter, recipientName, senderName, caption } =
    options;

  const cardW = 1080;
  const cardH = 1240;
  const pad = 64;
  const photoW = cardW - pad * 2;
  const photoH = 760;

  const out = document.createElement('canvas');
  out.width = cardW;
  out.height = cardH;
  const ctx = out.getContext('2d');
  if (!ctx) return;

  // Editorial cream card background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, cardW, cardH);

  // Subtle card inner border
  ctx.strokeStyle = 'rgba(24, 24, 27, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, cardW - 48, cardH - 48);

  // Clip photo area
  ctx.save();
  roundRect(ctx, pad, pad, photoW, photoH, 24);
  ctx.clip();

  if (!isSimulator && videoEl && videoEl.readyState >= 2) {
    ctx.save();
    ctx.filter = getFilterCss(filter);
    const vw = videoEl.videoWidth || 1280;
    const vh = videoEl.videoHeight || 720;
    const scale = Math.max(photoW / vw, photoH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = pad + (photoW - dw) / 2;
    const dy = pad + (photoH - dh) / 2;

    // Mirror selfie video
    ctx.translate(pad * 2 + photoW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, dx, dy, dw, dh);
    ctx.restore();
  }

  if (overlayCanvas) {
    ctx.drawImage(overlayCanvas, pad, pad, photoW, photoH);
  }
  ctx.restore();

  // Editorial typography footer
  ctx.fillStyle = '#18181B';
  ctx.font = 'italic 54px "Instrument Serif", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`For ${recipientName}`, pad, pad + photoH + 104);

  ctx.fillStyle = '#686662';
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(caption, pad, pad + photoH + 158);

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  ctx.fillStyle = '#9A968F';
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(`${dateStr.toUpperCase()}  ·  ${senderName.toUpperCase()}`, pad, cardH - 76);

  // Small minimal rose heart emblem bottom-right
  ctx.fillStyle = '#D45863';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('♥', cardW - pad, cardH - 74);

  const link = document.createElement('a');
  link.download = `for-${recipientName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'you'}-keepsake.png`;
  link.href = out.toDataURL('image/png');
  link.click();
}
