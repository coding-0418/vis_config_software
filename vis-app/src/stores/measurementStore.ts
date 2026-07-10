import { create } from 'zustand';
import type { MeasurementTool, MeasurementToolExport, MeasurementCategory } from '@/types';

/**
 * measurementStore — Tracks the active drawing/measurement tool and its history.
 *
 * Architecture note:
 * In M4 (Measurement Framework), tools will be registered via a plugin registry
 * and the activeTool will drive Konva canvas event handlers in CameraCanvas.tsx.
 *
 * ELECTRON IPC HOOK POINT (M4):
 * Tool exports are sent to the pipeline builder which generates the JSON script.
 * window.electronAPI.measurement.registerResult(export) — future integration.
 */

interface MeasurementStore {
  activeTool: MeasurementTool | null;
  activeCategory: MeasurementCategory | null;
  toolHistory: MeasurementToolExport[];

  setActiveTool: (tool: MeasurementTool | null) => void;
  setActiveCategory: (category: MeasurementCategory | null) => void;
  addToHistory: (exported: MeasurementToolExport) => void;
  clearHistory: () => void;
}

export const useMeasurementStore = create<MeasurementStore>((set) => ({
  activeTool: null,
  activeCategory: null,
  toolHistory: [],

  setActiveTool: (tool) => set({ activeTool: tool }),

  setActiveCategory: (category) => set({ activeCategory: category }),

  addToHistory: (exported) =>
    set((s) => ({ toolHistory: [...s.toolHistory, exported] })),

  clearHistory: () => set({ toolHistory: [] }),
}));
