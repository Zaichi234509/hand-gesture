import { GestureId, Point3D } from '../types';

function makePoints(coords: [number, number][]): Point3D[] {
  return coords.map(([x, y]) => ({ x, y, z: 0 }));
}

function mirrorHand(hand: Point3D[]): Point3D[] {
  return hand.map((pt) => ({ x: 1 - pt.x, y: pt.y, z: pt.z }));
}

const IDLE_HAND = makePoints([
  [0.5, 0.8],
  [0.44, 0.74],
  [0.41, 0.67],
  [0.42, 0.61],
  [0.44, 0.57],
  [0.45, 0.61],
  [0.45, 0.54],
  [0.46, 0.56],
  [0.47, 0.59],
  [0.49, 0.59],
  [0.49, 0.52],
  [0.5, 0.55],
  [0.5, 0.59],
  [0.53, 0.61],
  [0.53, 0.54],
  [0.53, 0.57],
  [0.53, 0.6],
  [0.57, 0.64],
  [0.57, 0.58],
  [0.56, 0.6],
  [0.55, 0.63],
]);

const OPEN_PALM_HAND = makePoints([
  [0.5, 0.76],
  [0.43, 0.7],
  [0.39, 0.62],
  [0.34, 0.55],
  [0.29, 0.49],
  [0.44, 0.56],
  [0.42, 0.45],
  [0.41, 0.37],
  [0.4, 0.3],
  [0.49, 0.54],
  [0.49, 0.42],
  [0.49, 0.34],
  [0.49, 0.27],
  [0.54, 0.56],
  [0.55, 0.44],
  [0.56, 0.37],
  [0.57, 0.3],
  [0.58, 0.59],
  [0.6, 0.49],
  [0.62, 0.42],
  [0.64, 0.36],
]);

const PEACE_HAND = makePoints([
  [0.5, 0.76],
  [0.44, 0.7],
  [0.43, 0.62],
  [0.46, 0.57],
  [0.51, 0.56],
  [0.44, 0.56],
  [0.42, 0.45],
  [0.4, 0.37],
  [0.38, 0.29],
  [0.49, 0.54],
  [0.51, 0.43],
  [0.53, 0.35],
  [0.55, 0.28],
  [0.54, 0.56],
  [0.54, 0.49],
  [0.54, 0.56],
  [0.53, 0.6],
  [0.58, 0.59],
  [0.58, 0.52],
  [0.58, 0.58],
  [0.56, 0.62],
]);

const FINGER_HEART_HAND = makePoints([
  [0.5, 0.76],
  [0.43, 0.69],
  [0.41, 0.6],
  [0.44, 0.5],
  [0.48, 0.42],
  [0.45, 0.55],
  [0.47, 0.47],
  [0.45, 0.43],
  [0.43, 0.42],
  [0.5, 0.54],
  [0.5, 0.48],
  [0.51, 0.55],
  [0.5, 0.6],
  [0.54, 0.56],
  [0.54, 0.5],
  [0.55, 0.57],
  [0.53, 0.61],
  [0.58, 0.59],
  [0.58, 0.53],
  [0.58, 0.59],
  [0.56, 0.63],
]);

const ILY_HAND = makePoints([
  [0.5, 0.76],
  [0.43, 0.7],
  [0.39, 0.62],
  [0.33, 0.56],
  [0.28, 0.51],
  [0.44, 0.56],
  [0.43, 0.45],
  [0.42, 0.37],
  [0.42, 0.29],
  [0.49, 0.54],
  [0.49, 0.48],
  [0.49, 0.56],
  [0.49, 0.6],
  [0.54, 0.56],
  [0.54, 0.49],
  [0.54, 0.57],
  [0.53, 0.61],
  [0.58, 0.59],
  [0.6, 0.49],
  [0.62, 0.41],
  [0.64, 0.34],
]);

const THUMBS_UP_HAND = makePoints([
  [0.45, 0.68],
  [0.45, 0.6],
  [0.46, 0.51],
  [0.46, 0.42],
  [0.46, 0.34],
  [0.53, 0.52],
  [0.58, 0.52],
  [0.55, 0.54],
  [0.51, 0.54],
  [0.53, 0.57],
  [0.58, 0.57],
  [0.55, 0.59],
  [0.51, 0.59],
  [0.53, 0.62],
  [0.58, 0.62],
  [0.55, 0.64],
  [0.51, 0.64],
  [0.52, 0.67],
  [0.57, 0.67],
  [0.54, 0.68],
  [0.5, 0.68],
]);

const HEART_LEFT_HAND = makePoints([
  [0.34, 0.68],
  [0.38, 0.64],
  [0.42, 0.61],
  [0.46, 0.59],
  [0.495, 0.58],
  [0.36, 0.5],
  [0.4, 0.4],
  [0.45, 0.39],
  [0.495, 0.43],
  [0.35, 0.52],
  [0.39, 0.41],
  [0.45, 0.4],
  [0.495, 0.44],
  [0.35, 0.55],
  [0.39, 0.44],
  [0.44, 0.43],
  [0.48, 0.46],
  [0.35, 0.58],
  [0.39, 0.48],
  [0.44, 0.47],
  [0.47, 0.49],
]);

const HEART_RIGHT_HAND = mirrorHand(HEART_LEFT_HAND);

export function getTargetSimulatedHands(gesture: GestureId | null): Point3D[][] {
  switch (gesture) {
    case 'open_palm':
      return [OPEN_PALM_HAND];
    case 'peace':
      return [PEACE_HAND];
    case 'finger_heart':
      return [FINGER_HEART_HAND];
    case 'ily':
      return [ILY_HAND];
    case 'thumbs_up':
      return [THUMBS_UP_HAND];
    case 'two_hand_heart':
      return [HEART_LEFT_HAND, HEART_RIGHT_HAND];
    default:
      return [IDLE_HAND];
  }
}

export function interpolateHands(
  current: Point3D[][],
  target: Point3D[][],
  alpha: number,
  timeSec: number
): Point3D[][] {
  const swayX = Math.sin(timeSec * 1.9) * 0.004;
  const swayY = Math.cos(timeSec * 1.4) * 0.004;

  return target.map((targetHand, hIdx) => {
    const prevHand = current[hIdx] ?? targetHand;
    return targetHand.map((pt, i) => {
      const prev = prevHand[i] ?? pt;
      const nx = prev.x + (pt.x + swayX - prev.x) * alpha;
      const ny = prev.y + (pt.y + swayY - prev.y) * alpha;
      const nz = prev.z + (pt.z - prev.z) * alpha;
      return { x: nx, y: ny, z: nz };
    });
  });
}
