/**
 * inspectionStore — runtime state for the Run window.
 *
 * Design principles:
 * - No hardcoded parameters.  Every result is produced by the Run engine
 *   iterating over the deployed inspection recipe.
 * - inspectionId is generated fresh at Start Capture and carried through
 *   every InspectionResult and every CSV row, so multi-session exports are
 *   fully traceable.
 * - csvRowCount reflects actual CSV rows (one per measurement per image),
 *   not the number of images inspected.
 */

import { create } from 'zustand';
import { uid, generateCsvContent, downloadFile } from '@/utils';
import type { InspectionResult, CsvRow } from '@/types';

const MAX_ROWS = 100_000;
const TRIM_TO  = 90_000;

interface InspectionStore {
  results:            InspectionResult[];
  currentResult:      InspectionResult | null;
  isRunning:          boolean;
  /** Unique identifier for the current continuous-capture session. */
  currentInspectionId: string;
  csvRowCount:        number;
  lastCsvExportAt:    string | null;
  imageCounter:       number;

  startInspection: () => string;   // returns the new inspectionId
  stopInspection:  () => void;
  nextImageNo:     () => number;
  addResult:       (result: Omit<InspectionResult, 'id'>) => void;
  setCurrentResult:(result: InspectionResult | null) => void;
  exportCsv:       () => void;
  clearResults:    () => void;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  results:             [],
  currentResult:       null,
  isRunning:           false,
  currentInspectionId: '',
  csvRowCount:         0,
  lastCsvExportAt:     null,
  imageCounter:        0,

  startInspection: () => {
    const id = uid();
    set({ isRunning: true, imageCounter: 0, currentInspectionId: id });
    return id;
  },

  stopInspection: () => {
    set({ isRunning: false });
    get().exportCsv();
  },

  nextImageNo: () => {
    let next = 0;
    set((s) => {
      next = s.imageCounter + 1;
      return { imageCounter: next };
    });
    return next;
  },

  addResult: (result) => {
    const newResult = { ...result, id: uid() };
    set((s) => {
      let results = [...s.results, newResult];
      if (results.length > MAX_ROWS) {
        results = results.slice(results.length - TRIM_TO);
      }
      // csvRowCount = total CSV rows = one per measurement per image
      const csvRowCount = results.reduce(
        (sum, r) => sum + r.measuredValues.length,
        0,
      );
      return { results, currentResult: newResult, csvRowCount };
    });
  },

  setCurrentResult: (result) => set({ currentResult: result }),

  exportCsv: () => {
    const { results } = get();
    if (results.length === 0) return;

    let slIdx = 0;

    /**
     * One CSV row per measurement per inspected image.
     *
     * Columns (per spec):
     *   sl_no | image_no | recipe_version | inspection_id | parameter
     *   measured_value | ideal_value | tolerance
     *   minimum_acceptable | maximum_acceptable
     *   result | processing_time_ms | timestamp
     *
     * These columns are generated dynamically from the InspectionResult
     * objects produced by runInspectionCycle().  No parameter names are
     * hardcoded here — the column values come entirely from the deployed
     * inspection recipe.
     */
    const rows: CsvRow[] = results.flatMap((r) =>
      r.measuredValues.map((mv) => {
        slIdx += 1;
        return {
          sl_no:              slIdx,
          image_no:           r.imageNo,
          recipe_version:     r.recipeVersion,
          inspection_id:      r.inspectionId,
          parameter:          mv.parameter,
          measured_value:     mv.measuredValue,
          ideal_value:        mv.idealValue,
          tolerance:          mv.tolerance,
          minimum_acceptable: mv.minimumAcceptable,
          maximum_acceptable: mv.maximumAcceptable,
          result:             mv.result === 'pass' ? 'Pass' : 'Fail',
          processing_time_ms: r.processingTimeMs,
          timestamp:          r.timestamp,
        };
      }),
    );

    // TODO (M3): window.electronAPI.csv.save(rows, path)
    const csv = generateCsvContent(rows as unknown as Record<string, unknown>[]);
    downloadFile(csv, `inspection_results_${Date.now()}.csv`);
    set({ lastCsvExportAt: new Date().toISOString() });
  },

  clearResults: () => set({
    results: [], currentResult: null, csvRowCount: 0, imageCounter: 0,
  }),
}));
