import type { InteractionTool } from './types';
import { DistanceTool } from './tools/DistanceTool';
import { ROITool } from './tools/ROITool';
import { CircleTool } from './tools/CircleTool';
import { AngleTool } from './tools/AngleTool';
import { PointTool } from './tools/PointTool';
import { PolygonTool } from './tools/PolygonTool';
import { FreehandTool } from './tools/FreehandTool';

/**
 * Maps sidebar tool names (as returned by MeasurementSidebar.onSelect) to a
 * factory function that produces the appropriate InteractionTool instance.
 *
 * Keys are lower-cased for case-insensitive lookup.
 */
const REGISTRY: Record<string, () => InteractionTool> = {
  // Distance / Length family
  length:        () => new DistanceTool(),
  distance:      () => new DistanceTool(),
  'line width':  () => new DistanceTool(),
  width:         () => new DistanceTool(),
  height:        () => new DistanceTool(),
  gap:           () => new DistanceTool(),
  radius:        () => new DistanceTool(),

  // Area / ROI
  area:          () => new ROITool(),
  roi:           () => new ROITool(),
  rectangle:     () => new ROITool(),
  rect:          () => new ROITool(),
  region:        () => new ROITool(),

  // Circle / Diameter
  circle:        () => new CircleTool(),
  diameter:      () => new CircleTool(),
  roundness:     () => new CircleTool(),

  // Angle
  angle:         () => new AngleTool(),

  // Point / Position
  point:         () => new PointTool(),
  position:      () => new PointTool(),
  location:      () => new PointTool(),

  // Polygon / Contour
  polygon:       () => new PolygonTool(),
  contour:       () => new PolygonTool(),
  perimeter:     () => new PolygonTool(),

  // Freehand
  freehand:      () => new FreehandTool(),
  blob:          () => new FreehandTool(),
};

/** Returns a fresh tool instance for the given name, or null if unmapped. */
export function createToolForName(toolName: string): InteractionTool | null {
  const factory = REGISTRY[toolName.toLowerCase()];
  return factory ? factory() : null;
}
