/**
 * Inspection Tool Definitions — Version 1 focused tool set.
 *
 * 48 tools across 12 categories. Each tool is self-describing via
 * getPropertyFields() so the React UI never contains if(tool==="X") logic.
 *
 * Property panel format (Photoshop / VisionPro style):
 *   Result | Range | Status | Method
 */

import type { InspectionToolDef, InteractionToolId, PropertyField, TableColumn } from './types';

// ── Shared table column sets ───────────────────────────────────────────────────

const MM_COLS: TableColumn[] = [
  { kind: 'tool',      header: 'Tool',    align: 'left',   width: 'w-20' },
  { kind: 'measured',  header: 'Result',  align: 'right',  width: 'w-20' },
  { kind: 'ideal',     header: 'Nominal', align: 'right',  width: 'w-16' },
  { kind: 'tolerance', header: '±',       align: 'right',  width: 'w-12' },
  { kind: 'status',    header: '',        align: 'center', width: 'w-8'  },
];

const INFO_COLS: TableColumn[] = [
  { kind: 'tool',     header: 'Tool',   align: 'left',  width: 'w-24' },
  { kind: 'measured', header: 'Result', align: 'right', width: 'w-24' },
  { kind: 'units',    header: 'Units',  align: 'right', width: 'w-16' },
  { kind: 'status',   header: '',       align: 'center', width: 'w-8' },
];

// ── Shared helpers ─────────────────────────────────────────────────────────────

function evalPass(raw: number | null, ideal: number | null | undefined, tol: number | null | undefined): boolean | null {
  if (raw == null || ideal == null || tol == null) return null;
  return Math.abs(raw - ideal) <= tol;
}

function passLabel(p: boolean | null) { return p === null ? '—' : p ? 'PASS' : 'FAIL'; }

function tolRange(ideal: number | null | undefined, tol: number | null | undefined, unit: string): string | null {
  if (ideal == null || tol == null) return null;
  return `${(ideal - tol).toFixed(3)} – ${(ideal + tol).toFixed(3)} ${unit}`;
}

function rawOf(result: Parameters<InspectionToolDef['getPropertyFields']>[0]): number | null {
  if (!result) return null;
  return 'rawValue' in result ? (result as { rawValue: number }).rawValue : null;
}

// ── Generic fields builders ────────────────────────────────────────────────────

function mmFields(
  result: Parameters<InspectionToolDef['getPropertyFields']>[0],
  ideal: number | null | undefined,
  tol: number | null | undefined,
  raw: number | null,
  unit: string,
  resultLabel: string,
  method: string,
): PropertyField[] {
  const passing = evalPass(raw, ideal, tol);
  const range   = tolRange(ideal, tol, unit);
  const fields: PropertyField[] = [
    { kind: 'result',    label: resultLabel, value: result?.displayValue ?? '—' },
    { kind: 'ideal',     label: `Nominal (${unit})` },
    { kind: 'tolerance', label: `± Tolerance (${unit})` },
  ];
  if (range) fields.push({ kind: 'info', label: 'Range', value: range });
  fields.push({ kind: 'status', label: 'Status', value: passLabel(passing), passing });
  fields.push({ kind: 'info',   label: 'Method', value: method });
  return fields;
}

// ── Factories ──────────────────────────────────────────────────────────────────

/** Two-click linear distance tool. */
function distTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
  subGroup?: string,
): InspectionToolDef {
  return {
    id, name, categoryId, subGroup, description,
    interactionToolId: 'distance',
    unitLabel: 'mm', defaultPrecision: 3, method,
    tableColumns: MM_COLS,
    getPropertyFields(result, ideal, tol) {
      return mmFields(result, ideal, tol,
        result?.kind === 'distance' ? result.rawValue : null,
        'mm', 'Result', method);
    },
  };
}

/** Circle drag tool — returns radius or diameter. */
function circleTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
  subGroup?: string,
): InspectionToolDef {
  return {
    id, name, categoryId, subGroup, description,
    interactionToolId: 'circle',
    unitLabel: 'mm', defaultPrecision: 3, method,
    tableColumns: MM_COLS,
    getPropertyFields(result, ideal, tol) {
      return mmFields(result, ideal, tol,
        result?.kind === 'radius' ? result.rawValue : null,
        'mm', 'Result', method);
    },
  };
}

/** Area tool — roi or polygon. */
function areaTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
  interactionToolId: InteractionToolId,
  subGroup?: string,
): InspectionToolDef {
  return {
    id, name, categoryId, subGroup, description,
    interactionToolId,
    unitLabel: 'mm²', defaultPrecision: 2, method,
    tableColumns: MM_COLS,
    getPropertyFields(result, ideal, tol) {
      return mmFields(result, ideal, tol,
        result?.kind === 'area' ? result.rawValue : null,
        'mm²', 'Area', method);
    },
  };
}

/** Three-click angle tool. */
function angleTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
  subGroup?: string,
): InspectionToolDef {
  return {
    id, name, categoryId, subGroup, description,
    interactionToolId: 'angle',
    unitLabel: 'rad', defaultPrecision: 4, method,
    tableColumns: MM_COLS,
    getPropertyFields(result, ideal, tol) {
      return mmFields(result, ideal, tol,
        result?.kind === 'angle' ? result.rawValue : null,
        'rad', 'Result', method);
    },
  };
}

/** Single-click point / position tool. */
function pointTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
): InspectionToolDef {
  return {
    id, name, categoryId, description,
    interactionToolId: 'point',
    unitLabel: 'mm', defaultPrecision: 3, method,
    tableColumns: INFO_COLS,
    getPropertyFields(result) {
      return [
        { kind: 'result', label: 'Position', value: result?.displayValue ?? '—' },
        { kind: 'info',   label: 'Method',   value: method },
      ];
    },
  };
}

/** ROI-based analysis (blob, edge, appearance, etc.). */
function roiTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  unitLabel: string,
  method: string,
  resultLabel: string,
  interactionToolId: InteractionToolId = 'roi',
): InspectionToolDef {
  return {
    id, name, categoryId, description,
    interactionToolId,
    unitLabel, defaultPrecision: 3, method,
    tableColumns: INFO_COLS,
    getPropertyFields(result, ideal, tol) {
      const raw = rawOf(result);
      const fields: PropertyField[] = [
        { kind: 'result', label: resultLabel, value: result?.displayValue ?? '—' },
      ];
      if (ideal !== undefined && ideal !== null) {
        fields.push({ kind: 'ideal',     label: `Nominal (${unitLabel})` });
        fields.push({ kind: 'tolerance', label: `± Tolerance (${unitLabel})` });
        const range = tolRange(ideal, tol, unitLabel);
        if (range) fields.push({ kind: 'info', label: 'Range', value: range });
        fields.push({ kind: 'status', label: 'Status', value: passLabel(evalPass(raw, ideal, tol)), passing: evalPass(raw, ideal, tol) });
      }
      fields.push({ kind: 'info', label: 'Method', value: method });
      return fields;
    },
  };
}

/** Pass/fail decision tool. */
function pfTool(
  id: string,
  name: string,
  categoryId: string,
  description: string,
  method: string,
): InspectionToolDef {
  return {
    id, name, categoryId, description,
    interactionToolId: 'roi',
    unitLabel: '', defaultPrecision: 0, method,
    tableColumns: INFO_COLS,
    getPropertyFields(result, ideal, tol) {
      const raw = rawOf(result);
      const passing = evalPass(raw, ideal, tol);
      return [
        { kind: 'result',    label: 'Result',    value: result?.displayValue ?? '—' },
        { kind: 'ideal',     label: 'Threshold' },
        { kind: 'tolerance', label: '± Tolerance' },
        { kind: 'status',    label: 'Status',    value: passLabel(passing), passing },
        { kind: 'info',      label: 'Method',    value: method },
      ];
    },
  };
}

/** Code reading tool (returns decoded string). */
function codeTool(
  id: string,
  name: string,
  description: string,
  method: string,
): InspectionToolDef {
  return {
    id, name, categoryId: 'code', description,
    interactionToolId: 'roi',
    unitLabel: 'String', defaultPrecision: 0, method,
    tableColumns: INFO_COLS,
    getPropertyFields() {
      return [
        { kind: 'result', label: 'Decoded', value: '—' },
        { kind: 'ideal',  label: 'Expected (optional)' },
        { kind: 'info',   label: 'Method',  value: method },
      ];
    },
  };
}

/** Calibration procedure tool. */
function calTool(
  id: string,
  name: string,
  description: string,
  interactionToolId: InteractionToolId,
  method: string,
  note: string,
): InspectionToolDef {
  return {
    id, name, categoryId: 'calibration', description,
    interactionToolId,
    unitLabel: '', defaultPrecision: 0, method,
    tableColumns: INFO_COLS,
    getPropertyFields() {
      return [
        { kind: 'result', label: 'Status', value: '—' },
        { kind: 'info',   label: 'Method', value: method },
        { kind: 'info',   label: 'Note',   value: note },
      ];
    },
  };
}

// ── Tool list ─────────────────────────────────────────────────────────────────

export const ALL_TOOLS: InspectionToolDef[] = [

  // ── Dimensional Inspection ───────────────────────────────────────────────────

  distTool('length',   'Length',   'dimensional', 'Straight-line distance between two points',         'Euclidean distance',           'Linear'),
  distTool('width',    'Width',    'dimensional', 'Horizontal span between two points',                'Δx component',                 'Linear'),
  distTool('height',   'Height',   'dimensional', 'Vertical span between two points',                  'Δy component',                 'Linear'),
  distTool('distance', 'Distance', 'dimensional', 'Point-to-point distance between any two locations', 'Euclidean distance',           'Linear'),

  circleTool('diameter', 'Diameter', 'dimensional', 'Diameter of a circular feature',    'Circle fit (least squares) × 2', 'Circular'),
  circleTool('radius',   'Radius',   'dimensional', 'Radius of a circular feature or arc', 'Circle fit (least squares)',   'Circular'),

  areaTool('area',      'Area',      'dimensional', 'Area of a rectangular or bounded region',  'Bounding box area',               'roi',     'Surface'),
  areaTool('perimeter', 'Perimeter', 'dimensional', 'Perimeter of a polygon or closed contour', 'Polygon perimeter (sum of sides)', 'polygon', 'Surface'),

  angleTool('angle', 'Angle', 'dimensional', 'Angle between two line segments at a shared vertex', 'Three-point angle', 'Angular'),

  // ── Position & Alignment ─────────────────────────────────────────────────────

  pointTool('x_position', 'X Position', 'position', 'X coordinate of a feature or point',        'Single point selection'),
  pointTool('y_position', 'Y Position', 'position', 'Y coordinate of a feature or point',        'Single point selection'),
  pointTool('center',     'Center',     'position', 'Geometric centre of a circle or feature',   'Circle fit centre'),
  angleTool('rotation',   'Rotation',   'position', 'Rotation angle of a part relative to datum','Principal axis angle'),
  distTool ('offset',     'Offset',     'position', 'Offset between a feature and a datum point', 'Point-to-point distance'),

  // ── Blob Analysis ─────────────────────────────────────────────────────────────

  roiTool('blob_detection', 'Blob Detection', 'blob', 'Detect connected regions within an ROI',              'Count', 'Connected component labelling',    'Blob Count'),
  roiTool('blob_count',     'Blob Count',     'blob', 'Count blobs satisfying area and shape criteria',      'Count', 'Connected component labelling',    'Count'),
  roiTool('blob_area',      'Blob Area',      'blob', 'Area of the largest or selected blob',                'mm²',   'Connected component area',         'Area'),
  roiTool('blob_centroid',  'Blob Centroid',  'blob', 'Centroid position of a detected blob',               'mm',    'Centroid (intensity-weighted mean)', 'Centroid'),

  // ── Edge & Line ───────────────────────────────────────────────────────────────

  roiTool('edge_detection', 'Edge Detection', 'edge', 'Detect edges using gradient analysis',              'mm', 'Canny / Sobel gradient',        'Edge Count', 'point'),
  roiTool('edge_position',  'Edge Position',  'edge', 'Sub-pixel position of a detected edge',            'mm', 'Sub-pixel edge localisation',   'Position',   'point'),
  roiTool('line_detection', 'Line Detection', 'edge', 'Detect straight lines using Hough transform',      'mm', 'Hough line transform',          'Line Count', 'distance'),
  roiTool('line_length',    'Line Length',    'edge', 'Length of a detected or manually drawn line',      'mm', 'Euclidean distance',            'Length',     'distance'),

  // ── Shape Analysis ────────────────────────────────────────────────────────────

  roiTool('shape_rectangle', 'Rectangle', 'shape', 'Fit a rectangle to a region or detected feature', 'mm',  'Minimum area rectangle fit',   'W × H',    'roi'),
  roiTool('shape_circle',    'Circle',    'shape', 'Fit a circle to a region or detected feature',    'mm',  'Least squares circle fit',     'Diameter', 'circle'),
  roiTool('shape_polygon',   'Polygon',   'shape', 'Fit a polygon to a feature contour',              'mm',  'Polygon approximation (RDP)',   'Perimeter','polygon'),
  roiTool('shape_contour',   'Contour',   'shape', 'Trace the outer contour of a feature',            'mm',  'Contour tracing (Suzuki–Abe)', 'Length',   'freehand'),

  // ── Object Inspection ────────────────────────────────────────────────────────

  pfTool ('presence_check',  'Presence Check',  'object', 'Verify that an object is present within an ROI',   'Grey-level threshold'),
  pfTool ('absence_check',   'Absence Check',   'object', 'Verify that an object is absent from an ROI',      'Grey-level threshold'),
  roiTool('object_count',     'Object Count',     'object', 'Count objects detected in a region',              'Count', 'Connected component labelling',  'Count'),
  roiTool('object_detection', 'Object Detection', 'object', 'Detect and locate objects using grey-level analysis','Count','Grey-level blob detection',    'Objects'),

  // ── Pattern Matching ──────────────────────────────────────────────────────────

  roiTool('template_match', 'Template Match', 'pattern',
    'Locate a template image within the inspection region',
    '%', 'Normalised cross-correlation (NCC)', 'Score'),

  // ── Appearance Inspection ────────────────────────────────────────────────────

  roiTool('brightness',       'Brightness',       'appearance', 'Mean grey level of a region (0–255)',             'Gray Value', 'Region mean intensity',    'Mean GL'),
  roiTool('contrast',         'Contrast',         'appearance', 'Normalised contrast within a region (0–100 %)',   '%',          'Max−Min grey ÷ 255',       'Contrast'),
  roiTool('color_inspection', 'Color Inspection', 'appearance', 'Mean RGB and HSV values within a region',        'RGB',        'Region mean colour (BGR)', 'Color'),

  // ── Code Reading ──────────────────────────────────────────────────────────────

  codeTool('barcode',     'Barcode',     'Decode a 1-D barcode within a region (EAN, Code 128, etc.)', 'ZBar / ZXing 1-D decode'),
  codeTool('qr_code',     'QR Code',     'Decode a QR Code within a region',                           'ZXing QR decode'),
  codeTool('data_matrix', 'Data Matrix', 'Decode a Data Matrix symbol within a region',               'ZXing Data Matrix decode'),

  // ── ROI Tools ────────────────────────────────────────────────────────────────

  {
    id: 'rect_roi', name: 'Rectangle ROI', categoryId: 'roi',
    description: 'Draw a rectangular region of interest (drag to define)',
    interactionToolId: 'roi',
    unitLabel: 'mm²', defaultPrecision: 2, method: 'Rectangle drag',
    tableColumns: MM_COLS,
    getPropertyFields(result) {
      return [
        { kind: 'result', label: 'Area',   value: result?.displayValue ?? '—' },
        { kind: 'info',   label: 'Method', value: 'Rectangle drag' },
      ];
    },
  },
  {
    id: 'circle_roi', name: 'Circle ROI', categoryId: 'roi',
    description: 'Draw a circular region of interest (click centre, drag radius)',
    interactionToolId: 'circle',
    unitLabel: 'mm', defaultPrecision: 3, method: 'Click centre + drag radius',
    tableColumns: MM_COLS,
    getPropertyFields(result) {
      return [
        { kind: 'result', label: 'Radius', value: result?.displayValue ?? '—' },
        { kind: 'info',   label: 'Method', value: 'Click centre, drag radius' },
      ];
    },
  },
  {
    id: 'polygon_roi', name: 'Polygon ROI', categoryId: 'roi',
    description: 'Draw a polygonal region of interest (multi-click, double-click to close)',
    interactionToolId: 'polygon',
    unitLabel: 'mm²', defaultPrecision: 2, method: 'Multi-click polygon',
    tableColumns: MM_COLS,
    getPropertyFields(result) {
      return [
        { kind: 'result', label: 'Area',   value: result?.displayValue ?? '—' },
        { kind: 'info',   label: 'Method', value: 'Multi-click, double-click to close' },
      ];
    },
  },

  // ── Inspection ────────────────────────────────────────────────────────────────

  pfTool('tolerance_check', 'Tolerance Check', 'inspection',
    'Evaluate whether a measured value falls within a specified tolerance band',
    'Limit check (nominal ± tolerance)'),
  pfTool('pass_fail', 'Pass / Fail', 'inspection',
    'Binary pass/fail decision based on a threshold value',
    'Threshold comparison'),

  // ── Calibration ───────────────────────────────────────────────────────────────

  calTool('camera_calibration', 'Camera Calibration',   'Compute intrinsic parameters and correct lens distortion',     'distance', 'Checkerboard (Zhang method)',     'Place calibration grid in field of view'),
  calTool('pixel_to_mm',        'Pixel to mm',          'Set the physical scale by measuring a known reference object',  'distance', 'Reference object measurement',   'Measure a known length, enter the real value'),
  calTool('lens_distortion',    'Lens Distortion',      'Measure and compensate radial and tangential lens distortion',  'roi',      'Brown–Conrady distortion model', 'Requires a calibration grid image'),
  calTool('coordinate_system',  'Coordinate System',    'Define the world coordinate system origin and orientation',    'point',    'User-defined origin + X-axis',   'Click origin, then click X-axis direction'),
  calTool('save_calibration',   'Save Calibration',     'Save the current calibration to file for later use',           'point',    'JSON calibration file',          'Saves intrinsics, distortion, and px/mm scale'),
  calTool('load_calibration',   'Load Calibration',     'Load a previously saved calibration from file',                'point',    'JSON calibration file',          'Replaces the current active calibration'),
];
