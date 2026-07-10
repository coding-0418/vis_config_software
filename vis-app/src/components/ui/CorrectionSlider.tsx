import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/utils';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  color?: 'red' | 'green' | 'blue' | 'default';
  /** Called on every frame while dragging — for live image preview only. */
  onChange: (value: number) => void;
  /**
   * Called once when the pointer is released.
   * @param newValue  The committed (final) value.
   * @param prevValue The value captured at the moment the drag began.
   *
   * This guarantees callers always receive the true before/after pair
   * even though the store was updated continuously during the drag.
   */
  onCommit: (newValue: number, prevValue: number) => void;
  className?: string;
}

const trackColors: Record<NonNullable<SliderProps['color']>, string> = {
  red:     'accent-red-500',
  green:   'accent-green-500',
  blue:    'accent-blue-500',
  default: 'accent-primary-500',
};

export const CorrectionSlider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 255,
  step = 1,
  color = 'default',
  onChange,
  onCommit,
  className,
}) => {
  // Local draft tracks the in-flight value while dragging so the numeric
  // readout stays current without waiting for the parent store to re-render.
  const [draft, setDraft] = useState<number | null>(null);

  // Captures the value at the exact moment the pointer goes down — before
  // any preview changes have updated the store.  This is used in onCommit
  // so the caller receives the true "before" value, not the post-preview value.
  const dragStartValueRef = useRef<number>(value);

  const displayed = draft ?? value;
  const pct = ((displayed - min) / (max - min)) * 100;

  const handlePointerDown = useCallback(() => {
    // Snapshot the current (committed) value before the drag begins.
    dragStartValueRef.current = value;
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setDraft(v);
    onChange(v);
  }, [onChange]);

  const handlePointerUp = useCallback(() => {
    if (draft !== null) {
      onCommit(draft, dragStartValueRef.current);
      setDraft(null);
    }
  }, [draft, onCommit]);

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <span className="text-xs font-medium text-neutral-600 w-5 shrink-0">{label}</span>
      <div className="flex-1 relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayed}
          onPointerDown={handlePointerDown}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          className={cn(
            'w-full h-1.5 rounded-full appearance-none cursor-pointer',
            'bg-neutral-200',
            trackColors[color],
          )}
          style={{
            background: `linear-gradient(to right, currentColor ${pct}%, #e2e8f0 ${pct}%)`,
          }}
        />
      </div>
      <span className="text-2xs font-mono text-neutral-500 w-7 text-right shrink-0">{displayed}</span>
    </div>
  );
};
