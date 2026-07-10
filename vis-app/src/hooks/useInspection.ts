import { useCallback } from 'react';
import { useInspectionStore } from '@/stores/inspectionStore';

/**
 * useInspection — wraps inspection actions for the Run page.
 *
 * ELECTRON IPC HOOK POINT:
 * On stopInspection, send final CSV to main process:
 *   window.electronAPI.csv.writeFile(rows, path)
 */
export function useInspection() {
  const {
    results,
    currentResult,
    isRunning,
    csvRowCount,
    lastCsvExportAt,
    startInspection,
    stopInspection,
    exportCsv,
    clearResults,
  } = useInspectionStore();

  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const passRate = results.length > 0 ? ((passCount / results.length) * 100).toFixed(1) : '0.0';

  const handleStop = useCallback(() => {
    stopInspection();
  }, [stopInspection]);

  const handleExport = useCallback(() => {
    exportCsv();
  }, [exportCsv]);

  return {
    results,
    currentResult,
    isRunning,
    csvRowCount,
    lastCsvExportAt,
    passCount,
    failCount,
    passRate,
    startInspection,
    stopInspection: handleStop,
    exportCsv: handleExport,
    clearResults,
  };
}
