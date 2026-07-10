import React, { useRef, useEffect, useState, useCallback, useId } from 'react';
import { Camera, VideoOff, AlertCircle, RefreshCw, Upload, X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';
import type { CameraStep } from '@/types';
import type { NPoint } from './interaction/types';
import { useInteractionEngine } from './interaction/useInteractionEngine';
import { SelectionOverlay } from './SelectionOverlay';
import { useCalibrationStore, DEFAULT_TEST_PX_PER_MM } from '@/stores/calibrationStore';
import type { InspectionToolDef } from '@/features/inspection/types';

// ── Development flag ──────────────────────────────────────────────────────────
// true in `vite dev`, false in `vite build`.
// Also enabled by VITE_TEST_IMAGE_UPLOAD=true for explicit staging/QA overrides.
const TEST_IMAGE_ENABLED =
  import.meta.env.DEV ||
  import.meta.env.VITE_TEST_IMAGE_UPLOAD === 'true';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'];
const ACCEPTED_EXT  = '.jpg,.jpeg,.png,.bmp,.tiff,.tif';
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CorrectionPreview {
  red: number;      // 0–255, neutral 128
  green: number;
  blue: number;
  hue: number;      // –180 to 180
  contrast: number; // 0–255, neutral 128
}

/** Tracks how the current image entered the workspace. */
type ImageSourceKind = 'camera' | 'test-image';

interface CameraWorkspaceProps {
  step: CameraStep;
  capturedImageUrl: string | null;
  /** Active inspection tool definition. Null when no tool selected. */
  selectedToolDef: InspectionToolDef | null;
  correction: CorrectionPreview;
  className?: string;

  // ── Camera lifecycle ──────────────────────────────────────────────────────
  onCameraOpened: () => void;
  /** Called with a JPEG data URL, regardless of whether it came from the camera
   *  or an uploaded test image. Downstream logic is identical for both. */
  onCaptureFrame: (imageUrl: string) => void;
  onConfirmImage: () => void;
  onRetake: () => void;

  // ── Measurement outcome ───────────────────────────────────────────────────
  onMeasurementReady: (
    engineeredValue: import('@/features/units/types').EngineeredValue | null,
    absPoints: readonly NPoint[],
  ) => void;
  onConfirmMeasurement: () => void;
  measurementConfirmed: boolean;
  /** True when a valid camera calibration is loaded. Measurement tools are
   *  disabled and a calibration warning is shown when false. */
  isCalibrated: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CameraWorkspace
 *
 * Camera lifecycle + test-image upload + interaction engine.
 *
 * Image source abstraction:
 *   Live camera  → getUserMedia → captureFrame() → data URL → onCaptureFrame()
 *   Test image   → FileReader   → data URL        → onCaptureFrame()
 *
 * Both paths produce identical data URLs and trigger the same workflow.
 * The measurement engine never knows which source was used.
 *
 * Test image upload is gated behind TEST_IMAGE_ENABLED (Vite DEV flag).
 * In production builds the upload button is completely absent from the DOM.
 *
 * ELECTRON IPC HOOK (M3):
 *   Replace navigator.mediaDevices.getUserMedia with:
 *     window.electronAPI.camera.start(deviceId)
 *     window.electronAPI.camera.onFrame((buffer) => { ... })
 */
export const CameraWorkspace: React.FC<CameraWorkspaceProps> = ({
  step,
  capturedImageUrl,
  selectedToolDef,
  correction,
  className,
  onCameraOpened,
  onCaptureFrame,
  onConfirmImage,
  onRetake,
  onMeasurementReady,
  onConfirmMeasurement,
  measurementConfirmed,
  isCalibrated,
}) => {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError,    setCameraError]    = useState<string | null>(null);
  const [videoReady,     setVideoReady]     = useState(false);
  const [isDragging,     setIsDragging]     = useState(false);
  const [containerSize,  setContainerSize]  = useState({ w: 0, h: 0 });
  /** Tracks whether the active image came from the live camera or an upload. */
  const [imageSource,    setImageSource]    = useState<ImageSourceKind>('camera');
  const [uploadError,    setUploadError]    = useState<string | null>(null);

  // Calibration store — used to inject/clear temporary engineering calibration
  // for test image sessions so the measurement engine always works in mm.
  const setTemporaryCalibration  = useCalibrationStore((s) => s.setTemporaryCalibration);
  const clearTemporaryCalibration = useCalibrationStore((s) => s.clearTemporaryCalibration);

  const svgFilterId = useId().replace(/:/g, '');

  // ── Interaction engine ────────────────────────────────────────────────────
  const engine = useInteractionEngine(imageAreaRef);

  useEffect(() => {
    if (!selectedToolDef) { engine.deactivate(); return; }
    const ok = engine.activateTool(selectedToolDef.interactionToolId);
    if (!ok) console.warn('[CameraWorkspace] no interaction tool for:', selectedToolDef.interactionToolId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToolDef?.id]);

  useEffect(() => {
    if (step !== 'confirmed') engine.deactivate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const prevPhaseRef = useRef(engine.phase);
  useEffect(() => {
    if (prevPhaseRef.current !== 'completed' && engine.phase === 'completed') {
      onMeasurementReady(engine.engineeredValue, engine.result?.absPoints ?? []);
    }
    prevPhaseRef.current = engine.phase;
  });

  useEffect(() => {
    const el = imageAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Coordinate helper ─────────────────────────────────────────────────────
  const getPoint = useCallback((clientX: number, clientY: number) => {
    const rect = imageAreaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const absX = clientX - rect.left;
    const absY = clientY - rect.top;
    return { normX: absX / rect.width, normY: absY / rect.height, absX, absY };
  }, []);

  // ── Global drag listeners ─────────────────────────────────────────────────
  const engineMoveRef = useRef(engine.onMouseMove);
  const engineUpRef   = useRef(engine.onMouseUp);
  useEffect(() => { engineMoveRef.current = engine.onMouseMove; }, [engine.onMouseMove]);
  useEffect(() => { engineUpRef.current   = engine.onMouseUp;   }, [engine.onMouseUp]);

  useEffect(() => {
    if (!isDragging) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = 'crosshair';

    const onMove = (e: MouseEvent) => {
      const pt = getPoint(e.clientX, e.clientY);
      if (!pt) return;
      engineMoveRef.current({ normX: pt.normX, normY: pt.normY, absX: pt.absX, absY: pt.absY, button: 0, shiftKey: e.shiftKey });
    };
    const onUp = (e: MouseEvent) => {
      const pt = getPoint(e.clientX, e.clientY);
      setIsDragging(false);
      document.body.style.cursor = prev;
      if (pt) engineUpRef.current({ normX: pt.normX, normY: pt.normY, absX: pt.absX, absY: pt.absY, button: e.button, shiftKey: e.shiftKey });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      document.body.style.cursor = prev;
    };
  }, [isDragging, getPoint]);

  // ── Canvas mouse handlers ─────────────────────────────────────────────────
  // TODO (Calibration module): Re-add `&& isCalibrated` once the calibration
  // workflow is implemented. For the MVP, calibration is always assumed valid.
  const canInteract = step === 'confirmed' && !!selectedToolDef && !measurementConfirmed;

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract || e.button !== 0) return;
    e.preventDefault();
    const pt = getPoint(e.clientX, e.clientY);
    if (!pt) return;
    setIsDragging(true);
    engine.onMouseDown({ normX: pt.normX, normY: pt.normY, absX: pt.absX, absY: pt.absY, button: 0, shiftKey: e.shiftKey });
  }, [canInteract, getPoint, engine]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedToolDef || isDragging) return;
    const pt = getPoint(e.clientX, e.clientY);
    if (!pt) return;
    engine.onMouseMove({ normX: pt.normX, normY: pt.normY, absX: pt.absX, absY: pt.absY, button: 0, shiftKey: e.shiftKey });
  }, [selectedToolDef, isDragging, getPoint, engine]);

  const handleDblClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    const pt = getPoint(e.clientX, e.clientY);
    if (!pt) return;
    engine.onDblClick({ normX: pt.normX, normY: pt.normY, absX: pt.absX, absY: pt.absY, button: 0, shiftKey: e.shiftKey });
  }, [canInteract, getPoint, engine]);

  useEffect(() => {
    if (!selectedToolDef) return;
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', 'Backspace'].includes(e.key)) engine.onKeyDown(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedToolDef, engine]);

  // ── Camera controls ───────────────────────────────────────────────────────
  const startStream = useCallback(async () => {
    setCameraError(null);
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch((err: unknown) => {
          console.warn('[CameraWorkspace] video.play() interrupted:', err);
        });
        setVideoReady(true);
      }
      setImageSource('camera');
      onCameraOpened();
    } catch (err: unknown) {
      const domErr = err as DOMException;
      const msg = domErr?.name && domErr?.message
        ? `${domErr.name}: ${domErr.message}`
        : String(err);
      console.error('[CameraWorkspace] getUserMedia failed:', err);
      setCameraError(msg);
    }
  }, [onCameraOpened]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setVideoReady(false);
  }, []);

  const handleCaptureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    stopStream();
    onCaptureFrame(url);
  }, [videoReady, stopStream, onCaptureFrame]);

  useEffect(() => () => { stopStream(); }, [stopStream]);

  // ── Test image upload (DEV ONLY) ──────────────────────────────────────────
  const handleUploadClick = useCallback(() => {
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected immediately
    e.target.value = '';

    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type || 'unknown'}. Use JPG, PNG, BMP or TIFF.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      // Apply a temporary engineering calibration BEFORE the image enters the
      // workflow. This ensures the measurement engine immediately has a valid
      // pxPerMm and displays all values in mm/mm²/rad — never in pixels.
      //
      // DEFAULT_TEST_PX_PER_MM = 10 → 1 px = 0.10 mm.
      // The calibration is flagged isTemporary=true and cleared when the
      // test image is removed. It never persists to the next camera session.
      setTemporaryCalibration(DEFAULT_TEST_PX_PER_MM);

      setImageSource('test-image');
      setUploadError(null);

      // Feed the data URL into the same path as a live camera capture.
      // ConfigurePage sets step → 'frame-captured' and capturedImageUrl → dataUrl.
      // Everything downstream (Confirm Image → select tool → measure → save) is
      // identical to a real camera session.
      onCaptureFrame(dataUrl);
      console.debug(
        '[CameraWorkspace] test image loaded:', file.name,
        `(${(file.size / 1024).toFixed(0)} KB)`,
        `temporary calibration: 1 px = ${(1 / DEFAULT_TEST_PX_PER_MM).toFixed(3)} mm`,
      );
    };
    reader.onerror = () => setUploadError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  }, [onCaptureFrame, setTemporaryCalibration]);

  const handleRetakeOrRemove = useCallback(() => {
    // Clear the temporary calibration if this was a test image session.
    // Real camera calibrations are unaffected (clearTemporaryCalibration is a no-op for them).
    clearTemporaryCalibration();
    setImageSource('camera');
    setUploadError(null);
    onRetake();
  }, [onRetake, clearTemporaryCalibration]);

  // ── Derived values ────────────────────────────────────────────────────────
  const isTestImage     = imageSource === 'test-image';
  const measurementReady = engine.phase === 'completed' && !measurementConfirmed;

  const topButtons = (() => {
    if (step === 'idle') return 'idle';
    if (step === 'streaming') return 'streaming';
    return 'retake';
  })();

  const bottomButton = (() => {
    if (step === 'frame-captured') return { label: 'Confirm Image',       variant: 'primary'   as const, onClick: onConfirmImage,       disabled: false };
    if (measurementReady)          return { label: 'Confirm Measurement', variant: 'primary'   as const, onClick: onConfirmMeasurement, disabled: false };
    return                                { label: 'Confirm',             variant: 'secondary' as const, onClick: () => {},             disabled: true  };
  })();

  const cursorStyle: React.CSSProperties = {
    cursor: canInteract || isDragging
      ? (engine.getCursorAt({ x: 0, y: 0 }) || 'crosshair')
      : 'default',
  };

  const toolHint = (() => {
    // TODO (Calibration module): Restore calibration check here.
    if (!selectedToolDef)           return 'Select a tool from the left panel';
    const tn = selectedToolDef.name;
    if (measurementConfirmed)       return `${tn} confirmed — enter spec below`;
    if (measurementReady)           return `${tn} — click Confirm Measurement`;
    if (isDragging)                 return `${tn} — release to complete`;
    if (engine.phase === 'drawing') return `${tn} — click to set next point`;
    return `${tn} — click or drag to measure`;
  })();

  const rBias = (correction.red   - 128) / 255;
  const gBias = (correction.green - 128) / 255;
  const bBias = (correction.blue  - 128) / 255;
  const contrastPct = ((correction.contrast / 128) * 100).toFixed(0);
  const imgStyle: React.CSSProperties = {
    filter: `url(#${svgFilterId}) contrast(${contrastPct}%) hue-rotate(${correction.hue}deg)`,
    userSelect: 'none',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>

      {/* SVG colour-matrix filter — zero visual footprint */}
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id={svgFilterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={[
                `1 0 0 0 ${rBias.toFixed(4)}`,
                `0 1 0 0 ${gBias.toFixed(4)}`,
                `0 0 1 0 ${bBias.toFixed(4)}`,
                `0 0 0 1 0`,
              ].join(' ')}
            />
          </filter>
        </defs>
      </svg>

      {/* Hidden file input — dev only */}
      {TEST_IMAGE_ENABLED && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={handleFileSelected}
        />
      )}

      {/* ── TOP: Camera / upload controls ────────────────────────────── */}
      <div className="flex flex-col gap-1.5 px-3 py-2 shrink-0 bg-neutral-50 border-b border-border">
        <div className="flex items-center gap-2">

          {/* Primary camera action */}
          {topButtons === 'idle' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Camera className="w-3.5 h-3.5" />}
              onClick={startStream}
            >
              Start Camera
            </Button>
          )}
          {topButtons === 'streaming' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Camera className="w-3.5 h-3.5" />}
              onClick={handleCaptureFrame}
              disabled={!videoReady}
            >
              Capture Frame
            </Button>
          )}
          {topButtons === 'retake' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleRetakeOrRemove}
            >
              {isTestImage ? 'Remove Test Image' : 'Retake'}
            </Button>
          )}

          {/* Tool hint — only on confirmed step */}
          {step === 'confirmed' && (
            <span className="text-xs text-neutral-500 truncate flex-1 min-w-0">{toolHint}</span>
          )}
        </div>

        {/* Upload test image — development only, never in production */}
        {TEST_IMAGE_ENABLED && topButtons === 'idle' && (
          <div className="flex flex-col gap-1">
            <button
              onClick={handleUploadClick}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-2xs font-medium transition-colors w-full',
                'border border-dashed border-amber-400 bg-amber-50 text-amber-700',
                'hover:bg-amber-100 hover:border-amber-500',
              )}
            >
              <Upload className="w-3 h-3 shrink-0" />
              Upload Test Image
              <span className="ml-auto text-amber-500 opacity-70 uppercase tracking-wide text-[10px]">Dev Only</span>
            </button>
            {uploadError && (
              <p className="text-[10px] text-danger-600 flex items-start gap-1">
                <X className="w-3 h-3 shrink-0 mt-px" />
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── CENTER: Camera / measurement canvas ──────────────────────── */}
      <div
        ref={imageAreaRef}
        className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden bg-neutral-900"
        style={cursorStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDblClick}
      >
        {/* Persistent video — hidden except during streaming */}
        <video
          ref={videoRef}
          className={cn('max-w-full max-h-full object-contain', step !== 'streaming' && 'hidden')}
          muted
          playsInline
        />

        {/* Idle / error state */}
        {step === 'idle' && (
          <div className="flex flex-col items-center gap-3 text-neutral-400 p-6">
            {cameraError ? (
              <>
                <AlertCircle className="w-10 h-10 text-danger-400 shrink-0" />
                <p className="text-xs text-danger-400 text-center max-w-xs leading-relaxed font-mono">
                  {cameraError}
                </p>
                <Button variant="outline" size="sm" onClick={startStream}>Retry</Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-600 flex items-center justify-center">
                  <Camera className="w-10 h-10 opacity-30" />
                </div>
                <p className="text-xs text-neutral-500">
                  Click Start Camera to begin
                  {TEST_IMAGE_ENABLED && (
                    <>, or upload a test image</>
                  )}
                </p>
              </>
            )}
          </div>
        )}

        {/* Streaming — waiting for device */}
        {step === 'streaming' && !videoReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <VideoOff className="w-8 h-8 text-neutral-500 animate-pulse" />
            <p className="text-xs text-neutral-500">Requesting camera…</p>
          </div>
        )}

        {/* Frozen / confirmed frame */}
        {(step === 'frame-captured' || step === 'confirmed') && capturedImageUrl && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedImageUrl}
              alt={isTestImage ? 'Test image' : 'Captured frame'}
              className="max-w-full max-h-full object-contain"
              style={imgStyle}
              draggable={false}
            />

            {/* Interaction engine overlay */}
            {/* TODO (Calibration module): Gate this on isCalibrated once the
                calibration workflow is implemented. */}
            {step === 'confirmed' && (
              <SelectionOverlay
                shapes={engine.overlayShapes}
                containerWidth={containerSize.w}
                containerHeight={containerSize.h}
              />
            )}

            {/* Measurement value badge */}
            {engine.engineeredValue !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary-700 text-white text-xs font-mono font-bold px-4 py-1.5 rounded-lg shadow-lg border border-primary-500 pointer-events-none">
                {engine.engineeredValue.displayValue}
              </div>
            )}

            {/* Static image mode badge — dev only.
                Shows the temporary scale so developers know what calibration is active. */}
            {TEST_IMAGE_ENABLED && isTestImage && (
              <div className="absolute top-2 right-2 pointer-events-none flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                  Static Image Mode
                </span>
                <span className="text-[9px] bg-neutral-900/70 text-amber-300 font-mono px-1.5 py-0.5 rounded">
                  1 px = {(1 / DEFAULT_TEST_PX_PER_MM).toFixed(3)} mm
                </span>
              </div>
            )}

            {/* Frame review prompt */}
            {step === 'frame-captured' && (
              <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 pointer-events-none">
                <div className="bg-neutral-900/75 text-white text-xs px-3 py-1.5 rounded">
                  {isTestImage
                    ? 'Test image loaded — click Confirm below to start measuring'
                    : 'Review the frame then click Confirm below'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM: Confirm ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center py-2.5 shrink-0 bg-neutral-50 border-t border-border">
        <Button
          variant={bottomButton.variant}
          size="sm"
          onClick={bottomButton.onClick}
          disabled={bottomButton.disabled}
        >
          {bottomButton.label}
        </Button>
      </div>
    </div>
  );
};

