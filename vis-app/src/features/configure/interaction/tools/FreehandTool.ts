import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const PATH_STYLE: ShapeStyle = { stroke: '#16a34a', strokeWidth: 2, fill: 'rgba(22,163,74,0.06)' };

export class FreehandTool implements InteractionTool {
  readonly toolId = 'freehand';
  readonly toolName = 'Freehand';

  private phase: InteractionPhase = 'waiting';
  private points: NPoint[] = [];
  private dragging = false;

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;
    this.points = [{ x: e.normX, y: e.normY }];
    this.dragging = true;
    this.phase = 'drawing';
  }

  onMouseMove(e: ToolMouseEvent): void {
    if (!this.dragging) return;
    const last = this.points[this.points.length - 1];
    const dx = e.normX - last.x;
    const dy = e.normY - last.y;
    // Minimum step to avoid thousands of redundant points
    if (dx * dx + dy * dy > 0.0001) {
      this.points.push({ x: e.normX, y: e.normY });
    }
  }

  onMouseUp(_e: ToolMouseEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.points.length > 2) {
      this.phase = 'completed';
    } else {
      this.points = [];
      this.phase = 'waiting';
    }
  }

  onDblClick(_e: ToolMouseEvent): void {}

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
  }

  getShapes(): OverlayShape[] {
    if (this.points.length < 2) return [];
    return [{
      kind: 'polygon',
      id: 'freehand-path',
      points: this.points,
      closed: this.phase === 'completed',
      style: PATH_STYLE,
    }];
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if (this.phase !== 'completed' || this.points.length < 3) return null;
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [...this.points],
      absPoints: [],
    };
  }

  getCursor(_norm: NPoint): string {
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.points = [];
    this.dragging = false;
  }
}
