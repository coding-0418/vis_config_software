// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  role: 'operator' | 'engineer' | 'admin';
  displayName: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

// ─── Measurements ─────────────────────────────────────────────────────────────
export type MeasurementCategory =
  | 'measurements'
  | 'position'
  | 'holes'
  | 'shapes'
  | 'objects'
  | 'blobs'
  | 'edges'
  | 'lines'
  | 'circles'
  | 'polygons'
  | 'colors'
  | 'intensity'
  | 'histogram'
  | 'comparison'
  | 'templates'
  | 'roi'
  | 'barcode';

export interface MeasurementItem {
  id: string;
  category: MeasurementCategory;
  name: string;
  description: string;
  icon: string;
}

// ─── Coordinates ──────────────────────────────────────────────────────────────
export interface Coordinate {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Selected Parameter ───────────────────────────────────────────────────────
export interface SelectedParameter {
  id: string;
  measurementCategory: MeasurementCategory;
  measurementName: string;
  capturedAt?: string;
  coordinates?: Coordinate[];
  pixelValues?: { r: number; g: number; b: number };
  measurementValues: Record<string, number | string>;
  confirmed: boolean;
  confirmationTimestamp?: string;
}

// ─── Tolerance Row ────────────────────────────────────────────────────────────
export type ToleranceStatus = 'pass' | 'fail' | 'pending';

export interface ToleranceRow {
  id: string;
  parameter: string;
  idealValue: number;
  tolerance: number;
  units: string;
  status: ToleranceStatus;
}

// ─── Image Correction ─────────────────────────────────────────────────────────
export interface ImageCorrectionValues {
  red: number;
  green: number;
  blue: number;
  hue: number;
  contrast: number;
  brightness: number;
  saturation: number;
  gamma: number;
  threshold: number;
}

// ─── Camera ───────────────────────────────────────────────────────────────────
export type CameraStatus = 'offline' | 'connecting' | 'live' | 'capturing' | 'error';

export interface CameraState {
  status: CameraStatus;
  frameCount: number;
  fps: number;
  resolution: { width: number; height: number };
  timestamp?: string;
  deviceId?: string;
  // Electron IPC hook point — will be populated by electron-camera bridge
  ipcChannel?: string;
}

// ─── Inspection Result ────────────────────────────────────────────────────────
export type InspectionStatus = 'pass' | 'fail' | 'processing' | 'idle';

export interface InspectionResult {
  id:                 string;
  /** Unique ID for the continuous-capture session (generated at Start Capture). */
  inspectionId:       string;
  /** Version string of the deployed recipe that produced this result. */
  recipeVersion:      string;
  imageNo:            number;
  timestamp:          string;
  status:             InspectionStatus;
  processingTimeMs:   number;
  /** Number of measurements in the deployed recipe. */
  totalMeasurements:  number;
  /** Number of recipe measurements that evaluated to PASS for this frame. */
  passedMeasurements: number;
  /** Number of recipe measurements that evaluated to FAIL for this frame. */
  failedMeasurements: number;
  measuredValues: Array<{
    parameter:         string;
    idealValue:        number;
    tolerance:         number;
    minimumAcceptable: number;
    maximumAcceptable: number;
    measuredValue:     number;
    result:            'pass' | 'fail';
    units:             string;
  }>;
  failures: string[];
}

// ─── CSV / Configuration Export ───────────────────────────────────────────────
/**
 * One row in the inspection results CSV.
 *
 * Every row corresponds to a single measurement evaluated against a single
 * inspected frame.  The recipe_version and inspection_id columns link every
 * row back to the exact deployed recipe and continuous-capture session that
 * produced it, so CSV files from multiple sessions are unambiguously traceable.
 */
export interface CsvRow {
  sl_no:               number;
  image_no:            number;
  recipe_version:      string;
  inspection_id:       string;
  parameter:           string;
  measured_value:      number;
  ideal_value:         number;
  tolerance:           number;
  minimum_acceptable:  number;
  maximum_acceptable:  number;
  result:              'Pass' | 'Fail';
  processing_time_ms:  number;
  timestamp:           string;
}

export interface ConfigurationPayload {
  version: string;
  createdAt: string;
  operator: string;
  measurements: SelectedParameter[];
  tolerances: ToleranceRow[];
  imageCorrection: ImageCorrectionValues;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  autoSaveInterval: number; // seconds
  maxCsvRows: number;       // delete oldest when exceeded (default 100000)
  units: 'mm' | 'px';
  showGrid: boolean;
  showCrosshair: boolean;
}

// ─── Configure Page Workflow ───────────────────────────────────────────────────
// Represents the strict sequential steps the operator follows on the Configure page.
export type CameraStep =
  | 'idle'           // No camera — waiting for the operator to click Capture
  | 'streaming'      // Live camera feed running — operator positions the part
  | 'frame-captured' // Frame frozen — operator reviews before confirming
  | 'confirmed';     // Frozen image is now the measurement canvas

// A single entry in the running activity log shown in the Selected Parameter panel.
export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO string
  message: string;
  detail?: string;
}

/**
 * A fully saved measurement, stored in the inspection JSON script.
 *
 * This is the atomic unit of the inspection recipe.  Each entry represents
 * ONE complete measure → confirm → specify → save cycle performed by the
 * operator.  The Run window compares every captured measuredValue against
 * engineeringSpecification.minimumAcceptable .. maximumAcceptable.
 */
export interface MeasurementRecord {
  /** Runtime ID — not written to JSON export. */
  id: string;
  /** Human-readable tool name, e.g. "Length". */
  tool: string;
  /**
   * Normalised measurement points (0–1 relative to image area).
   * Two points for linear tools, three for angle, center+edge for circle, etc.
   */
  measurementGeometry: Array<{ x: number; y: number }>;
  /** Raw numeric measured value in the display unit (e.g. 42.36 for mm). */
  measuredValue: number;
  /** Pre-formatted display string including units, e.g. "42.36 mm". */
  displayValue: string;
  engineeringSpecification: {
    idealValue: number;
    tolerance: number;
    units: string;
    /** idealValue − tolerance */
    minimumAcceptable: number;
    /** idealValue + tolerance */
    maximumAcceptable: number;
  };
  imageCorrection: {
    r: number;
    g: number;
    b: number;
    hue: number;
    contrast: number;
  };
}

// ─── Measurement Tool Plugin ───────────────────────────────────────────────────
// Every drawing/measurement tool must implement this interface.
// Tools are registered at startup and rendered dynamically into the canvas toolbar.
// Future: tools will be loaded from a plugin registry exposed via Electron IPC.
export interface MeasurementTool {
  id: string;
  name: string;
  category: MeasurementCategory;
  icon: string; // lucide-react icon name
  description: string;
  // Called when the tool is active and the user draws on the Konva canvas
  draw(): void;
  // Validates that the drawn shape meets minimum requirements (e.g. 2 points for a line)
  validate(): boolean;
  // Serialises the tool's state for inclusion in the inspection pipeline JSON
  export(): MeasurementToolExport;
}

export interface MeasurementToolExport {
  toolId: string;
  name: string;
  category: MeasurementCategory;
  params: Record<string, unknown>;
}

// ─── Inspection Pipeline (JSON Configuration Engine) ──────────────────────────
// The pipeline is the machine-readable inspection script written to disk on deploy.
// Each step maps 1-to-1 to a Python/OpenCV operation in the backend.
// Future: window.electronAPI.config.save(pipeline) writes this to disk.
export type PipelineStepType =
  | 'Capture'
  | 'Brightness'
  | 'Contrast'
  | 'Saturation'
  | 'Gamma'
  | 'Threshold'
  | 'ROI'
  | 'Blob'
  | 'MeasureLength'
  | 'MeasureWidth'
  | 'MeasureHeight'
  | 'MeasureDiameter'
  | 'MeasureAngle'
  | 'EdgeDetection'
  | 'CircleDetection'
  | 'PolygonDetection'
  | 'ColorDetection'
  | 'Barcode'
  | 'OCR'
  | 'Template';

export interface PipelineStep {
  step: PipelineStepType;
  // Tool-specific parameters (e.g. { "value": 20 } for Brightness, { "points": [] } for ROI)
  params?: Record<string, unknown>;
}

export interface InspectionPipeline {
  version: string;
  name: string;
  createdAt: string;
  operator: string;
  // Ordered list of processing steps executed by the Python backend
  pipeline: PipelineStep[];
  tolerances: ToleranceRow[];
  imageCorrection: ImageCorrectionValues;
}

// ─── Camera Interfaces ─────────────────────────────────────────────────────────
// Abstracts over USB, Basler, HikRobot, Daheng, FLIR.
// Mock implementations live in src/services/camera/.
// Real SDK adapters will be loaded via Electron IPC (main process) in M3/M9.
export type CameraType = 'usb' | 'basler' | 'hikrobot' | 'daheng' | 'flir' | 'mock';

export interface CameraDevice {
  id: string;
  name: string;
  type: CameraType;
  resolution: { width: number; height: number };
  fps: number;
  connected: boolean;
}

export interface CameraCapabilities {
  maxResolution: { width: number; height: number };
  maxFps: number;
  supportsHardwareTrigger: boolean;
  supportsExternalTrigger: boolean;
  pixelFormats: string[];
}

// Common interface all camera adapters must implement.
// Future: electron main process implements this via SDK bindings.
export interface ICameraAdapter {
  readonly type: CameraType;
  connect(deviceId: string): Promise<boolean>;
  disconnect(): Promise<void>;
  startStream(): Promise<void>;
  stopStream(): Promise<void>;
  captureFrame(): Promise<ArrayBuffer>;
  getCapabilities(): CameraCapabilities;
}
