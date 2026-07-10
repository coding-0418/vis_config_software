import { useRef, useState, useCallback, useEffect, RefObject } from 'react';
import { InteractionEngine } from './InteractionEngine';
import type { InteractionPhase, MeasurementResult, NPoint, OverlayShape, ToolMouseEvent } from './types';
import { useCalibrationStore } from '@/stores/calibrationStore';
import { useUnitPreferenceStore } from '@/stores/unitPreferenceStore';
import { computeEngineeredValue } from '@/features/units/format';
import type { EngineeredValue } from '@/features/units/types';

export interface InteractionEngineAPI {
  overlayShapes: OverlayShape[];
  phase: InteractionPhase;
  /** Raw geometry result (normPoints + absPoints). Null while in progress. */
  result: MeasurementResult | null;
  /** Engineering-unit value derived from result + calibration + unit preferences. */
  engineeredValue: EngineeredValue | null;
  /** CSS cursor for the canvas container. */
  cursor: string;
  activeToolName: string | null;

  activateTool(toolName: string): boolean;
  deactivate(): void;
  reset(): void;

  onMouseDown(e: ToolMouseEvent): void;
  onMouseMove(e: ToolMouseEvent): void;
  onMouseUp(e: ToolMouseEvent): void;
  onDblClick(e: ToolMouseEvent): void;
  onKeyDown(key: string): void;

  /** Returns the CSS cursor for a specific normalised canvas position (call on mousemove). */
  getCursorAt(norm: NPoint): string;
}

export function useInteractionEngine(
  containerRef: RefObject<HTMLElement | null>,
): InteractionEngineAPI {
  const engineRef = useRef<InteractionEngine | null>(null);
  if (!engineRef.current) engineRef.current = new InteractionEngine();
  const engine = engineRef.current;

  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    engine.setChangeCallback(rerender);
    return () => engine.setChangeCallback(() => {});
  }, [engine, rerender]);

  // ── Read stores ───────────────────────────────────────────────────────────
  const calibration = useCalibrationStore((s) => s.calibration);
  const prefs       = useUnitPreferenceStore((s) => s.prefs);

  // ── Snapshot ──────────────────────────────────────────────────────────────
  const phase          = engine.getPhase();
  const overlayShapes  = engine.getShapes();
  const activeToolName = engine.getActiveToolName();
  const rawResult      = engine.getResult();

  // Enrich result with absolute pixel coordinates from the container.
  const result: MeasurementResult | null = (() => {
    if (!rawResult) return null;
    const el = containerRef.current;
    if (!el) return rawResult;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return rawResult;
    return {
      ...rawResult,
      absPoints: rawResult.normPoints.map((p) => ({
        x: p.x * rect.width,
        y: p.y * rect.height,
      })),
    };
  })();

  // Compute engineering value from the enriched result.
  const engineeredValue: EngineeredValue | null = (() => {
    if (!result || result.absPoints.length === 0) return null;
    const toolId = result.toolId;
    return computeEngineeredValue(toolId, result.absPoints, calibration, prefs);
  })();

  const cursor = engine.getCursor({ x: 0, y: 0 });

  // ── Actions ───────────────────────────────────────────────────────────────
  const activateTool = useCallback((toolName: string) => engine.activateTool(toolName), [engine]);
  const deactivate   = useCallback(() => engine.deactivate(), [engine]);
  const reset        = useCallback(() => engine.reset(), [engine]);

  const onMouseDown = useCallback((e: ToolMouseEvent) => engine.onMouseDown(e), [engine]);
  const onMouseMove = useCallback((e: ToolMouseEvent) => engine.onMouseMove(e), [engine]);
  const onMouseUp   = useCallback((e: ToolMouseEvent) => engine.onMouseUp(e), [engine]);
  const onDblClick  = useCallback((e: ToolMouseEvent) => engine.onDblClick(e), [engine]);
  const onKeyDown   = useCallback((key: string) => engine.onKeyDown(key), [engine]);
  const getCursorAt = useCallback((norm: NPoint) => engine.getCursor(norm), [engine]);

  return {
    overlayShapes,
    phase,
    result,
    engineeredValue,
    cursor,
    activeToolName,
    activateTool,
    deactivate,
    reset,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDblClick,
    onKeyDown,
    getCursorAt,
  };
}
