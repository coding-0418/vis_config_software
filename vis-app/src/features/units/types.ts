/**
 * Engineering Units — type definitions.
 *
 * ARCHITECTURE RULE: Pixel values are an internal implementation detail only.
 * They must never appear in any operator-visible surface (overlays, panels,
 * reports, exports, tooltips, status bar).
 *
 * All display types represent calibrated engineering units exclusively.
 * Measurement tools are disabled until camera calibration is complete.
 */

// ── Display unit types (operator-visible) ─────────────────────────────────────

/** Calibrated linear distance units. Never includes 'px'. */
export type DistanceUnit = 'mm' | 'µm' | 'cm' | 'in' | 'mil';

/** Calibrated area units. Never includes 'px²'. */
export type AreaUnit = 'mm²' | 'µm²' | 'cm²' | 'in²';

/** Angle units. No calibration required (computed from geometry). */
export type AngleUnit = 'deg' | 'rad' | 'gon' | 'mrad' | 'arcmin' | 'arcsec';

/** Coordinate / position units. */
export type CoordUnit = 'mm' | 'cm' | 'in';

export type AnyUnit = DistanceUnit | AreaUnit | AngleUnit | CoordUnit;

/** Human-readable labels for every display unit. */
export const UNIT_LABEL: Record<AnyUnit, string> = {
  mm:     'mm',
  'µm':   'µm',
  cm:     'cm',
  in:     'in',
  mil:    'mil',
  'mm²':  'mm²',
  'µm²':  'µm²',
  'cm²':  'cm²',
  'in²':  'in²',
  deg:    '°',
  rad:    'rad',
  gon:    'gon',
  mrad:   'mrad',
  arcmin: '′',
  arcsec: '″',
};

/**
 * Ordered lists of units for each family — used to populate UI selectors.
 * Order is preference: most common first.
 */
export const DISTANCE_UNITS: DistanceUnit[] = ['mm', 'µm', 'cm', 'in', 'mil'];
export const AREA_UNITS:     AreaUnit[]     = ['mm²', 'µm²', 'cm²', 'in²'];
export const ANGLE_UNITS:    AngleUnit[]    = ['rad', 'deg', 'gon', 'mrad', 'arcmin', 'arcsec'];
export const COORD_UNITS:    CoordUnit[]    = ['mm', 'cm', 'in'];

// ── Calibration ───────────────────────────────────────────────────────────────

/**
 * Camera calibration describing the physical scale of the image.
 * When isCalibrated === false, all measurement tools must be disabled.
 */
export interface Calibration {
  /** Pixels per millimetre. Populated after real calibration or temporary test calibration. */
  readonly pxPerMm: number;
  /**
   * True when a calibration (real or temporary) is active.
   * Measurement tools are blocked only when this is false.
   */
  readonly isCalibrated: boolean;
  /**
   * True when this calibration was automatically applied for a test image upload
   * rather than derived from a real camera calibration procedure.
   *
   * Temporary calibrations are cleared automatically when the test image is removed.
   * They must never persist to the next camera session.
   */
  readonly isTemporary: boolean;
  /** Human-readable source description. */
  readonly source?: string;
}

// ── Engineered values ─────────────────────────────────────────────────────────

/**
 * Calibrated linear distance measurement.
 *
 * pixelValue is kept for internal traceability only — never shown to the operator.
 * All operator-visible display uses displayValue (calibrated, in displayUnit).
 */
export interface DistanceValue {
  readonly kind: 'distance';
  /** Internal pixel distance — never displayed to the operator. */
  readonly pixelValue: number;
  /** Distance in millimetres (canonical SI base). */
  readonly realWorldValue: number;
  readonly displayUnit: DistanceUnit;
  readonly precision: number;
  readonly displayValue: string;   // e.g. "12.456 mm"
  readonly rawValue: number;       // numeric value in displayUnit
}

/** Calibrated area measurement. */
export interface AreaValue {
  readonly kind: 'area';
  /** Internal pixel area — never displayed to the operator. */
  readonly pixelArea: number;
  /** Area in mm². */
  readonly realWorldArea: number;
  readonly displayUnit: AreaUnit;
  readonly precision: number;
  readonly displayValue: string;   // e.g. "245.23 mm²"
  readonly rawValue: number;
}

/**
 * Angle measurement.
 * No calibration required — computed purely from image geometry.
 * Stored internally in radians; converted to displayUnit for display only.
 */
export interface AngleValue {
  readonly kind: 'angle';
  readonly radianValue: number;
  readonly displayUnit: AngleUnit;
  readonly precision: number;
  readonly displayValue: string;   // e.g. "1.234 rad"
  readonly rawValue: number;
}

/** Calibrated 2-D position measurement. */
export interface PointValue {
  readonly kind: 'point';
  /** Internal pixel coordinates — never displayed to the operator. */
  readonly pixelX: number;
  readonly pixelY: number;
  /** Calibrated world coordinates in mm. */
  readonly worldX: number;
  readonly worldY: number;
  readonly displayUnit: CoordUnit;
  readonly precision: number;
  readonly displayValue: string;   // e.g. "X = 12.34 mm, Y = 56.78 mm"
}

/** Calibrated radius measurement. */
export interface RadiusValue {
  readonly kind: 'radius';
  readonly pixelValue: number;
  readonly realWorldValue: number;
  readonly displayUnit: DistanceUnit;
  readonly precision: number;
  readonly displayValue: string;
  readonly rawValue: number;
}

/** Discriminated union over all engineered measurement value types. */
export type EngineeredValue =
  | DistanceValue
  | AreaValue
  | AngleValue
  | PointValue
  | RadiusValue;

// ── Unit preferences ──────────────────────────────────────────────────────────

export interface UnitPreferences {
  distance: { unit: DistanceUnit; precision: number };
  area:     { unit: AreaUnit;     precision: number };
  angle:    { unit: AngleUnit;    precision: number };
  point:    { unit: CoordUnit;    precision: number };
  radius:   { unit: DistanceUnit; precision: number };
}

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  distance: { unit: 'mm',  precision: 3 },
  area:     { unit: 'mm²', precision: 2 },
  angle:    { unit: 'rad', precision: 4 },
  point:    { unit: 'mm',  precision: 3 },
  radius:   { unit: 'mm',  precision: 3 },
};
