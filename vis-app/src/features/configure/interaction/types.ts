/**
 * Interaction Engine — shared types.
 *
 * All spatial coordinates are NPoint (normalised, 0–1) relative to the
 * measurement canvas container div.  Absolute pixel coordinates (absX/absY)
 * are also threaded through for distance calculations.
 */

/** Normalised coordinate in [0, 1] relative to the canvas container. */
export interface NPoint {
  readonly x: number;
  readonly y: number;
}

/** Axis-aligned rectangle in normalised space. */
export interface NRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Current phase of the interaction state machine. */
export type InteractionPhase =
  | 'idle'       // no tool active
  | 'waiting'    // tool selected, no input yet
  | 'drawing'    // active interaction: drag in progress or multi-click sequence
  | 'completed'  // measurement done — awaiting operator Confirm
  | 'editing';   // shape is editable (ROI handles active)

/** Style applied to SVG overlay shapes. */
export interface ShapeStyle {
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeDasharray?: string;
  readonly fill?: string;
  readonly fillOpacity?: number;
  readonly animated?: boolean; // marching-ants stroke-dashoffset animation
}

/**
 * Discriminated union of every overlay shape the engine can produce.
 * All positional values are NPoint (0–1); radii are also normalised.
 * The SVG renderer maps these to percentage-based SVG coordinates.
 */
export type OverlayShape =
  | { readonly kind: 'line';    readonly id: string; readonly p1: NPoint; readonly p2: NPoint; readonly style: ShapeStyle }
  | { readonly kind: 'rect';    readonly id: string; readonly origin: NPoint; readonly size: NPoint; readonly style: ShapeStyle }
  | { readonly kind: 'circle';  readonly id: string; readonly center: NPoint; readonly radius: number; readonly style: ShapeStyle }
  | { readonly kind: 'polygon'; readonly id: string; readonly points: readonly NPoint[]; readonly closed: boolean; readonly style: ShapeStyle }
  | { readonly kind: 'dot';     readonly id: string; readonly p: NPoint; readonly r?: number; readonly style: ShapeStyle }
  | { readonly kind: 'text';    readonly id: string; readonly p: NPoint; readonly text: string; readonly dy?: number; readonly anchor?: 'start' | 'middle' | 'end' }
  | { readonly kind: 'handle';  readonly id: string; readonly p: NPoint; readonly hcursor: string };

/** Raw mouse event forwarded from the canvas div to the engine. */
export interface ToolMouseEvent {
  readonly normX: number;
  readonly normY: number;
  readonly absX: number;
  readonly absY: number;
  readonly button: number;
  readonly shiftKey: boolean;
}

/** Result produced by a completed tool, used by ConfigurePage to build MeasurementRecord. */
export interface MeasurementResult {
  readonly toolId: string;
  readonly toolName: string;
  /** Key geometry points in normalised coords — for overlay persistence. */
  readonly normPoints: readonly NPoint[];
  /** Same points in absolute pixels from the container top-left — for mm maths. */
  readonly absPoints: readonly NPoint[];
}

/** Contract that every interaction tool must satisfy. */
export interface InteractionTool {
  readonly toolId: string;
  readonly toolName: string;

  onMouseDown(e: ToolMouseEvent): void;
  onMouseMove(e: ToolMouseEvent): void;
  onMouseUp(e: ToolMouseEvent): void;
  onDblClick(e: ToolMouseEvent): void;
  onKeyDown(key: string): void;

  getShapes(): OverlayShape[];
  getPhase(): InteractionPhase;
  getResult(): MeasurementResult | null;
  /** Returns the CSS cursor that should be shown at the given canvas position. */
  getCursor(norm: NPoint): string;

  reset(): void;
}
