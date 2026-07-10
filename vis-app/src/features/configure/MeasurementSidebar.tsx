import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import {
  Ruler, Crosshair, Aperture, ScanLine, Shapes, Package,
  ScanSearch, Palette, QrCode, Crop, CheckCircle, Settings2,
} from 'lucide-react';
import { cn } from '@/utils';
import { INSPECTION_CATEGORIES } from '@/features/inspection/categories';
import { getToolsByCategory, searchTools } from '@/features/inspection/registry';
import type { InspectionToolDef } from '@/features/inspection/types';

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Ruler,
  Crosshair,
  Aperture,
  ScanLine,
  Shapes,
  Package,
  ScanSearch,
  Palette,
  QrCode,
  Crop,
  CheckCircle,
  Settings2,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface MeasurementSidebarProps {
  selectedTool: InspectionToolDef | null;
  onSelect: (tool: InspectionToolDef) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MeasurementSidebar: React.FC<MeasurementSidebarProps> = ({
  selectedTool,
  onSelect,
}) => {
  const [query,       setQuery]       = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['dimensional']),
  );

  const searchResults = useMemo(
    () => (query.trim() ? searchTools(query) : null),
    [query],
  );

  const toggleCategory = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-52 shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-neutral-50 shrink-0">
        <h2 className="text-2xs font-bold text-neutral-500 uppercase tracking-widest">
          Inspection Tools
        </h2>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-border shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-1.5 w-3 h-3 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              'w-full h-6 pl-6 pr-5 text-2xs border rounded outline-none transition-colors',
              'bg-white text-neutral-800 border-border',
              'focus:border-primary-400 focus:ring-1 focus:ring-primary-100',
              'placeholder:text-neutral-400',
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto py-1">
        {searchResults ? (
          // ── Search results (flat, no sub-groups) ───────────────────────────
          searchResults.length === 0 ? (
            <p className="px-3 py-4 text-2xs text-neutral-400 text-center">No tools found</p>
          ) : (
            searchResults.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isSelected={selectedTool?.id === tool.id}
                onSelect={onSelect}
                indent={false}
              />
            ))
          )
        ) : (
          // ── Category accordion ─────────────────────────────────────────────
          INSPECTION_CATEGORIES.map((cat) => {
            const Icon      = ICON_MAP[cat.icon] ?? Ruler;
            const isOpen    = expandedIds.has(cat.id);
            const tools     = getToolsByCategory(cat.id);
            const hasActive = tools.some((t) => t.id === selectedTool?.id);

            return (
              <div key={cat.id}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors',
                    'hover:bg-primary-50 hover:text-primary-700',
                    hasActive ? 'text-primary-700' : 'text-neutral-700',
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate">{cat.label}</span>
                  <span className="text-2xs text-neutral-400 mr-0.5">{tools.length}</span>
                  {isOpen
                    ? <ChevronDown className="w-3 h-3 shrink-0 text-neutral-400" />
                    : <ChevronRight className="w-3 h-3 shrink-0 text-neutral-400" />
                  }
                </button>

                {/* Expanded tool list — with optional sub-group headers */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-neutral-50"
                    >
                      <ToolGroup
                        tools={tools}
                        selectedId={selectedTool?.id ?? null}
                        onSelect={onSelect}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

// ── ToolGroup — renders tools with optional sub-group section labels ───────────

interface ToolGroupProps {
  tools: InspectionToolDef[];
  selectedId: string | null;
  onSelect: (tool: InspectionToolDef) => void;
}

const ToolGroup: React.FC<ToolGroupProps> = ({ tools, selectedId, onSelect }) => {
  const hasSubGroups = tools.some((t) => t.subGroup);

  if (!hasSubGroups) {
    return (
      <>
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isSelected={selectedId === tool.id}
            onSelect={onSelect}
            indent
          />
        ))}
      </>
    );
  }

  // Group by subGroup, preserving order of first occurrence
  const groups: { label: string; tools: InspectionToolDef[] }[] = [];
  const seen = new Map<string, InspectionToolDef[]>();

  for (const tool of tools) {
    const key = tool.subGroup ?? '';
    if (!seen.has(key)) {
      seen.set(key, []);
      groups.push({ label: key, tools: seen.get(key)! });
    }
    seen.get(key)!.push(tool);
  }

  return (
    <>
      {groups.map(({ label, tools: groupTools }) => (
        <div key={label}>
          {/* Sub-group label */}
          {label && (
            <p className="px-3 pt-2 pb-0.5 text-2xs font-semibold text-neutral-400 uppercase tracking-widest select-none">
              {label}
            </p>
          )}
          {groupTools.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isSelected={selectedId === tool.id}
              onSelect={onSelect}
              indent
            />
          ))}
        </div>
      ))}
    </>
  );
};

// ── ToolButton ────────────────────────────────────────────────────────────────

interface ToolButtonProps {
  tool: InspectionToolDef;
  isSelected: boolean;
  onSelect: (tool: InspectionToolDef) => void;
  indent: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, isSelected, onSelect, indent }) => (
  <button
    onClick={() => onSelect(tool)}
    title={tool.description}
    className={cn(
      'w-full flex items-center gap-2 pr-3 py-1 text-left text-xs transition-colors',
      indent ? 'pl-8' : 'pl-3',
      isSelected
        ? 'bg-primary-100 text-primary-700 font-semibold border-r-2 border-primary-500'
        : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-600',
    )}
  >
    <span className={cn(
      'w-1.5 h-1.5 rounded-full shrink-0',
      isSelected ? 'bg-primary-500' : 'bg-neutral-300',
    )} />
    <span className="truncate">{tool.name}</span>
  </button>
);
