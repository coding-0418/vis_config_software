import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import type { InspectionToolDef } from '@/features/inspection/types';
import type { EngineeredValue } from '@/features/units/types';

// ── Props ──────────────────────────────────────────────────────────────────────

interface InspectionPanelProps {
  /** Active tool definition. Null when no tool is selected. */
  toolDef: InspectionToolDef | null;
  /**
   * The confirmed engineered measurement result.
   * Non-null only after the operator clicks "Confirm Measurement".
   * Null between measurements or before confirmation.
   */
  engineeredValue: EngineeredValue | null;
  /**
   * Fired when the operator clicks "Save Measurement".
   * The panel supplies only what it owns (ideal value + tolerance).
   * ConfigurePage assembles the full MeasurementRecord.
   */
  onSave: (spec: { idealValue: number; tolerance: number }) => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  toolDef,
  engineeredValue,
  onSave,
  className,
}) => {
  const [idealStr, setIdealStr] = useState('');
  const [tolStr,   setTolStr]   = useState('');
  const [error,    setError]    = useState<string | null>(null);

  // When a new confirmed measurement arrives, pre-populate the ideal value
  // with the measured value. The operator can override it manually.
  useEffect(() => {
    if (engineeredValue !== null && 'rawValue' in engineeredValue) {
      const raw = (engineeredValue as { rawValue: number }).rawValue;
      setIdealStr(String(raw));
    } else {
      setIdealStr('');
    }
    setTolStr('');
    setError(null);
  }, [engineeredValue]);

  // ── Derived values ───────────────────────────────────────────────────────

  const ideal = idealStr !== '' ? parseFloat(idealStr) : null;
  const tol   = tolStr   !== '' ? parseFloat(tolStr)   : null;

  const passMin = ideal !== null && tol !== null && !isNaN(ideal) && !isNaN(tol) ? ideal - tol : null;
  const passMax = ideal !== null && tol !== null && !isNaN(ideal) && !isNaN(tol) ? ideal + tol : null;

  const units   = toolDef?.unitLabel ?? '';
  const canSave = engineeredValue !== null && ideal !== null && !isNaN(ideal)
               && tol !== null && !isNaN(tol) && tol >= 0;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = () => {
    setError(null);
    if (!toolDef)           { setError('Select an inspection tool first.');       return; }
    if (!engineeredValue)   { setError('Confirm a measurement first.');           return; }
    if (ideal == null || isNaN(ideal))           { setError('Enter a valid ideal value.');          return; }
    if (tol  == null || isNaN(tol) || tol < 0)  { setError('Enter a valid tolerance (≥ 0).');     return; }
    onSave({ idealValue: ideal, tolerance: tol });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="px-3 py-2.5 space-y-2.5">

        {/* Section label */}
        <p className="text-2xs font-bold text-neutral-500 uppercase tracking-widest">
          Engineering Specification
        </p>

        {/* Measured value — prominent display */}
        <div className="flex items-center justify-between">
          <span className="text-2xs text-neutral-500">Measured</span>
          <span className={cn(
            'text-sm font-mono font-bold tabular-nums',
            engineeredValue ? 'text-primary-700' : 'text-neutral-300',
          )}>
            {engineeredValue?.displayValue ?? '—'}
          </span>
        </div>

        {/* Ideal value input */}
        <div className="space-y-1">
          <label className="text-2xs font-semibold text-neutral-600 uppercase tracking-wide">
            Ideal Value {units && <span className="text-neutral-400 normal-case font-normal">({units})</span>}
          </label>
          <input
            type="number"
            step="any"
            placeholder="From engineering drawing"
            value={idealStr}
            onChange={(e) => setIdealStr(e.target.value)}
            disabled={!engineeredValue}
            className={cn(
              'w-full h-7 px-2 text-xs font-mono border rounded outline-none transition-colors',
              'bg-white text-neutral-800 border-border',
              'focus:border-primary-400 focus:ring-1 focus:ring-primary-100',
              'disabled:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed',
            )}
          />
        </div>

        {/* Tolerance input */}
        <div className="space-y-1">
          <label className="text-2xs font-semibold text-neutral-600 uppercase tracking-wide">
            Tolerance (±) {units && <span className="text-neutral-400 normal-case font-normal">({units})</span>}
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="±"
            value={tolStr}
            onChange={(e) => setTolStr(e.target.value)}
            disabled={!engineeredValue}
            className={cn(
              'w-full h-7 px-2 text-xs font-mono border rounded outline-none transition-colors',
              'bg-white text-neutral-800 border-border',
              'focus:border-primary-400 focus:ring-1 focus:ring-primary-100',
              'disabled:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed',
            )}
          />
        </div>

        {/* PASS RANGE — live calculation */}
        {passMin !== null && passMax !== null ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 px-2.5 py-2 space-y-1">
            <p className="text-2xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Pass Range
            </p>
            {/* Min */}
            <div className="flex items-center justify-between">
              <span className="text-2xs text-neutral-500">Min</span>
              <span className="text-xs font-mono font-semibold text-danger-600 tabular-nums">
                {passMin.toFixed(3)} {units}
              </span>
            </div>
            {/* Rule */}
            <div className="border-t border-dashed border-neutral-300 my-0.5" />
            {/* Target */}
            <div className="flex items-center justify-between">
              <span className="text-2xs text-neutral-500">Target</span>
              <span className="text-xs font-mono font-bold text-primary-700 tabular-nums">
                {ideal!.toFixed(3)} {units}
              </span>
            </div>
            {/* Rule */}
            <div className="border-t border-dashed border-neutral-300 my-0.5" />
            {/* Max */}
            <div className="flex items-center justify-between">
              <span className="text-2xs text-neutral-500">Max</span>
              <span className="text-xs font-mono font-semibold text-danger-600 tabular-nums">
                {passMax.toFixed(3)} {units}
              </span>
            </div>
          </div>
        ) : (
          /* Placeholder for PASS range before values entered */
          <div className="rounded border border-dashed border-neutral-200 px-2.5 py-2">
            <p className="text-2xs text-neutral-400 text-center">
              {engineeredValue
                ? 'Enter ideal value and tolerance to see PASS range'
                : 'Confirm a measurement to begin'}
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-2xs text-danger-600 font-medium">{error}</p>
        )}

        {/* Save button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Save className="w-3 h-3" />}
          onClick={handleSave}
          disabled={!canSave}
          className="w-full"
        >
          Save Measurement
        </Button>
      </div>
    </div>
  );
};

