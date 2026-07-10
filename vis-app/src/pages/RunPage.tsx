/**
 * RunPage — Inspection Execution Engine
 *
 * Workflow:
 *   1. On mount, load the active deployment from DeploymentService.
 *   2. If no deployment → show "No configuration deployed" warning, disable Start Capture.
 *   3. If deployment loaded → show recipe info, enable Start Capture.
 *   4. Start Capture → open camera (getUserMedia) + start inspection loop.
 *   5. Every cycle: evaluate all recipe measurements → PASS / FAIL.
 *   6. Results appended to CSV buffer.
 *   7. Stop Capture → camera closes, Save CSV becomes available.
 *
 * OpenCV integration point:
 *   In the inspection loop, replace `simulateMeasurement(record)` with:
 *     const measured = await openCVMeasure(videoFrame, record.measurementGeometry)
 *
 * Electron IPC hook point (M3):
 *   Replace navigator.mediaDevices.getUserMedia with:
 *     window.electronAPI.camera.start(deviceId)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Square, Download, Camera, VideoOff,
  AlertTriangle, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { TopNavigation } from '@/components/shared/TopNavigation';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/utils';
import { DeploymentService } from '@/services/deployment/DeploymentService';
import type { ActiveDeployment } from '@/services/deployment/DeploymentService';
import { useInspectionStore } from '@/stores/inspectionStore';
import { useToast } from '@/hooks/useToast';
import type { InspectionResult, MeasurementRecord } from '@/types';

// ── Inspection cycle logic ─────────────────────────────────────────────────────

/**
 * Run one inspection cycle against the deployed recipe.
 *
 * This function is recipe-driven: it iterates over every MeasurementRecord in
 * the deployed recipe and evaluates each one independently.  No parameter
 * names, tool types, or measurement strategies are hardcoded here.
 *
 * Adding a new tool in Configure automatically adds a new row to the CSV and
 * a new entry in the live sidebar without any code change in this file.
 *
 * OpenCV hook — replace the simulation line with:
 *   const measuredValue = openCVMeasure(currentFrame, record.measurementGeometry);
 */
function runInspectionCycle(
  measurements:    MeasurementRecord[],
  imageNo:         number,
  inspectionId:    string,
  recipeVersion:   string,
): Omit<InspectionResult, 'id'> {
  const t0 = performance.now();

  const measuredValues = measurements.map((record) => {
    const spec = record.engineeringSpecification;

    // ── OpenCV integration point ──────────────────────────────────────────────
    // Replace this line with the real vision measurement:
    //   const measuredValue = openCVMeasure(currentFrame, record.measurementGeometry);
    //
    // Until OpenCV is integrated: the reference value from Configure is used
    // so the evaluation pipeline (PASS/FAIL, CSV, sidebar) can be fully tested.
    const measuredValue = record.measuredValue;

    // ── PASS / FAIL ───────────────────────────────────────────────────────────
    // minimumAcceptable ≤ measuredValue ≤ maximumAcceptable → PASS
    const pass =
      measuredValue >= spec.minimumAcceptable &&
      measuredValue <= spec.maximumAcceptable;

    return {
      parameter:         record.tool,              // comes from recipe, never hardcoded
      idealValue:        spec.idealValue,
      tolerance:         spec.tolerance,
      minimumAcceptable: spec.minimumAcceptable,
      maximumAcceptable: spec.maximumAcceptable,
      measuredValue,
      result:            pass ? 'pass' as const : 'fail' as const,
      units:             spec.units,
    };
  });

  const passedMeasurements = measuredValues.filter((v) => v.result === 'pass').length;
  const failedMeasurements = measuredValues.filter((v) => v.result === 'fail').length;
  const failures           = measuredValues.filter((v) => v.result === 'fail').map((v) => v.parameter);

  return {
    inspectionId,
    recipeVersion,
    imageNo,
    timestamp:          new Date().toISOString(),
    status:             failures.length === 0 ? 'pass' : 'fail',
    processingTimeMs:   Math.round(performance.now() - t0),
    totalMeasurements:  measurements.length,
    passedMeasurements,
    failedMeasurements,
    measuredValues,
    failures,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export const RunPage: React.FC = () => {
  // ── Deployment ────────────────────────────────────────────────────────────
  const [deployment, setDeployment] = useState<ActiveDeployment | null>(null);

  useEffect(() => {
    setDeployment(DeploymentService.load());
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [videoReady,   setVideoReady]   = useState(false);
  const [cameraError,  setCameraError]  = useState<string | null>(null);
  const [isCapturing,  setIsCapturing]  = useState(false);

  // ── Inspection ────────────────────────────────────────────────────────────
  const { results, currentResult, isRunning, currentInspectionId, csvRowCount, lastCsvExportAt,
          startInspection, stopInspection, addResult, nextImageNo, clearResults, exportCsv }
    = useInspectionStore();

  const inspectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { success, warning } = useToast();

  // ── Derived stats ─────────────────────────────────────────────────────────
  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const passRate  = results.length > 0
    ? ((passCount / results.length) * 100).toFixed(1)
    : '0.0';

  // ── Camera control ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch((e: unknown) =>
          console.warn('[RunPage] video.play() interrupted', e),
        );
        setVideoReady(true);
      }
    } catch (err: unknown) {
      const e = err as DOMException;
      const msg = e?.name ? `${e.name}: ${e.message}` : String(err);
      setCameraError(msg);
      console.error('[RunPage] getUserMedia failed', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setVideoReady(false);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Inspection loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || !deployment) return;

    inspectionTimerRef.current = setInterval(() => {
      const imageNo = nextImageNo();
      const result  = runInspectionCycle(
        deployment.measurements,
        imageNo,
        currentInspectionId,
        deployment.version,
      );
      addResult(result);
    }, 1500); // 1.5 s per cycle — replace with requestAnimationFrame when OpenCV arrives

    return () => {
      if (inspectionTimerRef.current) clearInterval(inspectionTimerRef.current);
    };
  }, [isRunning, deployment, addResult, nextImageNo, currentInspectionId]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartCapture = useCallback(async () => {
    clearResults();
    await startCamera();
    startInspection(); // generates a new inspectionId for this session
    setIsCapturing(true);
  }, [startCamera, startInspection, clearResults]);

  const handleStopCapture = useCallback(() => {
    stopCamera();
    stopInspection(); // auto-exports CSV internally
    setIsCapturing(false);
    if (csvRowCount > 0) {
      success('Inspection stopped', `${csvRowCount.toLocaleString()} rows buffered. Click Save CSV to download.`);
    } else {
      warning('Inspection stopped', 'No results buffered.');
    }
  }, [stopCamera, stopInspection, csvRowCount, success, warning]);

  const handleExportCsv = useCallback(() => {
    exportCsv();
    success('CSV saved', `${csvRowCount.toLocaleString()} rows exported.`);
  }, [exportCsv, csvRowCount, success]);

  // ── Render ────────────────────────────────────────────────────────────────
  const hasDeployment = deployment !== null;

  return (
    <div className="flex flex-col h-screen bg-workspace overflow-hidden">
      <TopNavigation />

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="h-10 bg-neutral-800 border-b border-neutral-900 flex items-center px-4 gap-4 shrink-0">
        <span className="text-xs font-semibold text-neutral-200 uppercase tracking-widest">
          Run — Live Inspection
        </span>
        <div className="h-4 w-px bg-neutral-600" />

        {/* Deployment status */}
        {hasDeployment ? (
          <span className="text-2xs text-success-400 font-mono uppercase tracking-wide">
            Recipe Active · v{deployment!.version}
          </span>
        ) : (
          <span className="text-2xs text-danger-400 font-mono uppercase tracking-wide">
            No Recipe Deployed
          </span>
        )}

        <div className="flex-1" />

        {/* Inspection running badge */}
        {isRunning && (
          <StatusBadge variant="live" pulse size="sm">RUNNING</StatusBadge>
        )}

        <div className="h-4 w-px bg-neutral-600" />

        {/* CSV counter */}
        <div className="flex items-center gap-1 text-xs text-neutral-400">
          <FileText className="w-3 h-3" />
          <span className="font-mono">{csvRowCount.toLocaleString()} rows</span>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── CENTER: Camera feed ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Camera canvas */}
          <div className="flex-1 relative bg-neutral-900 flex items-center justify-center min-h-0 overflow-hidden">

            {/* Video element — live during capture */}
            <video
              ref={videoRef}
              className={cn('max-w-full max-h-full object-contain', !videoReady && 'hidden')}
              muted
              playsInline
            />

            {/* Idle / no deployment state */}
            {!isCapturing && (
              <div className="flex flex-col items-center gap-4 text-neutral-400 p-8 text-center">
                {!hasDeployment ? (
                  <>
                    <AlertTriangle className="w-12 h-12 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-200 mb-1">
                        No inspection configuration deployed
                      </p>
                      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                        Please configure and deploy an inspection before entering Run mode.
                      </p>
                    </div>
                  </>
                ) : cameraError ? (
                  <>
                    <VideoOff className="w-12 h-12 text-danger-400 shrink-0" />
                    <p className="text-xs text-danger-400 font-mono max-w-xs">{cameraError}</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-600 flex items-center justify-center">
                      <Camera className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-xs text-neutral-500">
                      Click Start Capture to begin live inspection
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Waiting for camera */}
            {isCapturing && !videoReady && !cameraError && (
              <div className="flex flex-col items-center gap-2">
                <VideoOff className="w-8 h-8 text-neutral-500 animate-pulse" />
                <p className="text-xs text-neutral-500">Requesting camera…</p>
              </div>
            )}

            {/* PASS / FAIL overlay badge */}
            <AnimatePresence>
              {currentResult && isCapturing && (
                <motion.div
                  key={currentResult.id}
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none"
                >
                  <div className={cn(
                    'text-white text-2xl font-black px-8 py-3 rounded-xl shadow-xl border-2',
                    currentResult.status === 'pass'
                      ? 'bg-success-600 border-success-400'
                      : 'bg-danger-600 border-danger-400',
                  )}>
                    {currentResult.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Control row ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4 py-3 shrink-0 bg-neutral-800 border-t border-neutral-700">
            {!isCapturing ? (
              <Button
                variant="primary"
                size="xl"
                icon={<Activity className="w-5 h-5" />}
                onClick={handleStartCapture}
                disabled={!hasDeployment}
                className="min-w-44"
              >
                Start Capture
              </Button>
            ) : (
              <Button
                variant="danger"
                size="xl"
                icon={<Square className="w-5 h-5" />}
                onClick={handleStopCapture}
                className="min-w-44"
              >
                Stop Capturing
              </Button>
            )}
            <Button
              variant="secondary"
              size="xl"
              icon={<Download className="w-5 h-5" />}
              onClick={handleExportCsv}
              disabled={csvRowCount === 0}
            >
              Save CSV
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Inspection sidebar ──────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto">

            {/* ── No deployment ─────────────────────────────────────────── */}
            {!hasDeployment && (
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    No inspection configuration deployed. Go to Configure, build a recipe, and click Save &amp; Deploy.
                  </p>
                </div>
              </div>
            )}

            {/* ── Live inspection summary ────────────────────────────────── */}
            {results.length > 0 && (
              <div className="px-2 pb-2 space-y-1.5">
                <p className="px-1 pt-2 text-2xs font-bold text-neutral-500 uppercase tracking-widest">
                  Session Results
                </p>

                {/* Image-level PASS / FAIL counters */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded border border-success-200 bg-success-50 p-2 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success-600" />
                      <span className="text-2xs font-bold text-success-700 uppercase">Pass</span>
                    </div>
                    <span className="text-lg font-black text-success-700">{passCount}</span>
                  </div>
                  <div className="rounded border border-danger-200 bg-danger-50 p-2 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-danger-600" />
                      <span className="text-2xs font-bold text-danger-700 uppercase">Fail</span>
                    </div>
                    <span className="text-lg font-black text-danger-700">{failCount}</span>
                  </div>
                </div>

                {/* Pass rate bar */}
                <div className="rounded border border-neutral-200 bg-white p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xs font-semibold text-neutral-600">Pass Rate</span>
                    <span className="text-sm font-bold text-primary-600">{passRate}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${passRate}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Current image per-measurement summary */}
                {currentResult && (
                  <div className="rounded border border-neutral-200 bg-white p-2 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs font-semibold text-neutral-600">
                        Image #{currentResult.imageNo}
                      </span>
                      <span className={cn(
                        'text-2xs font-bold px-1.5 py-0.5 rounded uppercase',
                        currentResult.status === 'pass'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-danger-100 text-danger-700',
                      )}>
                        {currentResult.status}
                      </span>
                    </div>
                    <SidebarRow label="Total measurements"  value={String(currentResult.totalMeasurements)} />
                    <SidebarRow label="Passed"              value={String(currentResult.passedMeasurements)} color="success" />
                    <SidebarRow label="Failed"              value={String(currentResult.failedMeasurements)} color={currentResult.failedMeasurements > 0 ? 'danger' : undefined} />
                    <SidebarRow label="Processing"          value={`${currentResult.processingTimeMs} ms`} />
                    {currentResult.failures.length > 0 && (
                      <div className="pt-1 border-t border-neutral-100">
                        <p className="text-2xs text-danger-600 font-semibold">Failed:</p>
                        <p className="text-2xs font-mono text-danger-500">
                          {currentResult.failures.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── CSV status ────────────────────────────────────────────── */}
            <div className="px-2 pb-3 space-y-1.5">
              <p className="px-1 pt-2 text-2xs font-bold text-neutral-500 uppercase tracking-widest">
                CSV Buffer
              </p>
              <div className="rounded border border-neutral-200 bg-white p-2 space-y-1">
                <CsvRow label="Rows buffered" value={csvRowCount.toLocaleString()} />
                <CsvRow label="Last export" value={
                  lastCsvExportAt
                    ? new Date(lastCsvExportAt).toLocaleTimeString('en-GB', { hour12: false })
                    : '—'
                } />
                <CsvRow label="Max buffer"  value="100,000 rows" />
                <CsvRow label="Format"      value="inspection_results_*.csv" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SidebarRow: React.FC<{
  label:  string;
  value:  string;
  bold?:  boolean;
  color?: 'success' | 'danger';
}> = ({ label, value, bold, color }) => (
  <div className="flex items-center justify-between gap-1">
    <span className="text-2xs text-neutral-400 shrink-0">{label}</span>
    <span className={cn(
      'text-xs font-mono text-right leading-tight',
      bold   && 'font-bold',
      color === 'success' && 'text-success-700',
      color === 'danger'  && 'text-danger-700',
      !color && (bold ? 'text-primary-700' : 'text-neutral-700'),
    )}>
      {value}
    </span>
  </div>
);

const CsvRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-2xs">
    <span className="text-neutral-500">{label}</span>
    <span className="font-mono text-neutral-700">{value}</span>
  </div>
);
