/**
 * Engineering Units — display formatting.
 *
 * ARCHITECTURE RULE: Every builder returns null when the camera is not calibrated.
 * There is no pixel fallback. The UI must gate measurement display on calibration.
 *
 * All strings produced here are operator-visible calibrated engineering values.
 * No pixel counts or 'px' labels ever appear in function output.
 */

import { UNIT_LABEL } from './types';
import type {
  DistanceUnit, AreaUnit, AngleUnit, CoordUnit,
  Calibration, UnitPreferences,
  DistanceValue, AreaValue, AngleValue, PointValue, RadiusValue, EngineeredValue,
} from './types';
import {
  pxToUnit, pxAreaToUnit, pxCoordToUnit,
  radToUnit, mmToUnit,
  euclideanPx, polygonAreaPx, angleBetweenRad,
} from './conversions';
import type { NPoint } from '../configure/interaction/types';

// ── Formatting helper ─────────────────────────────────────────────────────────

function fmt(value: number, precision: number, unit: AnyDisplayUnit): string {
  return `${value.toFixed(precision)} ${UNIT_LABEL[unit]}`;
}

type AnyDisplayUnit = DistanceUnit | AreaUnit | AngleUnit | CoordUnit;

// ── Value builders ────────────────────────────────────────────────────────────

/**
 * Build a DistanceValue.
 * Returns null when the camera is not calibrated — no pixel fallback.
 */
export function buildDistanceValue(
  pixelValue: number,
  cal: Calibration,
  prefs: UnitPreferences['distance'],
): DistanceValue | null {
  if (!cal.isCalibrated || cal.pxPerMm <= 0) return null;
  const { unit, precision } = prefs;
  const realWorldValue = pixelValue / cal.pxPerMm;           // always mm
  const rawValue = pxToUnit(pixelValue, unit, cal.pxPerMm)!; // non-null: calibrated
  return {
    kind: 'distance',
    pixelValue,
    realWorldValue,
    displayUnit: unit,
    precision,
    displayValue: fmt(rawValue, precision, unit),
    rawValue,
  };
}

/**
 * Build an AreaValue.
 * Returns null when the camera is not calibrated.
 */
export function buildAreaValue(
  pixelArea: number,
  cal: Calibration,
  prefs: UnitPreferences['area'],
): AreaValue | null {
  if (!cal.isCalibrated || cal.pxPerMm <= 0) return null;
  const { unit, precision } = prefs;
  const realWorldArea = pixelArea / (cal.pxPerMm ** 2);      // mm²
  const rawValue = pxAreaToUnit(pixelArea, unit, cal.pxPerMm)!;
  return {
    kind: 'area',
    pixelArea,
    realWorldArea,
    displayUnit: unit,
    precision,
    displayValue: fmt(rawValue, precision, unit),
    rawValue,
  };
}

/**
 * Build an AngleValue.
 * Angles are purely geometric — no calibration required.
 * Always returns a value.
 */
export function buildAngleValue(
  radianValue: number,
  prefs: UnitPreferences['angle'],
): AngleValue {
  const { unit, precision } = prefs;
  const rawValue = radToUnit(radianValue, unit);
  return {
    kind: 'angle',
    radianValue,
    displayUnit: unit,
    precision,
    displayValue: fmt(rawValue, precision, unit),
    rawValue,
  };
}

/**
 * Build a PointValue (calibrated position).
 * Returns null when not calibrated.
 */
export function buildPointValue(
  pixelX: number,
  pixelY: number,
  cal: Calibration,
  prefs: UnitPreferences['point'],
): PointValue | null {
  if (!cal.isCalibrated || cal.pxPerMm <= 0) return null;
  const { unit, precision } = prefs;
  const worldX = pxCoordToUnit(pixelX, unit, cal.pxPerMm)!;
  const worldY = pxCoordToUnit(pixelY, unit, cal.pxPerMm)!;
  const label = UNIT_LABEL[unit];
  return {
    kind: 'point',
    pixelX,
    pixelY,
    worldX,
    worldY,
    displayUnit: unit,
    precision,
    displayValue: `X = ${worldX.toFixed(precision)} ${label}, Y = ${worldY.toFixed(precision)} ${label}`,
  };
}

/**
 * Build a RadiusValue.
 * Returns null when not calibrated.
 */
export function buildRadiusValue(
  pixelValue: number,
  cal: Calibration,
  prefs: UnitPreferences['radius'],
): RadiusValue | null {
  const base = buildDistanceValue(pixelValue, cal, prefs);
  if (!base) return null;
  return { ...base, kind: 'radius' };
}

// ── Main factory ──────────────────────────────────────────────────────────────

/**
 * Compute an EngineeredValue from completed tool geometry.
 *
 * Returns null when:
 *   • The tool requires calibration and isCalibrated === false.
 *   • Insufficient points for the measurement kind.
 *
 * Angle measurements are always computed (no calibration dependency).
 *
 * @param toolId     Tool's toolId string (determines which formula is applied).
 * @param absPoints  Absolute pixel coordinates from the container.
 * @param cal        Current camera calibration.
 * @param prefs      User unit preferences.
 */
export function computeEngineeredValue(
  toolId: string,
  absPoints: readonly NPoint[],
  cal: Calibration,
  prefs: UnitPreferences,
): EngineeredValue | null {
  switch (toolId) {
    case 'distance': {
      if (absPoints.length < 2) return null;
      const px = euclideanPx(absPoints[0].x, absPoints[0].y, absPoints[1].x, absPoints[1].y);
      return buildDistanceValue(px, cal, prefs.distance);
    }

    case 'roi': {
      if (absPoints.length < 4) return null;
      const w = Math.abs(absPoints[1].x - absPoints[0].x);
      const h = Math.abs(absPoints[2].y - absPoints[1].y);
      return buildAreaValue(w * h, cal, prefs.area);
    }

    case 'circle': {
      if (absPoints.length < 2) return null;
      const px = euclideanPx(absPoints[0].x, absPoints[0].y, absPoints[1].x, absPoints[1].y);
      return buildRadiusValue(px, cal, prefs.radius);
    }

    case 'angle': {
      if (absPoints.length < 3) return null;
      // Angle is geometry-only — does not require calibration
      const rad = angleBetweenRad(absPoints[1], absPoints[0], absPoints[2]);
      return buildAngleValue(rad, prefs.angle);
    }

    case 'point': {
      if (absPoints.length < 1) return null;
      return buildPointValue(absPoints[0].x, absPoints[0].y, cal, prefs.point);
    }

    case 'polygon':
    case 'freehand': {
      if (absPoints.length < 3) return null;
      const area = polygonAreaPx(absPoints);
      return buildAreaValue(area, cal, prefs.area);
    }

    default:
      return null;
  }
}

// ── Live unit conversion ──────────────────────────────────────────────────────
// Geometry is never re-computed — only the display unit and string change.

export function convertDistanceUnit(
  v: DistanceValue | RadiusValue,
  newUnit: DistanceUnit,
  cal: Calibration,
): DistanceValue | RadiusValue | null {
  const rebuilt = buildDistanceValue(v.pixelValue, cal, { unit: newUnit, precision: v.precision });
  if (!rebuilt) return null;
  return { ...rebuilt, kind: v.kind };
}

export function convertAreaUnit(
  v: AreaValue,
  newUnit: AreaUnit,
  cal: Calibration,
): AreaValue | null {
  return buildAreaValue(v.pixelArea, cal, { unit: newUnit, precision: v.precision });
}

export function convertAngleUnit(v: AngleValue, newUnit: AngleUnit): AngleValue {
  return buildAngleValue(v.radianValue, { unit: newUnit, precision: v.precision });
}

export function convertPointUnit(
  v: PointValue,
  newUnit: CoordUnit,
  cal: Calibration,
): PointValue | null {
  return buildPointValue(v.pixelX, v.pixelY, cal, { unit: newUnit, precision: v.precision });
}

// ── Re-export for convenience ─────────────────────────────────────────────────
export { mmToUnit };
