import React from 'react';
import type { OverlayShape, ShapeStyle } from './interaction/types';

interface Props {
  shapes: OverlayShape[];
  containerWidth: number;
  containerHeight: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalised value → percentage string, e.g. 0.5 → "50%" */
const pct = (v: number) => `${(v * 100).toFixed(4)}%`;

function strokeProps(s: ShapeStyle) {
  return {
    stroke:          s.stroke ?? 'none',
    strokeWidth:     s.strokeWidth ?? 1,
    strokeDasharray: s.strokeDasharray,
    fill:            s.fill ?? 'none',
    fillOpacity:     s.fillOpacity,
  } as const;
}

// ── Shape renderers ───────────────────────────────────────────────────────────

function RenderLine({ shape }: { shape: Extract<OverlayShape, { kind: 'line' }> }) {
  return (
    <line
      x1={pct(shape.p1.x)} y1={pct(shape.p1.y)}
      x2={pct(shape.p2.x)} y2={pct(shape.p2.y)}
      {...strokeProps(shape.style)}
    />
  );
}

function RenderRect({ shape }: { shape: Extract<OverlayShape, { kind: 'rect' }> }) {
  return (
    <rect
      x={pct(shape.origin.x)}
      y={pct(shape.origin.y)}
      width={pct(shape.size.x)}
      height={pct(shape.size.y)}
      className={shape.style.animated ? 'marching-ants' : undefined}
      {...strokeProps(shape.style)}
    />
  );
}

function RenderCircle({ shape, cw }: { shape: Extract<OverlayShape, { kind: 'circle' }>; cw: number }) {
  return (
    <circle
      cx={pct(shape.center.x)}
      cy={pct(shape.center.y)}
      r={shape.radius * cw}
      {...strokeProps(shape.style)}
    />
  );
}

function RenderPolygon({ shape }: { shape: Extract<OverlayShape, { kind: 'polygon' }> }) {
  const pts = shape.points
    .map((p) => `${(p.x * 100).toFixed(4)}% ${(p.y * 100).toFixed(4)}%`)
    .join(' ');
  return (
    <polygon
      points={pts}
      fillRule="nonzero"
      {...strokeProps(shape.style)}
    />
  );
}

function RenderDot({ shape }: { shape: Extract<OverlayShape, { kind: 'dot' }> }) {
  return (
    <circle
      cx={pct(shape.p.x)}
      cy={pct(shape.p.y)}
      r={shape.r ?? 4}
      {...strokeProps(shape.style)}
    />
  );
}

function RenderText({ shape }: { shape: Extract<OverlayShape, { kind: 'text' }> }) {
  return (
    <text
      x={pct(shape.p.x)}
      y={pct(shape.p.y)}
      dy={shape.dy ?? 0}
      textAnchor={shape.anchor ?? 'middle'}
      fontSize={11}
      fontFamily="monospace"
      fill="#fff"
      stroke="#000"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {shape.text}
    </text>
  );
}

function RenderHandle({ shape }: { shape: Extract<OverlayShape, { kind: 'handle' }> }) {
  const half = 0.008;
  return (
    <rect
      x={pct(shape.p.x - half)}
      y={pct(shape.p.y - half)}
      width={pct(half * 2)}
      height={pct(half * 2)}
      rx={2}
      fill="#fff"
      stroke="#2563eb"
      strokeWidth={1.5}
      style={{ cursor: shape.hcursor }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const SelectionOverlay: React.FC<Props> = ({ shapes, containerWidth, containerHeight }) => {
  if (shapes.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes marchingAnts { to { stroke-dashoffset: -20; } }
        .marching-ants { stroke-dasharray: 6 4; animation: marchingAnts 0.5s linear infinite; }
      `}</style>
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{ pointerEvents: 'none' }}
        viewBox={`0 0 ${containerWidth || 100} ${containerHeight || 100}`}
        preserveAspectRatio="none"
      >
        {shapes.map((shape) => {
          switch (shape.kind) {
            case 'line':    return <RenderLine    key={shape.id} shape={shape} />;
            case 'rect':    return <RenderRect    key={shape.id} shape={shape} />;
            case 'circle':  return <RenderCircle  key={shape.id} shape={shape} cw={containerWidth} />;
            case 'polygon': return <RenderPolygon key={shape.id} shape={shape} />;
            case 'dot':     return <RenderDot     key={shape.id} shape={shape} />;
            case 'text':    return <RenderText    key={shape.id} shape={shape} />;
            case 'handle':  return <RenderHandle  key={shape.id} shape={shape} />;
          }
        })}
      </svg>
    </>
  );
};
