import { create } from 'zustand';
import type { ImageCorrectionValues } from '@/types';

interface ImageCorrectionStore {
  values: ImageCorrectionValues;
  setChannel: (key: keyof ImageCorrectionValues, value: number) => void;
  reset: () => void;
}

const defaults: ImageCorrectionValues = {
  red: 128,
  green: 128,
  blue: 128,
  hue: 0,
  contrast: 128,
  brightness: 128,
  saturation: 128,
  gamma: 100,
  threshold: 128,
};

export const useImageCorrectionStore = create<ImageCorrectionStore>((set) => ({
  values: { ...defaults },

  setChannel: (key, value) =>
    set((s) => ({
      values: { ...s.values, [key]: value },
    })),

  reset: () => set({ values: { ...defaults } }),
}));

/**
 * ELECTRON IPC / OpenCV HOOK POINT:
 * When sliders change, send correction params to Python backend:
 *   window.electronAPI.imageProcessing.applyCorrection(values)
 *
 * The backend (OpenCV) will apply the correction to the camera frame
 * and return the processed image buffer back over IPC.
 */
