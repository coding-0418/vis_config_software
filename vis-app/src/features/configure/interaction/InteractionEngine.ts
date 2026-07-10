import type { InteractionTool, InteractionPhase, MeasurementResult, NPoint, OverlayShape, ToolMouseEvent } from './types';
import { createToolForName } from './toolRegistry';

/**
 * InteractionEngine
 *
 * Owns the active tool lifecycle. ConfigurePage/CameraWorkspace never interact
 * with individual tools directly — only through this engine.
 *
 * Designed to be instantiated once as a stable ref (useRef) so it survives
 * React re-renders without triggering unnecessary state updates.
 */
export class InteractionEngine {
  private tool: InteractionTool | null = null;
  private onChange: (() => void) | null = null;

  /** Register a callback invoked whenever the engine's visual state changes. */
  setChangeCallback(cb: () => void) {
    this.onChange = cb;
  }

  private notify() {
    this.onChange?.();
  }

  /** Activate a tool by the sidebar tool name. Resets any current tool. */
  activateTool(toolName: string): boolean {
    const next = createToolForName(toolName);
    if (!next) {
      console.warn('[InteractionEngine] no tool registered for:', toolName);
      return false;
    }
    this.tool = next;
    console.debug('[InteractionEngine] activated tool:', next.toolName);
    this.notify();
    return true;
  }

  /** Deactivate any current tool (e.g., on retake / cancel). */
  deactivate() {
    this.tool = null;
    this.notify();
  }

  /** Reset the current tool's state without deactivating it. */
  reset() {
    this.tool?.reset();
    this.notify();
  }

  // ── Event forwarding ──────────────────────────────────────────────────────

  onMouseDown(e: ToolMouseEvent): void {
    if (!this.tool) return;
    this.tool.onMouseDown(e);
    this.notify();
  }

  onMouseMove(e: ToolMouseEvent): void {
    if (!this.tool) return;
    this.tool.onMouseMove(e);
    this.notify();
  }

  onMouseUp(e: ToolMouseEvent): void {
    if (!this.tool) return;
    this.tool.onMouseUp(e);
    this.notify();
  }

  onDblClick(e: ToolMouseEvent): void {
    if (!this.tool) return;
    this.tool.onDblClick(e);
    this.notify();
  }

  onKeyDown(key: string): void {
    if (!this.tool) return;
    this.tool.onKeyDown(key);
    this.notify();
  }

  // ── Derived state (read by useInteractionEngine hook) ─────────────────────

  getPhase(): InteractionPhase {
    return this.tool?.getPhase() ?? 'idle';
  }

  getShapes(): OverlayShape[] {
    return this.tool?.getShapes() ?? [];
  }

  getResult(): MeasurementResult | null {
    return this.tool?.getResult() ?? null;
  }

  getCursor(norm: NPoint): string {
    return this.tool?.getCursor(norm) ?? 'default';
  }

  getActiveToolName(): string | null {
    return this.tool?.toolName ?? null;
  }

  /**
   * Compute measured value in mm from the current result and a px-per-mm scale.
   * Returns null when the tool hasn't completed or absPoints are not yet populated.
   */
  getMeasuredValueMm(pxPerMm: number): number | null {
    const result = this.getResult();
    if (!result || result.absPoints.length < 2) return null;
    const [a, b] = result.absPoints;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return parseFloat((Math.sqrt(dx * dx + dy * dy) / pxPerMm).toFixed(3));
  }
}
