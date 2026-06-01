import jsQR, { type QRCode } from "jsqr";

export type Answer = "A" | "B" | "C" | "D";

/**
 * Derive the answer letter from a detected QR's orientation.
 * Uses the vector from topLeft → topRight (the QR's "top" edge).
 *   angle near 0°   → cartão em pé        → A
 *   angle near 90°  → cartão girado 90°↻  → B
 *   angle near 180° → de cabeça pra baixo → C
 *   angle near 270° → girado 90°↺         → D
 */
export function angleToAnswer(deg: number): Answer {
  // Normalize to [0, 360)
  let a = ((deg % 360) + 360) % 360;
  if (a < 45 || a >= 315) return "A";
  if (a < 135) return "B";
  if (a < 225) return "C";
  return "D";
}

export function qrAngleDeg(qr: QRCode): number {
  const tl = qr.location.topLeftCorner;
  const tr = qr.location.topRightCorner;
  const dx = tr.x - tl.x;
  const dy = tr.y - tl.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export interface DetectedCard {
  code: string;        // QR payload (student identifier)
  answer: Answer;      // orientation-derived answer
  angle: number;
  cx: number;          // center x in source frame
  cy: number;
}

/**
 * Scan a single image frame for ALL QR codes, returning each one with its
 * orientation-derived answer. jsQR only finds one per call, so we mask the
 * detected area and retry until none remain or max iterations reached.
 */
export function scanFrame(imageData: ImageData, maxCodes = 40): DetectedCard[] {
  const results: DetectedCard[] = [];
  const data = new Uint8ClampedArray(imageData.data); // working copy
  const work: ImageData = new ImageData(data, imageData.width, imageData.height);

  for (let i = 0; i < maxCodes; i++) {
    const qr = jsQR(work.data, work.width, work.height, { inversionAttempts: "dontInvert" });
    if (!qr) break;
    const angle = qrAngleDeg(qr);
    const tl = qr.location.topLeftCorner;
    const br = qr.location.bottomRightCorner;
    results.push({
      code: qr.data,
      answer: angleToAnswer(angle),
      angle,
      cx: (tl.x + br.x) / 2,
      cy: (tl.y + br.y) / 2,
    });
    // Mask the detected QR with white so the next pass finds a different one
    maskRect(work, qr.location);
  }
  return results;
}

function maskRect(img: ImageData, loc: QRCode["location"]) {
  const xs = [loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomLeftCorner.x, loc.bottomRightCorner.x];
  const ys = [loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y];
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 4);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 4);
  const x1 = Math.min(img.width, Math.ceil(Math.max(...xs)) + 4);
  const y1 = Math.min(img.height, Math.ceil(Math.max(...ys)) + 4);
  for (let y = y0; y < y1; y++) {
    const row = y * img.width * 4;
    for (let x = x0; x < x1; x++) {
      const i = row + x * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
  }
}
