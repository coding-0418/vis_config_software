import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Calibration } from '@/features/units/types';

interface CalibrationStoreState {
  calibration: Calibration;
  setCalibration: (cal: Partial<Calibration>) => void;
  /** Apply a measured pixel distance = known real-world mm distance to compute pxPerMm. */
  calibrateFromDistance: (pixelDistance: number, realWorldMm: number) => void;
  /**
   * Apply a temporary engineering calibration for a test image upload session.
   *
   * This allows the full measurement pipeline to run in engineering units (mm, mm², rad)
   * without requiring a real camera calibration procedure. The temporary calibration is
   * cleared when the test image is removed — it never persists between sessions.
   *
   * @param pxPerMm Scale factor. Default 10 means 1 pixel = 0.10 mm.
   */
  setTemporaryCalibration: (pxPerMm?: number) => void;
  /**
   * Clear the temporary calibration set by setTemporaryCalibration.
   * Has no effect if the current calibration is a real (non-temporary) one.
   */
  clearTemporaryCalibration: () => void;
  reset: () => void;
}

/** Default scale used for test image uploads: 10 px/mm → 1 px = 0.10 mm. */
export const DEFAULT_TEST_PX_PER_MM = 10;

// TODO (Calibration module): Restore isCalibrated: false here once the
// calibration workflow (Calibrate → Save → Load → Configure → Run) is
// implemented. For the MVP, all sessions start as calibrated using the
// default scale (DEFAULT_TEST_PX_PER_MM) so that measurements work without
// a real calibration procedure.
const UNCALIBRATED: Calibration = {
  pxPerMm: DEFAULT_TEST_PX_PER_MM,
  isCalibrated: true,
  isTemporary: false,
  source: 'MVP default (1 px = 0.10 mm)',
};

export const useCalibrationStore = create<CalibrationStoreState>()(
  persist(
    (set, get) => ({
      calibration: UNCALIBRATED,

      setCalibration: (cal) =>
        set((state) => ({
          calibration: { ...state.calibration, ...cal },
        })),

      calibrateFromDistance: (pixelDistance, realWorldMm) => {
        if (pixelDistance <= 0 || realWorldMm <= 0) return;
        const pxPerMm = pixelDistance / realWorldMm;
        set({
          calibration: {
            pxPerMm,
            isCalibrated: true,
            isTemporary: false,
            source: `Manual: ${pixelDistance.toFixed(1)} px = ${realWorldMm.toFixed(3)} mm`,
          },
        });
      },

      setTemporaryCalibration: (pxPerMm = DEFAULT_TEST_PX_PER_MM) => {
        set({
          calibration: {
            pxPerMm,
            isCalibrated: true,
            isTemporary: true,
            source: `Test image (1 px = ${(1 / pxPerMm).toFixed(3)} mm)`,
          },
        });
      },

      clearTemporaryCalibration: () => {
        if (get().calibration.isTemporary) {
          set({ calibration: UNCALIBRATED });
        }
      },

      reset: () => set({ calibration: UNCALIBRATED }),
    }),
    {
      name: 'vis-calibration',
      // Never persist a temporary calibration across page reloads.
      partialize: (state) =>
        state.calibration.isTemporary ? { calibration: UNCALIBRATED } : state,
    },
  ),
);
