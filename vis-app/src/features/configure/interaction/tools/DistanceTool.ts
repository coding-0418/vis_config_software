import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const ACTIVE_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2 };
const PREVIEW_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '6 4' };
const DOT_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2, fill: '#fff' };

export class DistanceTool implements InteractionTool {
  readonly toolId = 'distance';
  readonly toolName = 'Distance';

  private phase: InteractionPhase = 'waiting';
  private p1: NPoint | null = null;
  private p2: NPoint | null = null;
  private cursor: NPoint = { x: 0, y: 0 };

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;

    if (!this.p1) {
      this.p1 = { x: e.normX, y: e.normY };
      this.phase = 'drawing';
    } else {
      this.p2 = { x: e.normX, y: e.normY };
      this.phase = 'completed';
    }
  }

  onMouseMove(e: ToolMouseEvent): void {
    this.cursor = { x: e.normX, y: e.normY };
  }

  onMouseUp(_e: ToolMouseEvent): void {
    // Distance tool is click-click, not drag — no action on mouseup
  }

  onDblClick(_e: ToolMouseEvent): void {
    // Double-click cancels back to first point
    if (this.phase === 'drawing') {
      this.p1 = null;
      this.phase = 'waiting';
    }
  }

  onKeyDown(key: string): void {
    if (key === 'Escape') {
      this.reset();
    }
  }

  getShapes(): OverlayShape[] {
    const shapes: OverlayShape[] = [];

    if (this.p1) {
      const end = this.phase === 'completed' && this.p2 ? this.p2 : this.cursor;
      const lineStyle = this.phase === 'completed' ? ACTIVE_STYLE : PREVIEW_STYLE;

      shapes.push({ kind: 'line', id: 'dist-line', p1: this.p1, p2: end, style: lineStyle });
      shapes.push({ kind: 'dot', id: 'dist-p1', p: this.p1, r: 4, style: DOT_STYLE });

      if (this.phase === 'completed' && this.p2) {
        shapes.push({ kind: 'dot', id: 'dist-p2', p: this.p2, r: 4, style: DOT_STYLE });
      }
    }

    return shapes;
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if (this.phase !== 'completed' || !this.p1 || !this.p2) return null;
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [this.p1, this.p2],
      absPoints: [],
    };
  }

  getCursor(_norm: NPoint): string {
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.p1 = null;
    this.p2 = null;
  }
}
