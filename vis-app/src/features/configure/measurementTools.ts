import type { MeasurementTool, MeasurementToolExport } from '@/types';

export interface MeasurementPoint {
  x: number;
  y: number;
}

export interface MeasurementToolDefinition extends MeasurementTool {
  cursor: string;
  calculate(points: MeasurementPoint[], pxPerMm: number): number | null;
  serialize(points: MeasurementPoint[], measuredValue: number): MeasurementToolExport;
}

const createLengthTool = (): MeasurementToolDefinition => ({
  id: 'length',
  name: 'Length',
  category: 'measurements',
  icon: 'Ruler',
  description: 'Measure a straight-line distance between two points.',
  cursor: 'crosshair',
  draw: () => undefined,
  validate: () => true,
  calculate: (points, pxPerMm) => {
    if (points.length < 2) return null;
    const [start, end] = points;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    return Number((distPx / pxPerMm).toFixed(3));
  },
  export: () => ({
    toolId: 'length',
    name: 'Length',
    category: 'measurements',
    params: {},
  }),
  serialize: (points, measuredValue) => ({
    toolId: 'length',
    name: 'Length',
    category: 'measurements',
    params: {
      points,
      measuredValue,
      units: 'mm',
    },
  }),
});

export const MEASUREMENT_TOOL_REGISTRY: Record<string, MeasurementToolDefinition> = {
  length: createLengthTool(),
};

export const getMeasurementToolDefinition = (name: string | null): MeasurementToolDefinition | null => {
  if (!name) return null;
  const key = name.toLowerCase();
  return MEASUREMENT_TOOL_REGISTRY[key] ?? null;
};
