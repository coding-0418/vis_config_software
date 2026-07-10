import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_UNIT_PREFERENCES,
  type UnitPreferences,
  type DistanceUnit,
  type AreaUnit,
  type AngleUnit,
  type CoordUnit,
} from '@/features/units/types';

interface UnitPreferenceStoreState {
  prefs: UnitPreferences;

  setDistanceUnit: (unit: DistanceUnit) => void;
  setDistancePrecision: (precision: number) => void;

  setAreaUnit: (unit: AreaUnit) => void;
  setAreaPrecision: (precision: number) => void;

  setAngleUnit: (unit: AngleUnit) => void;
  setAnglePrecision: (precision: number) => void;

  setPointUnit: (unit: CoordUnit) => void;
  setPointPrecision: (precision: number) => void;

  setRadiusUnit: (unit: DistanceUnit) => void;
  setRadiusPrecision: (precision: number) => void;

  reset: () => void;
}

const merge = <T>(existing: T, patch: Partial<T>): T => ({ ...existing, ...patch });

export const useUnitPreferenceStore = create<UnitPreferenceStoreState>()(
  persist(
    (set) => ({
      prefs: DEFAULT_UNIT_PREFERENCES,

      setDistanceUnit:      (unit)      => set((s) => ({ prefs: { ...s.prefs, distance: merge(s.prefs.distance, { unit }) } })),
      setDistancePrecision: (precision) => set((s) => ({ prefs: { ...s.prefs, distance: merge(s.prefs.distance, { precision }) } })),

      setAreaUnit:      (unit)      => set((s) => ({ prefs: { ...s.prefs, area: merge(s.prefs.area, { unit }) } })),
      setAreaPrecision: (precision) => set((s) => ({ prefs: { ...s.prefs, area: merge(s.prefs.area, { precision }) } })),

      setAngleUnit:      (unit)      => set((s) => ({ prefs: { ...s.prefs, angle: merge(s.prefs.angle, { unit }) } })),
      setAnglePrecision: (precision) => set((s) => ({ prefs: { ...s.prefs, angle: merge(s.prefs.angle, { precision }) } })),

      setPointUnit:      (unit)      => set((s) => ({ prefs: { ...s.prefs, point: merge(s.prefs.point, { unit }) } })),
      setPointPrecision: (precision) => set((s) => ({ prefs: { ...s.prefs, point: merge(s.prefs.point, { precision }) } })),

      setRadiusUnit:      (unit)      => set((s) => ({ prefs: { ...s.prefs, radius: merge(s.prefs.radius, { unit }) } })),
      setRadiusPrecision: (precision) => set((s) => ({ prefs: { ...s.prefs, radius: merge(s.prefs.radius, { precision }) } })),

      reset: () => set({ prefs: DEFAULT_UNIT_PREFERENCES }),
    }),
    { name: 'vis-unit-preferences' },
  ),
);
