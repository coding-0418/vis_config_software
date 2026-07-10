import React from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { useImageCorrectionStore } from '@/stores/imageCorrectionStore';
import { CorrectionSlider } from '@/components/ui/CorrectionSlider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import type { ImageCorrectionValues } from '@/types';

interface ImageCorrectionPanelProps {
  // Fired when any channel value changes — used by the parent to log the change
  onChannelChange?: (key: keyof ImageCorrectionValues, prev: number, next: number) => void;
  /** Called when operator clicks "No Image Correction Required". */
  onNoCorrectionRequired?: () => void;
  /** When true, shows a "reviewed" badge indicating the gate has been cleared. */
  isReviewed?: boolean;
}

/**
 * ImageCorrectionPanel — R, G, B, Hue, Contrast controls.
 *
 * Matches the wireframe exactly: three slider groups side-by-side.
 * Changes are stored in imageCorrectionStore and included in the JSON script.
 *
 * ELECTRON IPC / OpenCV HOOK POINT:
 * When any value changes, send to Python backend:
 *   window.electronAPI.imageProcessing.applyCorrection(values)
 * OpenCV applies the correction and returns the processed image buffer.
 */
export const ImageCorrectionPanel: React.FC<ImageCorrectionPanelProps> = ({
  onChannelChange,
  onNoCorrectionRequired,
  isReviewed = false,
}) => {
  const { values, setChannel, reset } = useImageCorrectionStore();

  // Called every animation frame during drag — updates the store so the image
  // preview stays responsive. Does NOT fire the log/config callback.
  const handlePreview = (key: keyof ImageCorrectionValues, next: number) => {
    setChannel(key, next);
  };

  // Called once on pointer-up with (newValue, preDragValue).
  // prevValue is captured by CorrectionSlider at the moment the pointer goes
  // down — before any preview updates change the store — so the before/after
  // pair is always accurate.
  const handleCommit = (key: keyof ImageCorrectionValues, next: number, prev: number) => {
    if (prev !== next) onChannelChange?.(key, prev, next);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {/* Header row */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-700">Image Correction</h3>
          {isReviewed && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              'bg-success-50 text-success-700 border border-success-200',
            )}>
              <CheckCircle2 className="w-2.5 h-2.5" />
              Reviewed
            </span>
          )}
        </div>
        <Button
          size="xs"
          variant="ghost"
          icon={<RotateCcw className="w-3 h-3" />}
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      {/*
       * Three columns: RGB | Hue | Contrast
       * Matches wireframe layout exactly.
       */}
      <div className="grid grid-cols-3 gap-x-4">
        {/* RGB */}
        <div className="space-y-1.5">
          <p className="text-2xs font-bold text-neutral-400 uppercase tracking-wide">RGB</p>
          <CorrectionSlider
            label="R"
            value={values.red}
            color="red"
            onChange={(v) => handlePreview('red', v)}
            onCommit={(v, prev) => handleCommit('red', v, prev)}
          />
          <CorrectionSlider
            label="G"
            value={values.green}
            color="green"
            onChange={(v) => handlePreview('green', v)}
            onCommit={(v, prev) => handleCommit('green', v, prev)}
          />
          <CorrectionSlider
            label="B"
            value={values.blue}
            color="blue"
            onChange={(v) => handlePreview('blue', v)}
            onCommit={(v, prev) => handleCommit('blue', v, prev)}
          />
        </div>

        {/* Hue */}
        <div className="space-y-1.5">
          <p className="text-2xs font-bold text-neutral-400 uppercase tracking-wide">Hue</p>
          <CorrectionSlider
            label="H"
            value={values.hue}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => handlePreview('hue', v)}
            onCommit={(v, prev) => handleCommit('hue', v, prev)}
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <p className="text-2xs font-bold text-neutral-400 uppercase tracking-wide">Contrast</p>
          <CorrectionSlider
            label="C"
            value={values.contrast}
            onChange={(v) => handlePreview('contrast', v)}
            onCommit={(v, prev) => handleCommit('contrast', v, prev)}
          />
        </div>
      </div>

      {/* No correction button — shown when a measurement is pending review */}
      {onNoCorrectionRequired && !isReviewed && (
        <button
          onClick={onNoCorrectionRequired}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-2xs font-medium transition-colors',
            'border border-dashed border-neutral-300 text-neutral-500',
            'hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50',
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          No Image Correction Required
        </button>
      )}
    </div>
  );
};
