import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const CIRCLE_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2, fill: 'none' };
const PREVIEW_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '6 4', fill: 'none' };
const DOT_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 2, fill: '#fff' };
const RADIUS_STYLE: ShapeStyle = { stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '3 3' };

function dist(a: NPoint, b: NPoint): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export class CircleTool implements InteractionTool {
  readonly toolId = 'circle';
  readonly toolName = 'Circle';

  private phase: InteractionPhase = 'waiting';
  private center: NPoint | null = null;
  private radius = 0;
  private cursor: NPoint = { x: 0, y: 0 };
  private dragging = false;

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;
    this.center = { x: e.normX, y: e.normY };
    this.radius = 0;
    this.dragging = true;
    this.phase = 'drawing';
  }

  onMouseMove(e: ToolMouseEvent): void {
    this.cursor = { x: e.normX, y: e.normY };
    if (this.dragging && this.center) {
      this.radius = dist(this.center, { x: e.normX, y: e.normY });
    }
  }

  onMouseUp(e: ToolMouseEvent): void {
    if (!this.dragging || !this.center) return;
    this.radius = dist(this.center, { x: e.normX, y: e.normY });
    this.dragging = false;
    if (this.radius > 0.005) {
      this.phase = 'completed';
    } else {
      this.center = null;
      this.phase = 'waiting';
    }
  }

  onDblClick(_e: ToolMouseEvent): void {}

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
  }

  getShapes(): OverlayShape[] {
    if (!this.center) return [];
    const shapes: OverlayShape[] = [];
    const r = this.dragging
      ? dist(this.center, this.cursor)
      : this.radius;

    shapes.push({
      kind: 'circle',
      id: 'circle-main',
      center: this.center,
      radius: r,
      style: this.dragging ? PREVIEW_STYLE : CIRCLE_STYLE,
    });
    shapes.push({ kind: 'dot', id: 'circle-center', p: this.center, r: 4, style: DOT_STYLE });

    // Radius line
    const edgePt: NPoint = { x: this.center.x + r, y: this.center.y };
    shapes.push({ kind: 'line', id: 'circle-radius', p1: this.center, p2: edgePt, style: RADIUS_STYLE });

    return shapes;
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if (this.phase !== 'completed' || !this.center) return null;
    const edge: NPoint = { x: this.center.x + this.radius, y: this.center.y };
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [this.center, edge],
      absPoints: [],
    };
  }

  getCursor(_norm: NPoint): string {
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.center = null;
    this.radius = 0;
    this.dragging = false;
  }
}
