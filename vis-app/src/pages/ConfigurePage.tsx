import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, AlertCircle } from 'lucide-react';
import { useConfigurationStore } from '@/stores/configurationStore';
import { useImageCorrectionStore } from '@/stores/imageCorrectionStore';
import { useToast } from '@/hooks/useToast';
import { uid } from '@/utils';

import { TopNavigation } from '@/components/shared/TopNavigation';
import { MeasurementSidebar } from '@/features/configure/MeasurementSidebar';
import { CameraWorkspace } from '@/features/configure/CameraWorkspace';
import { ActivityLog } from '@/features/configure/ActivityLog';
import { ImageCorrectionPanel } from '@/features/configure/ImageCorrectionPanel';
import { InspectionPanel } from '@/features/configure/InspectionPanel';
import type { InspectionToolDef } from '@/features/inspection/types';
import { Button } from '@/components/ui/Button';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

import { DeploymentService } from '@/services/deployment/DeploymentService';
import { Dialog } from '@/components/ui/Dialog';
import type {
  CameraStep,
  ActivityEntry,
  MeasurementRecord,
  ImageCorrectionValues,
} from '@/types';
import type { NPoint } from '@/features/configure/interaction/types';
import type { EngineeredValue } from '@/features/units/types';
import { useCalibrationStore } from '@/stores/calibrationStore';

export const ConfigurePage: React.FC = () => {
  const navigate = useNavigate();
  const { addMeasurement, measurements, buildPipeline, deploy } =
    useConfigurationStore();
  const { values: correctionValues } = useImageCorrectionStore();
  const isCalibrated = useCalibrationStore((s) => s.calibration.isCalibrated);
  const { success, error: toastError } = useToast();

  // ── Camera workflow state ─────────────────────────────────────────────────
  const [cameraStep,       setCameraStep]       = useState<CameraStep>('idle');
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  // ── Tool selection ────────────────────────────────────────────────────────
  const [selectedToolDef, setSelectedToolDef] = useState<InspectionToolDef | null>(null);

  // ── Measurement outcome ───────────────────────────────────────────────────
  // Set by CameraWorkspace when the engine reaches 'completed' phase.
  const [engineeredValue,  setEngineeredValue]  = useState<EngineeredValue | null>(null);
  const [pendingAbsPoints, setPendingAbsPoints] = useState<readonly NPoint[]>([]);
  // True after operator clicks "Confirm Measurement" — unlocks spec form.
  const [measurementConfirmed, setMeasurementConfirmed] = useState(false);

  // ── Activity log ─────────────────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  // ── Image correction review gate ──────────────────────────────────────────
  // Reset to false whenever a new image is confirmed.
  // Becomes true when the operator adjusts any slider OR clicks "No Correction".
  const [imageCorrectionReviewed, setImageCorrectionReviewed] = useState(false);
  const [showCorrectionModal,     setShowCorrectionModal]     = useState(false);

  // ── Deploy state ─────────────────────────────────────────────────────────
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError,  setDeployError]  = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const log = useCallback((message: string, detail?: string) => {
    setActivityLog((prev) => [
      ...prev,
      { id: uid(), timestamp: new Date().toISOString(), message, detail },
    ]);
  }, []);

  const resetMeasurementState = useCallback(() => {
    setEngineeredValue(null);
    setPendingAbsPoints([]);
    setMeasurementConfirmed(false);
  }, []);

  // ── Camera workflow handlers ──────────────────────────────────────────────
  const handleCameraOpened = useCallback(() => {
    setCameraStep('streaming');
    log('Camera started');
  }, [log]);

  const handleCaptureFrame = useCallback((imageUrl: string) => {
    setCapturedImageUrl(imageUrl);
    setCameraStep('frame-captured');
    log('Image captured');
  }, [log]);

  const handleConfirmImage = useCallback(() => {
    setCameraStep('confirmed');
    resetMeasurementState();
    setImageCorrectionReviewed(false);
    log('Image confirmed');
  }, [log, resetMeasurementState]);

  const handleRetake = useCallback(() => {
    setCameraStep('idle');
    setCapturedImageUrl(null);
    setSelectedToolDef(null);
    resetMeasurementState();
    log('Retake selected');
  }, [log, resetMeasurementState]);

  // ── Tool selection ────────────────────────────────────────────────────────
  const handleToolSelect = useCallback((toolDef: InspectionToolDef) => {
    console.debug('[Tool] selected:', toolDef.id, '  cameraStep:', cameraStep);
    setSelectedToolDef(toolDef);
    resetMeasurementState();
    log(`${toolDef.name} selected`);
  }, [log, resetMeasurementState, cameraStep]);

  // ── Measurement outcome callbacks (from CameraWorkspace) ─────────────────
  const handleMeasurementReady = useCallback(
    (ev: EngineeredValue | null, absPoints: readonly NPoint[]) => {
      setEngineeredValue(ev);
      setPendingAbsPoints(absPoints);
      setMeasurementConfirmed(false);
      if (ev !== null) {
        log(`Measured ${selectedToolDef?.name ?? 'unknown'}`, ev.displayValue);
      }
    },
    [log, selectedToolDef],
  );

  const handleConfirmMeasurement = useCallback(() => {
    if (engineeredValue === null) return;
    if (!imageCorrectionReviewed) {
      setShowCorrectionModal(true);
      return;
    }
    setMeasurementConfirmed(true);
    log('Measurement confirmed');
  }, [engineeredValue, imageCorrectionReviewed, log]);

  // ── No correction required ────────────────────────────────────────────────
  const handleNoCorrectionRequired = useCallback(() => {
    setImageCorrectionReviewed(true);
    log('No image correction required');
  }, [log]);

  // ── Image correction ──────────────────────────────────────────────────────
  const handleCorrectionChange = useCallback(
    (key: keyof ImageCorrectionValues, _prev: number, next: number) => {
      // Human-readable label: 'red' → 'R', 'green' → 'G', etc.
      const LABELS: Partial<Record<keyof ImageCorrectionValues, string>> = {
        red: 'R', green: 'G', blue: 'B', hue: 'Hue', contrast: 'Contrast',
        brightness: 'Brightness', saturation: 'Saturation', gamma: 'Gamma',
        threshold: 'Threshold',
      };
      const label = LABELS[key] ?? key;
      log(`${label} changed to ${next}`);
      setImageCorrectionReviewed(true);
    },
    [log],
  );

  // ── Save measurement ──────────────────────────────────────────────────────
  const handleSaveMeasurement = useCallback(
    ({ idealValue, tolerance }: { idealValue: number; tolerance: number }) => {
      if (!engineeredValue || !selectedToolDef) return;

      const rawValue = 'rawValue' in engineeredValue
        ? (engineeredValue as { rawValue: number }).rawValue
        : 0;
      const units    = selectedToolDef.unitLabel;
      const minAccept = idealValue - tolerance;
      const maxAccept = idealValue + tolerance;

      const record: MeasurementRecord = {
        id:   uid(),
        tool: selectedToolDef.name,
        measurementGeometry: pendingAbsPoints as Array<{ x: number; y: number }>,
        measuredValue: rawValue,
        displayValue:  engineeredValue.displayValue,
        engineeringSpecification: {
          idealValue,
          tolerance,
          units,
          minimumAcceptable: minAccept,
          maximumAcceptable: maxAccept,
        },
        imageCorrection: {
          r:        correctionValues.red      - 128,
          g:        correctionValues.green    - 128,
          b:        correctionValues.blue     - 128,
          hue:      correctionValues.hue,
          contrast: correctionValues.contrast - 128,
        },
      };

      addMeasurement(record);
      log('Ideal Value',   `${idealValue} ${units}`);
      log('Tolerance',     `±${tolerance} ${units}`);
      log('Units',         units);
      log('Measurement saved');
      log('Measurement appended to JSON');
      log('Configuration updated');

      setSelectedToolDef(null);
      resetMeasurementState();
    },
    [engineeredValue, selectedToolDef, pendingAbsPoints, correctionValues, addMeasurement, log, resetMeasurementState],
  );

  // ── Save & Deploy ─────────────────────────────────────────────────────────
  const handleDeploy = async () => {
    setDeployError(null);
    if (measurements.length === 0) {
      const msg = 'Save at least one measurement before deploying.';
      setDeployError(msg);
      toastError('Deploy failed', msg);
      return;
    }
    setIsDeploying(true);

    // Simulate brief async save (replace with Electron IPC in M3)
    await new Promise((r) => setTimeout(r, 800));

    // Persist the inspection recipe as the active deployment.
    // The Run page will load this via DeploymentService.load() — no manual
    // file selection required by the operator.
    DeploymentService.save({
      version:        `1.0.${Date.now()}`,
      deployedAt:     new Date().toISOString(),
      deploymentName: 'Inspection_Config_v1',
      measurements,
    });

    // Update configurationStore so OperationSelectionPage shows "Ready"
    buildPipeline();
    deploy();

    setIsDeploying(false);
    success('Configuration Deployed', `${measurements.length} measurement(s) active. Ready to run.`);
    navigate('/');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const correctionPreview = {
    red:      correctionValues.red,
    green:    correctionValues.green,
    blue:     correctionValues.blue,
    hue:      correctionValues.hue,
    contrast: correctionValues.contrast,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-workspace overflow-hidden">
      <TopNavigation />

      <Dialog
        open={showCorrectionModal}
        title="Image Correction Required"
        description="Before confirming a measurement, please review the Image Correction settings. Adjust any slider or click 'No Image Correction Required' in the panel below."
        actions={[
          {
            label: 'Go to Image Correction',
            variant: 'primary',
            onClick: () => setShowCorrectionModal(false),
          },
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => setShowCorrectionModal(false),
          },
        ]}
        onClose={() => setShowCorrectionModal(false)}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Measurement Parameters Menu */}
        <MeasurementSidebar
          selectedTool={selectedToolDef}
          onSelect={handleToolSelect}
        />

        {/* CENTER: Camera Workspace + Image Correction */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">

          <div className="flex-1 relative min-h-0">
            <CameraWorkspace
              step={cameraStep}
              capturedImageUrl={capturedImageUrl}
              selectedToolDef={selectedToolDef}
              correction={correctionPreview}
              measurementConfirmed={measurementConfirmed}
              isCalibrated={isCalibrated}
              className="h-full"
              onCameraOpened={handleCameraOpened}
              onCaptureFrame={handleCaptureFrame}
              onConfirmImage={handleConfirmImage}
              onConfirmMeasurement={handleConfirmMeasurement}
              onRetake={handleRetake}
              onMeasurementReady={handleMeasurementReady}
            />
            <LoadingOverlay
              visible={isDeploying}
              message="Saving configuration…"
              subMessage="Writing JSON inspection script"
            />
          </div>

          <div className="shrink-0 border-t border-border bg-white">
            <ImageCorrectionPanel
              onChannelChange={handleCorrectionChange}
              onNoCorrectionRequired={cameraStep === 'confirmed' ? handleNoCorrectionRequired : undefined}
              isReviewed={imageCorrectionReviewed}
            />
          </div>
        </div>

        {/* RIGHT: Activity log + Spec form + Deploy */}
        <div className="w-56 shrink-0 border-l border-border bg-surface flex flex-col overflow-hidden">

          <ActivityLog entries={activityLog} className="flex-1 overflow-hidden" />

          <div className="shrink-0 border-t border-border">
            <InspectionPanel
              toolDef={selectedToolDef}
              engineeredValue={measurementConfirmed ? engineeredValue : null}
              onSave={handleSaveMeasurement}
            />
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2.5 bg-neutral-50">
            {deployError && (
              <div className="flex items-start gap-1.5 text-danger-600 mb-2">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="text-2xs leading-snug">{deployError}</span>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Rocket className="w-3.5 h-3.5" />}
              loading={isDeploying}
              onClick={handleDeploy}
              className="w-full"
            >
              Save &amp; Deploy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
