import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const DOT_STYLE: ShapeStyle = { stroke: '#dc2626', strokeWidth: 2, fill: '#dc2626' };
const CROSSHAIR_STYLE: ShapeStyle = { stroke: '#dc2626', strokeWidth: 1 };

export class PointTool implements InteractionTool {
  readonly toolId = 'point';
  readonly toolName = 'Point';

  private phase: InteractionPhase = 'waiting';
  private p: NPoint | null = null;

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;
    this.p = { x: e.normX, y: e.normY };
    this.phase = 'completed';
  }

  onMouseMove(_e: ToolMouseEvent): void {}
  onMouseUp(_e: ToolMouseEvent): void {}
  onDblClick(_e: ToolMouseEvent): void {}

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
  }

  getShapes(): OverlayShape[] {
    if (!this.p) return [];
    const gap = 0.012;
    const arm = 0.025;
    return [
      { kind: 'dot', id: 'point-dot', p: this.p, r: 3, style: DOT_STYLE },
      // Crosshair arms
      { kind: 'line', id: 'pt-ch-l', p1: { x: this.p.x - arm, y: this.p.y }, p2: { x: this.p.x - gap, y: this.p.y }, style: CROSSHAIR_STYLE },
      { kind: 'line', id: 'pt-ch-r', p1: { x: this.p.x + gap, y: this.p.y }, p2: { x: this.p.x + arm, y: this.p.y }, style: CROSSHAIR_STYLE },
      { kind: 'line', id: 'pt-ch-t', p1: { x: this.p.x, y: this.p.y - arm }, p2: { x: this.p.x, y: this.p.y - gap }, style: CROSSHAIR_STYLE },
      { kind: 'line', id: 'pt-ch-b', p1: { x: this.p.x, y: this.p.y + gap }, p2: { x: this.p.x, y: this.p.y + arm }, style: CROSSHAIR_STYLE },
    ];
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if (!this.p) return null;
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [this.p],
      absPoints: [],
    };
  }

  getCursor(_norm: NPoint): string {
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.p = null;
  }
}
