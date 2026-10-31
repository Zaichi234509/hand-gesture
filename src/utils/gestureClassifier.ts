import { DetectionFrame, GestureId, Point3D } from '../types';

export function dist2D(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(a: Point3D, b: Point3D, c: Point3D): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v1z = (a.z - b.z) * 0.35;

  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const v2z = (c.z - b.z) * 0.35;

  const dot = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.hypot(v1x, v1y, v1z);
  const mag2 = Math.hypot(v2x, v2y, v2z);

  if (mag1 < 1e-6 || mag2 < 1e-6) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function getPalmSize(lm: Point3D[]): number {
  return Math.max(0.045, dist2D(lm[0], lm[9]));
}

function isFingerExtended(lm: Point3D[], mcp: number, pip: number, tip: number): boolean {
  const wristToTip = dist2D(lm[0], lm[tip]);
  const wristToPip = dist2D(lm[0], lm[pip]);
  const wristToMcp = dist2D(lm[0], lm[mcp]);
  const jointAngle = angleDeg(lm[mcp], lm[pip], lm[tip]);

  return wristToTip > wristToPip * 1.11 && wristToTip > wristToMcp * 1.28 && jointAngle > 136;
}

function isFingerCurled(lm: Point3D[], mcp: number, pip: number, tip: number): boolean {
  const wristToTip = dist2D(lm[0], lm[tip]);
  const wristToPip = dist2D(lm[0], lm[pip]);
  const jointAngle = angleDeg(lm[mcp], lm[pip], lm[tip]);

  return wristToTip < wristToPip * 1.09 || jointAngle < 124;
}

function detectTwoHandHeart(
  h1: Point3D[],
  h2: Point3D[]
): { confidence: number; anchor: { x: number; y: number } } | null {
  const p1 = getPalmSize(h1);
  const p2 = getPalmSize(h2);
  const avgPalm = (p1 + p2) / 2;

  // Ensure two distinct hands rather than overlapping single hand
  if (dist2D(h1[9], h2[9]) < 0.3 * avgPalm) {
    return null;
  }

  // Style A: Classic two-hand heart (curved fingers meet at top, thumbs meet at bottom)
  const topIndexDist = Math.min(
    dist2D(h1[8], h2[8]),
    dist2D(h1[7], h2[7]),
    dist2D(h1[6], h2[6]),
    dist2D(h1[12], h2[12])
  );
  const bottomThumbDist = dist2D(h1[4], h2[4]);

  const topMidY = (h1[8].y + h2[8].y) / 2;
  const topMidX = (h1[8].x + h2[8].x) / 2;
  const thumbMidY = (h1[4].y + h2[4].y) / 2;
  const thumbMidX = (h1[4].x + h2[4].x) / 2;

  const knucklesSpread = Math.max(dist2D(h1[5], h2[5]), dist2D(h1[0], h2[0]));

  if (
    topIndexDist < 1.48 * avgPalm &&
    bottomThumbDist < 1.48 * avgPalm &&
    thumbMidY - topMidY > 0.18 * avgPalm &&
    knucklesSpread > 0.42 * avgPalm
  ) {
    return {
      confidence: 0.94,
      anchor: {
        x: (topMidX + thumbMidX) / 2,
        y: (topMidY + thumbMidY) / 2,
      },
    };
  }

  // Style B: Gen-Z finger-arch heart (curved middle PIPs at top, index tips touching at bottom)
  const archTopDist = Math.min(dist2D(h1[10], h2[10]), dist2D(h1[11], h2[11]));
  const indexBottomDist = dist2D(h1[8], h2[8]);
  const archMidY = (h1[10].y + h2[10].y) / 2;
  const archMidX = (h1[10].x + h2[10].x) / 2;

  if (
    archTopDist < 1.38 * avgPalm &&
    indexBottomDist < 1.28 * avgPalm &&
    topMidY - archMidY > 0.2 * avgPalm
  ) {
    return {
      confidence: 0.91,
      anchor: {
        x: (archMidX + topMidX) / 2,
        y: (archMidY + topMidY) / 2,
      },
    };
  }

  return null;
}

function classifySingleHand(
  lm: Point3D[]
): { gesture: GestureId; confidence: number; anchor: { x: number; y: number } } | null {
  const palm = getPalmSize(lm);

  const indexExt = isFingerExtended(lm, 5, 6, 8);
  const middleExt = isFingerExtended(lm, 9, 10, 12);
  const ringExt = isFingerExtended(lm, 13, 14, 16);
  const pinkyExt = isFingerExtended(lm, 17, 18, 20);

  const indexCurled = isFingerCurled(lm, 5, 6, 8);
  const middleCurled = isFingerCurled(lm, 9, 10, 12);
  const ringCurled = isFingerCurled(lm, 13, 14, 16);
  const pinkyCurled = isFingerCurled(lm, 17, 18, 20);

  // 1. ILY Sign (🤟): Thumb + Index + Pinky extended, Middle + Ring curled
  const thumbOutForIly =
    dist2D(lm[4], lm[10]) / palm > 0.5 && dist2D(lm[4], lm[13]) / palm > 0.62;
  if (indexExt && pinkyExt && middleCurled && ringCurled && thumbOutForIly) {
    return {
      gesture: 'ily',
      confidence: 0.93,
      anchor: {
        x: lm[9].x,
        y: (lm[8].y + lm[9].y) / 2,
      },
    };
  }

  // 2. Peace Sign (✌️): Index + Middle extended, Ring + Pinky curled
  const peaceSpread = dist2D(lm[8], lm[12]) / palm;
  if (indexExt && middleExt && ringCurled && pinkyCurled && peaceSpread > 0.18) {
    return {
      gesture: 'peace',
      confidence: 0.94,
      anchor: {
        x: (lm[8].x + lm[12].x) / 2,
        y: (lm[8].y + lm[12].y) / 2,
      },
    };
  }

  // 3. Open Palm (👋): All 4 fingers extended + thumb open
  const thumbOpen = dist2D(lm[4], lm[9]) / palm > 0.55 && dist2D(lm[4], lm[5]) / palm > 0.34;
  const handSpan = dist2D(lm[8], lm[20]) / palm;
  if (indexExt && middleExt && ringExt && pinkyExt && thumbOpen && handSpan > 0.52) {
    return {
      gesture: 'open_palm',
      confidence: 0.95,
      anchor: {
        x: lm[9].x,
        y: lm[9].y,
      },
    };
  }

  // 4. Korean Finger Heart (🫰): Middle, Ring, Pinky curled; Thumb & Index crossed/pinched high
  const pinchDist =
    Math.min(
      dist2D(lm[4], lm[8]),
      dist2D(lm[4], lm[7]),
      dist2D(lm[3], lm[8]),
      dist2D(lm[3], lm[7])
    ) / palm;
  const thumbIndexVerticalDiff = Math.abs(lm[4].y - Math.min(lm[8].y, lm[7].y)) / palm;
  const tipsAboveCurledMiddle = Math.min(lm[4].y, lm[8].y) < lm[10].y + 0.16 * palm;
  const reachedFromWrist =
    dist2D(lm[0], lm[4]) / palm > 0.82 && dist2D(lm[0], lm[7]) / palm > 0.78;

  if (
    middleCurled &&
    ringCurled &&
    pinkyCurled &&
    !middleExt &&
    !ringExt &&
    !pinkyExt &&
    pinchDist < 0.7 &&
    thumbIndexVerticalDiff < 0.44 &&
    tipsAboveCurledMiddle &&
    reachedFromWrist
  ) {
    return {
      gesture: 'finger_heart',
      confidence: 0.91,
      anchor: {
        x: (lm[4].x + lm[8].x) / 2,
        y: Math.max(0.06, Math.min(lm[4].y, lm[8].y) - 0.05),
      },
    };
  }

  // 5. Thumbs Up (👍): All 4 fingers curled, Thumb pointing clearly upward
  const thumbStraight = angleDeg(lm[1], lm[2], lm[4]) > 134;
  const thumbAwayFromPalm =
    dist2D(lm[4], lm[5]) / palm > 0.48 && dist2D(lm[4], lm[9]) / palm > 0.64;
  const thumbPointingUp =
    lm[4].y < lm[3].y &&
    lm[4].y < lm[5].y - 0.08 * palm &&
    (lm[8].y - lm[4].y) / palm > 0.3;

  if (
    indexCurled &&
    middleCurled &&
    ringCurled &&
    pinkyCurled &&
    thumbStraight &&
    thumbAwayFromPalm &&
    thumbPointingUp
  ) {
    return {
      gesture: 'thumbs_up',
      confidence: 0.92,
      anchor: {
        x: lm[4].x,
        y: Math.max(0.06, lm[4].y - 0.03),
      },
    };
  }

  return null;
}

export function classifyLandmarks(hands: Point3D[][]): DetectionFrame {
  if (!hands || hands.length === 0) {
    return {
      gesture: null,
      confidence: 0,
      handsCount: 0,
      anchor: null,
      landmarks: [],
    };
  }

  // Check two-hand heart first when 2 hands are visible
  if (hands.length >= 2) {
    const twoHeart = detectTwoHandHeart(hands[0], hands[1]);
    if (twoHeart) {
      return {
        gesture: 'two_hand_heart',
        confidence: twoHeart.confidence,
        handsCount: hands.length,
        anchor: twoHeart.anchor,
        landmarks: hands,
      };
    }
  }

  // Evaluate single-hand gestures across visible hands
  for (const hand of hands) {
    if (hand.length >= 21) {
      const match = classifySingleHand(hand);
      if (match) {
        return {
          gesture: match.gesture,
          confidence: match.confidence,
          handsCount: hands.length,
          anchor: match.anchor,
          landmarks: hands,
        };
      }
    }
  }

  return {
    gesture: null,
    confidence: 0,
    handsCount: hands.length,
    anchor: hands[0]?.[9] ? { x: hands[0][9].x, y: hands[0][9].y } : null,
    landmarks: hands,
  };
}

export class GestureStabilizer {
  private history: (GestureId | null)[] = [];
  private readonly windowSize = 7;

  push(gesture: GestureId | null): GestureId | null {
    this.history.push(gesture);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const counts = new Map<GestureId, number>();
    for (const g of this.history) {
      if (g) {
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }

    let best: GestureId | null = null;
    let bestCount = 0;
    for (const [g, c] of counts.entries()) {
      if (c > bestCount) {
        best = g;
        bestCount = c;
      }
    }

    return bestCount >= 4 ? best : null;
  }

  reset(): void {
    this.history = [];
  }
}
