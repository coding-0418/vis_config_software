import type {
  InteractionTool,
  InteractionPhase,
  MeasurementResult,
  NPoint,
  NRect,
  OverlayShape,
  ShapeStyle,
  ToolMouseEvent,
} from '../types';

const BORDER_STYLE: ShapeStyle = {
  stroke: '#000',
  strokeWidth: 1,
  fill: 'rgba(255,255,255,0.08)',
  animated: true,
};
const HANDLE_CURSOR: Record<string, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  w: 'w-resize',                  e: 'e-resize',
  sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  move: 'move',
};
type Handle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | 'move';

function rectFromPoints(a: NPoint, b: NPoint): NRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

function handlePositions(r: NRect): Record<Handle, NPoint> {
  return {
    nw:   { x: r.x,           y: r.y },
    n:    { x: r.x + r.w / 2, y: r.y },
    ne:   { x: r.x + r.w,     y: r.y },
    w:    { x: r.x,           y: r.y + r.h / 2 },
    e:    { x: r.x + r.w,     y: r.y + r.h / 2 },
    sw:   { x: r.x,           y: r.y + r.h },
    s:    { x: r.x + r.w / 2, y: r.y + r.h },
    se:   { x: r.x + r.w,     y: r.y + r.h },
    move: { x: r.x + r.w / 2, y: r.y + r.h / 2 },
  };
}

function hitHandle(norm: NPoint, r: NRect, threshold = 0.018): Handle | null {
  const positions = handlePositions(r);
  const handles: Handle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  for (const h of handles) {
    const p = positions[h];
    const dx = norm.x - p.x;
    const dy = norm.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < threshold) return h;
  }
  // Interior hit → move
  if (
    norm.x >= r.x && norm.x <= r.x + r.w &&
    norm.y >= r.y && norm.y <= r.y + r.h
  ) return 'move';
  return null;
}

export class ROITool implements InteractionTool {
  readonly toolId = 'roi';
  readonly toolName = 'ROI';

  private phase: InteractionPhase = 'waiting';
  private dragStart: NPoint | null = null;
  private rect: NRect | null = null;

  // Editing state
  private activeHandle: Handle | null = null;
  private handleDragStart: NPoint | null = null;
  private rectAtDragStart: NRect | null = null;

  onMouseDown(e: ToolMouseEvent): void {
    if (e.button !== 0) return;

    if (this.phase === 'editing' && this.rect) {
      const h = hitHandle({ x: e.normX, y: e.normY }, this.rect);
      if (h) {
        this.activeHandle = h;
        this.handleDragStart = { x: e.normX, y: e.normY };
        this.rectAtDragStart = { ...this.rect };
        return;
      }
      // Click outside → start a new rect
      this.rect = null;
    }

    this.dragStart = { x: e.normX, y: e.normY };
    this.rect = { x: e.normX, y: e.normY, w: 0, h: 0 };
    this.phase = 'drawing';
  }

  onMouseMove(e: ToolMouseEvent): void {
    if (this.phase === 'drawing' && this.dragStart) {
      this.rect = rectFromPoints(this.dragStart, { x: e.normX, y: e.normY });
      return;
    }

    if (this.phase === 'editing' && this.activeHandle && this.handleDragStart && this.rectAtDragStart) {
      const r = this.rectAtDragStart;
      const dx = e.normX - this.handleDragStart.x;
      const dy = e.normY - this.handleDragStart.y;

      let { x, y, w, h } = r;

      switch (this.activeHandle) {
        case 'move': x += dx; y += dy; break;
        case 'nw':   x += dx; y += dy; w -= dx; h -= dy; break;
        case 'n':              y += dy;           h -= dy; break;
        case 'ne':             y += dy; w += dx;  h -= dy; break;
        case 'w':    x += dx;           w -= dx;           break;
        case 'e':                        w += dx;           break;
        case 'sw':   x += dx;           w -= dx; h += dy;  break;
        case 's':                                 h += dy;  break;
        case 'se':                       w += dx; h += dy;  break;
      }

      // Normalise negative size
      if (w < 0) { x += w; w = -w; }
      if (h < 0) { y += h; h = -h; }
      this.rect = { x, y, w, h };
    }
  }

  onMouseUp(_e: ToolMouseEvent): void {
    if (this.phase === 'drawing') {
      if (this.rect && (this.rect.w > 0.005 || this.rect.h > 0.005)) {
        this.phase = 'completed';
      } else {
        // Too small — discard
        this.rect = null;
        this.phase = 'waiting';
      }
      this.dragStart = null;
    } else if (this.phase === 'editing') {
      this.activeHandle = null;
      this.handleDragStart = null;
      this.rectAtDragStart = null;
    }
  }

  onDblClick(_e: ToolMouseEvent): void {
    if (this.phase === 'completed') {
      this.phase = 'editing';
    }
  }

  onKeyDown(key: string): void {
    if (key === 'Escape') this.reset();
    if (key === 'Enter' && this.phase === 'editing') this.phase = 'completed';
  }

  getShapes(): OverlayShape[] {
    const shapes: OverlayShape[] = [];
    if (!this.rect) return shapes;

    shapes.push({
      kind: 'rect',
      id: 'roi-rect',
      origin: { x: this.rect.x, y: this.rect.y },
      size: { x: this.rect.w, y: this.rect.h },
      style: BORDER_STYLE,
    });

    if (this.phase === 'editing') {
      const positions = handlePositions(this.rect);
      const handles: Handle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
      for (const h of handles) {
        shapes.push({
          kind: 'handle',
          id: `roi-handle-${h}`,
          p: positions[h],
          hcursor: HANDLE_CURSOR[h],
        });
      }
    }

    return shapes;
  }

  getPhase(): InteractionPhase {
    return this.phase;
  }

  getResult(): MeasurementResult | null {
    if ((this.phase !== 'completed' && this.phase !== 'editing') || !this.rect) return null;
    const r = this.rect;
    const tl: NPoint = { x: r.x,       y: r.y };
    const tr: NPoint = { x: r.x + r.w, y: r.y };
    const br: NPoint = { x: r.x + r.w, y: r.y + r.h };
    const bl: NPoint = { x: r.x,       y: r.y + r.h };
    return {
      toolId: this.toolId,
      toolName: this.toolName,
      normPoints: [tl, tr, br, bl],
      absPoints: [],
    };
  }

  getCursor(norm: NPoint): string {
    if (this.phase === 'editing' && this.rect) {
      const h = hitHandle(norm, this.rect);
      if (h) return HANDLE_CURSOR[h];
      return 'default';
    }
    return 'crosshair';
  }

  reset(): void {
    this.phase = 'waiting';
    this.rect = null;
    this.dragStart = null;
    this.activeHandle = null;
    this.handleDragStart = null;
    this.rectAtDragStart = null;
  }
}
