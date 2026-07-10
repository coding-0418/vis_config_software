import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '@/utils';
import { useImageCorrectionStore } from '@/stores/imageCorrectionStore';
import type {
  MeasurementCategory,
  SelectedParameter,
  ToleranceRow,
  ConfigurationPayload,
  InspectionPipeline,
  PipelineStep,
  MeasurementRecord,
} from '@/types';

interface ConfigurationStore {
  selectedCategory: MeasurementCategory | null;
  selectedParameters: SelectedParameter[];
  toleranceRows: ToleranceRow[];
  // Saved measurement records — each entry is one completed measure+spec cycle
  measurements: MeasurementRecord[];
  isDeployed: boolean;
  lastDeployedAt: string | null;
  deploymentName: string;

  setSelectedCategory: (cat: MeasurementCategory | null) => void;
  addParameter: (param: Omit<SelectedParameter, 'id'>) => string;
  updateParameter: (id: string, updates: Partial<SelectedParameter>) => void;
  confirmParameter: (id: string) => void;
  removeParameter: (id: string) => void;

  addMeasurement: (record: MeasurementRecord) => void;
  removeMeasurement: (id: string) => void;

  addToleranceRow: () => void;
  updateToleranceRow: (id: string, updates: Partial<ToleranceRow>) => void;
  removeToleranceRow: (id: string) => void;

  setDeploymentName: (name: string) => void;
  deploy: () => ConfigurationPayload;
  buildPipeline: () => InspectionPipeline;
  reset: () => void;
}

const defaultTolerance = (): ToleranceRow => ({
  id: uid(),
  parameter: 'New Parameter',
  idealValue: 0,
  tolerance: 0.1,
  units: 'mm',
  status: 'pending',
});

export const useConfigurationStore = create<ConfigurationStore>()(
  persist(
    (set, get) => ({
      selectedCategory: null,
      selectedParameters: [],
      measurements: [],
      toleranceRows: [
        { id: uid(), parameter: 'Length', idealValue: 12, tolerance: 0.1, units: 'mm', status: 'pending' },
        { id: uid(), parameter: 'Width',  idealValue: 20, tolerance: 0.1, units: 'mm', status: 'pending' },
        { id: uid(), parameter: 'Height', idealValue: 8,  tolerance: 0.05, units: 'mm', status: 'pending' },
      ],
      isDeployed: false,
      lastDeployedAt: null,
      deploymentName: 'Inspection_Config_v1',

      setSelectedCategory: (cat) => set({ selectedCategory: cat }),

      addParameter: (param) => {
        const id = uid();
        set((s) => ({ selectedParameters: [...s.selectedParameters, { ...param, id }] }));
        return id;
      },

      updateParameter: (id, updates) =>
        set((s) => ({
          selectedParameters: s.selectedParameters.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      confirmParameter: (id) =>
        set((s) => ({
          selectedParameters: s.selectedParameters.map((p) =>
            p.id === id
              ? { ...p, confirmed: true, confirmationTimestamp: new Date().toISOString() }
              : p,
          ),
        })),

      removeParameter: (id) =>
        set((s) => ({
          selectedParameters: s.selectedParameters.filter((p) => p.id !== id),
        })),

      addMeasurement: (record) =>
        set((s) => ({ measurements: [...s.measurements, record] })),

      removeMeasurement: (id) =>
        set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),

      addToleranceRow: () =>
        set((s) => ({ toleranceRows: [...s.toleranceRows, defaultTolerance()] })),

      updateToleranceRow: (id, updates) =>
        set((s) => ({
          toleranceRows: s.toleranceRows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      removeToleranceRow: (id) =>
        set((s) => ({ toleranceRows: s.toleranceRows.filter((r) => r.id !== id) })),

      setDeploymentName: (name) => set({ deploymentName: name }),

      deploy: () => {
        const s = get();
        const imageCorrection = useImageCorrectionStore.getState().values;
        // TODO: Write JSON config to disk via Electron IPC:
        //   window.electronAPI.config.save(payload)
        const payload: ConfigurationPayload = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          operator: 'current-user',
          measurements: s.selectedParameters,
          tolerances: s.toleranceRows,
          imageCorrection,
        };
        set({ isDeployed: true, lastDeployedAt: new Date().toISOString() });
        return payload;
      },

      buildPipeline: () => {
        const s = get();
        const imageCorrection = useImageCorrectionStore.getState().values;

        // Build the ordered pipeline steps.
        // Each step maps to a Python/OpenCV operation in the Run backend.
        const steps: PipelineStep[] = [{ step: 'Capture' }];

        // Image correction steps — only emit when non-neutral
        if (imageCorrection.brightness !== 128) steps.push({ step: 'Brightness', params: { value: imageCorrection.brightness } });
        if (imageCorrection.contrast   !== 128) steps.push({ step: 'Contrast',   params: { value: imageCorrection.contrast   } });
        if (imageCorrection.saturation !== 128) steps.push({ step: 'Saturation', params: { value: imageCorrection.saturation } });
        if (imageCorrection.gamma      !== 100) steps.push({ step: 'Gamma',      params: { value: imageCorrection.gamma      } });
        if (imageCorrection.threshold  !== 128) steps.push({ step: 'Threshold',  params: { value: imageCorrection.threshold  } });

        // One measurement step per saved record.
        // The Run window uses engineeringSpecification.minimumAcceptable /
        // maximumAcceptable to evaluate PASS / FAIL against each live measurement.
        for (const m of s.measurements) {
          const stepType = `Measure${m.tool.replace(/\s+/g, '')}` as PipelineStep['step'];
          steps.push({
            step: stepType,
            params: {
              measurementGeometry:      m.measurementGeometry,
              engineeringSpecification: m.engineeringSpecification,
              imageCorrection:          m.imageCorrection,
            },
          });
        }

        const pipeline: InspectionPipeline = {
          version: '1.0.0',
          name: s.deploymentName,
          createdAt: new Date().toISOString(),
          operator: 'current-user',
          pipeline: steps,
          tolerances: s.toleranceRows,
          imageCorrection,
        };
        return pipeline;
      },

      reset: () =>
        set({
          selectedCategory: null,
          selectedParameters: [],
          measurements: [],
          isDeployed: false,
          lastDeployedAt: null,
        }),
    }),
    { name: 'mvs-configuration' },
  ),
);
