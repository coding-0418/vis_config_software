/**
 * Inspection Tool Framework — type definitions.
 *
 * Every inspection tool is self-describing via InspectionToolDef.
 * The React UI must never contain if(tool==="X") or switch(tool) — all
 * rendering behaviour is driven by the tool's own property definitions.
 */

import type { EngineeredValue } from '@/features/units/types';

// ── Interaction tool mapping ───────────────────────────────────────────────────

/**
 * The 7 interaction primitives that power all inspection tools.
 * Maps to the existing interaction engine tool implementations.
 */
export type InteractionToolId =
  | 'distance'
  | 'circle'
  | 'angle'
  | 'roi'
  | 'point'
  | 'polygon'
  | 'freehand';

// ── Property fields (dynamic tool panel) ──────────────────────────────────────

export type PropertyFieldKind =
  | 'result'       // read-only measured value display
  | 'ideal'        // editable ideal/nominal value from engineering drawing
  | 'tolerance'    // editable ± tolerance
  | 'status'       // pass/fail/warning badge
  | 'method'       // read-only algorithm/method description
  | 'info';        // read-only informational text

export interface PropertyField {
  readonly kind: PropertyFieldKind;
  readonly label: string;
  /** Current display value (for 'result', 'status', 'method', 'info'). */
  readonly value?: string;
  /** True when the measured result is within tolerance of the ideal. Null = not yet evaluated. */
  readonly passing?: boolean | null;
}

// ── Table columns ──────────────────────────────────────────────────────────────

export type TableColumnKind = 'tool' | 'measured' | 'ideal' | 'tolerance' | 'status' | 'units';

export interface TableColumn {
  readonly kind: TableColumnKind;
  readonly header: string;
  readonly width?: string;  // Tailwind width class, e.g. 'w-16'
  readonly align?: 'left' | 'right' | 'center';
}

// ── Inspection tool definition ─────────────────────────────────────────────────

export interface InspectionToolDef {
  /** Unique snake_case identifier, e.g. 'length'. */
  readonly id: string;
  /** Human-readable name shown in the sidebar. */
  readonly name: string;
  /** Category this tool belongs to. */
  readonly categoryId: string;
  /**
   * Optional sub-group label within a category (e.g. 'Linear', 'Circular').
   * When set, the sidebar renders a small section header above the first tool
   * in each group, so related tools cluster visually without extra nesting.
   */
  readonly subGroup?: string;
  /** Short description shown on hover / in tool panel. */
  readonly description: string;
  /** Which interaction primitive drives this tool. */
  readonly interactionToolId: InteractionToolId;
  /** Primary unit label for display (e.g. 'mm', 'mm²', 'rad'). */
  readonly unitLabel: string;
  /** Default decimal precision for this tool type. */
  readonly defaultPrecision: number;
  /** Algorithm / method name, e.g. 'Euclidean distance'. */
  readonly method: string;
  /** Columns to show in the saved measurements table. */
  readonly tableColumns: ReadonlyArray<TableColumn>;
  /**
   * Returns the dynamic property fields for the tool panel.
   * Called on each render — returns new objects every time (cheap, pure).
   */
  getPropertyFields(
    result: EngineeredValue | null,
    idealValue?: number | null,
    tolerance?: number | null,
  ): PropertyField[];
}

// ── Category definition ────────────────────────────────────────────────────────

export interface InspectionCategory {
  readonly id: string;
  readonly label: string;
  /** Lucide icon name (string) — imported dynamically in the sidebar. */
  readonly icon: string;
  readonly description: string;
}
