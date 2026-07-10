import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const LINE_STYLE: ShapeStyle  = { stroke: '#f59e0b', strokeWidth: 2 };
const PREVIEW_STYLE: ShapeStyle = { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 4' };
const DOT_STYLE: ShapeStyle   = { stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' };

export class AngleTool implements InteractionTool {
  readonly toolId = 'angle';
  readonly toolName = 'Angle';

  private phase: InteractionPhase = 'waiting';
  private p1: NPoint | null = null; // first arm end
  private vertex: NPoint | null = null;
  private p2: NPoint | null = null; // second arm end
  private cursor: NPoint = { x: 0, y: 0 };

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;

    if (!this.p1) {
      this.p1 = { x: e.normX, y: e.normY };
      this.phase = 'drawing';
    } else if (!this.vertex) {
      this.vertex = { x: e.normX, y: e.normY };
    } else {
      this.p2 = { x: e.normX, y: e.normY };
      this.phase = 'completed';
    }
  }

  onMouseMove(e: ToolMouseEvent): void {
    this.cursor = { x: e.normX, y: e.normY };
  }

  onMouseUp(_e: ToolMouseEvent): void {}

  onDblClick(_e: ToolMouseEvent): void {
    if (this.phase === 'drawing') this.reset();
  }

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
  }

  getShapes(): OverlayShape[] {
    const shapes: OverlayShape[] = [];
    if (!this.p1) return shapes;

    const cur = this.cursor;
    const vtx = this.vertex ?? cur;

    // First arm: p1 → vertex
    shapes.push({ kind: 'line', id: 'angle-arm1', p1: this.p1, p2: vtx, style: this.vertex ? LINE_STYLE : PREVIEW_STYLE });
    shapes.push({ kind: 'dot', id: 'angle-p1', p: this.p1, r: 4, style: DOT_STYLE });
    shapes.push({ kind: 'dot', id: 'angle-vtx', p: vtx, r: 4, style: DOT_STYLE });

    if (this.vertex) {
      const arm2End = this.p2 ?? cur;
      shapes.push({ kind: 'line', id: 'angle-arm2', p1: this.vertex, p2: arm2End, style: this.p2 ? LINE_STYLE : PREVIEW_STYLE });
      if (this.p2) {
        shapes.push({ kind: 'dot', id: 'angle-p2', p: this.p2, r: 4, style: DOT_STYLE });
      }
    }

    return shapes;
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if (this.phase !== 'completed' || !this.p1 || !this.vertex || !this.p2) return null;
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [this.p1, this.vertex, this.p2],
      absPoints: [],
    };
  }

  getCursor(_norm: NPoint): string {
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.p1 = null;
    this.vertex = null;
    this.p2 = null;
  }
}
