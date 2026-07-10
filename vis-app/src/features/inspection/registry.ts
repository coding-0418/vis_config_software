import { ALL_TOOLS } from './toolDefs';
import type { InspectionToolDef } from './types';

/** Look up a tool by its unique id. */
export function getToolById(id: string): InspectionToolDef | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

/** All tools belonging to a given category. */
export function getToolsByCategory(categoryId: string): InspectionToolDef[] {
  return ALL_TOOLS.filter((t) => t.categoryId === categoryId);
}

/**
 * Search tools by name and description (case-insensitive substring match).
 * Returns tools sorted by relevance: name matches first, then description.
 */
export function searchTools(query: string): InspectionToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_TOOLS;
  const nameMatches = ALL_TOOLS.filter((t) => t.name.toLowerCase().includes(q));
  const descMatches = ALL_TOOLS.filter(
    (t) => !t.name.toLowerCase().includes(q) && t.description.toLowerCase().includes(q),
  );
  return [...nameMatches, ...descMatches];
}
