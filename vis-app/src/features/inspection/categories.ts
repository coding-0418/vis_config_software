import type { InspectionCategory } from './types';

/**
 * The 12 inspection categories for Version 1.
 *
 * Ordered to match the product spec: most frequently used tools first,
 * calibration last. Icon names map to Lucide React components.
 */
export const INSPECTION_CATEGORIES: InspectionCategory[] = [
  {
    id: 'dimensional',
    label: 'Dimensional Inspection',
    icon: 'Ruler',
    description: 'Length, width, height, distance, diameter, radius, area, perimeter, angle',
  },
  {
    id: 'position',
    label: 'Position & Alignment',
    icon: 'Crosshair',
    description: 'X/Y position, centre, rotation, and offset measurements',
  },
  {
    id: 'blob',
    label: 'Blob Analysis',
    icon: 'Aperture',
    description: 'Blob detection, count, area, and centroid',
  },
  {
    id: 'edge',
    label: 'Edge & Line',
    icon: 'ScanLine',
    description: 'Edge detection, edge position, line detection, and line length',
  },
  {
    id: 'shape',
    label: 'Shape Analysis',
    icon: 'Shapes',
    description: 'Rectangle, circle, polygon, and contour fitting',
  },
  {
    id: 'object',
    label: 'Object Inspection',
    icon: 'Package',
    description: 'Presence/absence check, object count, and object detection',
  },
  {
    id: 'pattern',
    label: 'Pattern Matching',
    icon: 'ScanSearch',
    description: 'Template matching and feature location',
  },
  {
    id: 'appearance',
    label: 'Appearance Inspection',
    icon: 'Palette',
    description: 'Brightness, contrast, and colour inspection',
  },
  {
    id: 'code',
    label: 'Code Reading',
    icon: 'QrCode',
    description: 'Barcode, QR code, and Data Matrix decoding',
  },
  {
    id: 'roi',
    label: 'ROI Tools',
    icon: 'Crop',
    description: 'Rectangle, circle, and polygon regions of interest',
  },
  {
    id: 'inspection',
    label: 'Inspection',
    icon: 'CheckCircle',
    description: 'Tolerance check and pass/fail decision',
  },
  {
    id: 'calibration',
    label: 'Calibration',
    icon: 'Settings2',
    description: 'Camera calibration, pixel-to-mm scale, lens distortion, coordinate systems',
  },
];

export function getCategoryById(id: string): InspectionCategory | undefined {
  return INSPECTION_CATEGORIES.find((c) => c.id === id);
}
