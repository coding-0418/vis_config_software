/**
 * Engineering Units — pure conversion math.
 *
 * ARCHITECTURE RULE: Pixel values are internal only.
 * All public functions receive pixel measurements and return calibrated SI values.
 * No function returns raw pixel counts as a display-ready value.
 *
 * Canonical internal bases:
 *   Distance → millimetres (mm)
 *   Area     → square millimetres (mm²)
 *   Angle    → radians (rad)
 */

import type { DistanceUnit, AreaUnit, AngleUnit, CoordUnit } from './types';

// ── Distance ──────────────────────────────────────────────────────────────────

/** mm → display unit scale factors. */
const MM_TO: Record<DistanceUnit, number> = {
  mm:   1,
  'µm': 1_000,
  cm:   0.1,
  in:   1 / 25.4,
  mil:  1000 / 25.4,
};

/**
 * Convert pixel distance to millimetres.
 * Returns null when pxPerMm ≤ 0 (calibration guard).
 */
export function pxToMm(px: number, pxPerMm: number): number | null {
  if (pxPerMm <= 0) return null;
  return px / pxPerMm;
}

/**
 * Convert pixel distance to a calibrated display unit.
 * Always returns null when not calibrated — no pixel fallback.
 */
export function pxToUnit(
  px: number,
  unit: DistanceUnit,
  pxPerMm: number,
): number | null {
  if (pxPerMm <= 0) return null;
  const mm = px / pxPerMm;
  return mm * MM_TO[unit];
}

/** Convert millimetres to a display unit. */
export function mmToUnit(mm: number, unit: DistanceUnit): number {
  return mm * MM_TO[unit];
}

// ── Area ──────────────────────────────────────────────────────────────────────

/** mm² → display unit scale factors. */
const MM2_TO: Record<AreaUnit, number> = {
  'mm²': 1,
  'µm²': 1_000_000,
  'cm²': 0.01,
  'in²': 1 / (25.4 * 25.4),
};

/**
 * Convert pixel area to a calibrated display unit.
 * Always returns null when not calibrated.
 */
export function pxAreaToUnit(
  pxArea: number,
  unit: AreaUnit,
  pxPerMm: number,
): number | null {
  if (pxPerMm <= 0) return null;
  const mm2 = pxArea / (pxPerMm * pxPerMm);
  return mm2 * MM2_TO[unit];
}

// ── Angle ─────────────────────────────────────────────────────────────────────

const RAD_TO: Record<AngleUnit, number> = {
  rad:    1,
  deg:    180 / Math.PI,
  gon:    200 / Math.PI,
  mrad:   1_000,
  arcmin: (180 / Math.PI) * 60,
  arcsec: (180 / Math.PI) * 3_600,
};

/** Convert radians to display unit. No calibration required. */
export function radToUnit(rad: number, unit: AngleUnit): number {
  return rad * RAD_TO[unit];
}

/** Convert display unit value back to radians. */
export function unitToRad(value: number, unit: AngleUnit): number {
  return value / RAD_TO[unit];
}

// ── Coordinates ───────────────────────────────────────────────────────────────

const MM_TO_COORD: Record<CoordUnit, number> = {
  mm: 1,
  cm: 0.1,
  in: 1 / 25.4,
};

/**
 * Convert a pixel coordinate to a calibrated coordinate unit.
 * Always returns null when not calibrated.
 */
export function pxCoordToUnit(
  px: number,
  unit: CoordUnit,
  pxPerMm: number,
): number | null {
  if (pxPerMm <= 0) return null;
  const mm = px / pxPerMm;
  return mm * MM_TO_COORD[unit];
}

// ── Geometry helpers (pixel-space, internal only) ─────────────────────────────

/** Euclidean pixel distance between two points. Internal use only. */
export function euclideanPx(
  ax: number, ay: number,
  bx: number, by: number,
): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

/**
 * Polygon area via the Shoelace formula. Internal pixel-space only.
 * Points are absolute pixel coordinates from the measurement container.
 */
export function polygonAreaPx(points: ReadonlyArray<{ x: number; y: number }>): number {
  const n = points.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Angle at `vertex` between arms ending at `a` and `b`.
 * Returns value in radians in [0, π]. Internal pixel-space only.
 */
export function angleBetweenRad(
  vertex: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const ax = a.x - vertex.x; const ay = a.y - vertex.y;
  const bx = b.x - vertex.x; const by = b.y - vertex.y;
  const dot  = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB))));
}
