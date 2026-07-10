import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a timestamp as HH:MM:SS.mmm */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Generate a unique ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/** Convert pixel coordinate to mm (placeholder — real scale factor from camera calibration) */
export function pxToMm(px: number, scaleFactor = 0.1): number {
  // TODO: Connect to camera calibration service via Electron IPC
  return parseFloat((px * scaleFactor).toFixed(3));
}

/** Check if a measured value is within tolerance */
export function isWithinTolerance(
  measured: number,
  ideal: number,
  tolerance: number,
): boolean {
  return Math.abs(measured - ideal) <= tolerance;
}

/** Generate mock CSV content from rows */
export function generateCsvContent(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => String(r[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
}

/** Trigger browser download of a text file */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
