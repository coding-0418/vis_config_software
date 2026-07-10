import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const POLY_STYLE: ShapeStyle   = { stroke: '#7c3aed', strokeWidth: 2, fill: 'rgba(124,58,237,0.08)' };
const PREVIEW_STYLE: ShapeStyle = { stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '5 4' };
const DOT_STYLE: ShapeStyle    = { stroke: '#7c3aed', strokeWidth: 2, fill: '#fff' };
const CLOSE_DOT_STYLE: ShapeStyle = { stroke: '#7c3aed', strokeWidth: 2, fill: '#7c3aed' };
const CLOSE_THRESHOLD = 0.025;

function dist(a: NPoint, b: NPoint) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export class PolygonTool implements InteractionTool {
  readonly toolId = 'polygon';
  readonly toolName = 'Polygon';

  private phase: InteractionPhase = 'waiting';
  private points: NPoint[] = [];
  private cursor: NPoint = { x: 0, y: 0 };

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;

    if (this.points.length >= 3) {
      const first = this.points[0];
      if (dist({ x: e.normX, y: e.normY }, first) < CLOSE_THRESHOLD) {
        this.phase = 'completed';
        return;
      }
    }

    this.points.push({ x: e.normX, y: e.normY });
    if (this.phase === 'waiting') this.phase = 'drawing';
  }

  onMouseMove(e: ToolMouseEvent): void {
    this.cursor = { x: e.normX, y: e.normY };
  }

  onMouseUp(_e: ToolMouseEvent): void {}

  onDblClick(_e: ToolMouseEvent): void {
    if (this.points.length >= 3) {
      this.phase = 'completed';
    }
  }

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
    if (key === 'Enter' && this.points.length >= 3) this.phase = 'completed';
    if (key === 'Backspace' && this.points.length > 0) {
      this.points.pop();
      if (this.points.length === 0) this.phase = 'waiting';
    }
  }

  getShapes(): OverlayShape[] {
    const shapes: OverlayShape[] = [];
    if (this.points.length === 0) return shapes;

    if (this.phase === 'completed') {
      shapes.push({ kind: 'polygon', id: 'poly-shape', points: this.points, closed: true, style: POLY_STYLE });
    } else {
      // Draw each segment explicitly so we can show the preview arm
      for (let i = 0; i + 1 < this.points.length; i++) {
        shapes.push({ kind: 'line', id: `poly-seg-${i}`, p1: this.points[i], p2: this.points[i + 1], style: POLY_STYLE });
      }
      // Preview arm: last point → cursor
      const last = this.points[this.points.length - 1];
      shapes.push({ kind: 'line', id: 'poly-preview', p1: last, p2: this.cursor, style: PREVIEW_STYLE });
    }

    // Dots for each vertex
    this.points.forEach((p, i) => {
      const isFirst = i === 0;
      const nearFirst = isFirst && this.phase === 'drawing' && this.points.length >= 3
        && dist(this.cursor, p) < CLOSE_THRESHOLD;
      shapes.push({ kind: 'dot', id: `poly-dot-${i}`, p, r: nearFirst ? 7 : 4, style: nearFirst ? CLOSE_DOT_STYLE : DOT_STYLE });
    });

    return shapes;
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
  }
}
