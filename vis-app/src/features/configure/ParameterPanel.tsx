import React from 'react';
import { CheckCircle2, Clock, Crosshair, RotateCcw } from 'lucide-react';
import { useConfigurationStore } from '@/stores/configurationStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { cn, formatTimestamp } from '@/utils';

export const ParameterPanel: React.FC = () => {
  const { selectedCategory, selectedParameters, confirmParameter, removeParameter } =
    useConfigurationStore();

  const latest = selectedParameters[selectedParameters.length - 1] ?? null;

  return (
    <aside className="w-56 shrink-0 bg-surface border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-neutral-50 shrink-0">
        <h2 className="text-2xs font-bold text-neutral-500 uppercase tracking-widest">
          Selected Parameter
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Current selection info */}
        <div className="p-3 border-b border-border space-y-2.5">
          <InfoRow label="Category" value={selectedCategory ?? '—'} />
          <InfoRow label="Image" value="Captured" valueClass="text-success-600" />

          <div className="pt-1">
            <p className="text-2xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              Pixel Parameter
            </p>
            <div className="grid grid-cols-3 gap-1">
              {(['R', 'G', 'B'] as const).map((ch) => (
                <div key={ch} className="bg-neutral-50 border border-border rounded px-1.5 py-1 text-center">
                  <p className="text-2xs text-neutral-400">{ch}</p>
                  <p className="text-xs font-mono font-medium text-neutral-700">
                    {latest?.pixelValues ? latest.pixelValues[ch.toLowerCase() as 'r'|'g'|'b'] : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              Measurement
            </p>
            <div className="space-y-1">
              {latest?.measurementValues
                ? Object.entries(latest.measurementValues).map(([k, v]) => (
                    <InfoRow key={k} label={k} value={`${v} mm`} />
                  ))
                : (
                  <>
                    <InfoRow label="Length" value="—" />
                    <InfoRow label="Width"  value="—" />
                  </>
                )}
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <p className="text-2xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              Coordinates
            </p>
            {latest?.coordinates?.length ? (
              latest.coordinates.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-1 text-xs font-mono text-neutral-600">
                  <Crosshair className="w-2.5 h-2.5 text-primary-400" />
                  <span>P{i + 1}: ({c.x.toFixed(2)}, {c.y.toFixed(2)})</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 italic">No capture yet</p>
            )}
          </div>

          <div>
            <p className="text-2xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Confirm</p>
            <StatusBadge variant={latest?.confirmed ? 'pass' : 'pending'} size="sm">
              {latest?.confirmed ? 'Confirmed' : 'Pending'}
            </StatusBadge>
          </div>
        </div>

        {/* Parameter history */}
        <div className="p-3">
          <p className="text-2xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
            History ({selectedParameters.length})
          </p>

          {selectedParameters.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No parameters added yet.</p>
          ) : (
            <div className="space-y-1.5">
              {[...selectedParameters].reverse().map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'rounded border p-2 text-xs',
                    p.confirmed
                      ? 'border-success-500/30 bg-success-50'
                      : 'border-border bg-neutral-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate capitalize">
                        {p.measurementName || p.measurementCategory}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-neutral-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-2xs">
                          {p.capturedAt ? formatTimestamp(new Date(p.capturedAt)) : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!p.confirmed && (
                        <button
                          onClick={() => confirmParameter(p.id)}
                          className="p-0.5 rounded text-neutral-400 hover:text-success-600 transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeParameter(p.id)}
                        className="p-0.5 rounded text-neutral-400 hover:text-danger-500 transition-colors"
                        title="Remove"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <StatusBadge
                    variant={p.confirmed ? 'pass' : 'pending'}
                    size="sm"
                    className="mt-1"
                  >
                    {p.confirmed ? 'Confirmed' : 'Pending'}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const InfoRow = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-neutral-500 shrink-0">{label}:</span>
    <span className={cn('text-xs font-medium text-neutral-800 text-right truncate', valueClass)}>
      {value}
    </span>
  </div>
);
