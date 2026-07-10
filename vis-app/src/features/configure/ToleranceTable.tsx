import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useConfigurationStore } from '@/stores/configurationStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import type { ToleranceRow } from '@/types';

const col = createColumnHelper<ToleranceRow>();

export const ToleranceTable: React.FC = () => {
  const { toleranceRows, addToleranceRow, updateToleranceRow, removeToleranceRow } =
    useConfigurationStore();

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (id: string, field: string, currentVal: string) => {
    setEditingCell({ id, field });
    setEditValue(currentVal);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const numVal = parseFloat(editValue);
    updateToleranceRow(id, {
      [field]: isNaN(numVal) ? editValue : numVal,
    } as Partial<ToleranceRow>);
    setEditingCell(null);
  };

  const columns = [
    col.accessor('parameter', {
      header: 'Parameter',
      cell: (info) => {
        const row = info.row.original;
        const isEditing = editingCell?.id === row.id && editingCell.field === 'parameter';
        return isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
            className="w-full text-xs border border-primary-400 rounded px-1 py-0.5 outline-none bg-white"
          />
        ) : (
          <span
            className="cursor-pointer text-xs text-neutral-800 hover:text-primary-600"
            onDoubleClick={() => startEdit(row.id, 'parameter', row.parameter)}
          >
            {row.parameter}
          </span>
        );
      },
    }),
    col.accessor('idealValue', {
      header: 'Ideal Value',
      cell: (info) => {
        const row = info.row.original;
        const isEditing = editingCell?.id === row.id && editingCell.field === 'idealValue';
        return isEditing ? (
          <input
            autoFocus
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
            className="w-16 text-xs border border-primary-400 rounded px-1 py-0.5 outline-none bg-white font-mono"
          />
        ) : (
          <span
            className="cursor-pointer text-xs font-mono text-neutral-700 hover:text-primary-600"
            onDoubleClick={() => startEdit(row.id, 'idealValue', String(row.idealValue))}
          >
            {row.idealValue}
          </span>
        );
      },
    }),
    col.accessor('tolerance', {
      header: 'Tolerance',
      cell: (info) => {
        const row = info.row.original;
        const isEditing = editingCell?.id === row.id && editingCell.field === 'tolerance';
        return isEditing ? (
          <input
            autoFocus
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
            className="w-16 text-xs border border-primary-400 rounded px-1 py-0.5 outline-none bg-white font-mono"
          />
        ) : (
          <span
            className="cursor-pointer text-xs font-mono text-neutral-700 hover:text-primary-600"
            onDoubleClick={() => startEdit(row.id, 'tolerance', String(row.tolerance))}
          >
            ±{row.tolerance}
          </span>
        );
      },
    }),
    col.accessor('units', {
      header: 'Units',
      cell: (info) => {
        const row = info.row.original;
        const isEditing = editingCell?.id === row.id && editingCell.field === 'units';
        return isEditing ? (
          <select
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            className="text-xs border border-primary-400 rounded px-1 py-0.5 outline-none bg-white"
          >
            {['mm', 'px', '°', '%', 'µm'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        ) : (
          <span
            className="cursor-pointer text-xs text-neutral-600 hover:text-primary-600"
            onDoubleClick={() => startEdit(row.id, 'units', row.units)}
          >
            {row.units}
          </span>
        );
      },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <StatusBadge variant={info.getValue()} size="sm">
          {info.getValue()}
        </StatusBadge>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <button
          onClick={() => removeToleranceRow(info.row.original.id)}
          className="p-0.5 rounded text-neutral-300 hover:text-danger-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: toleranceRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-700">Set Value &amp; Tolerance</h3>
        <Button
          size="xs"
          variant="outline"
          icon={<Plus className="w-3 h-3" />}
          onClick={addToleranceRow}
        >
          Add Row
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-neutral-50 border-b border-border">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-2.5 py-1.5 text-left text-2xs font-bold text-neutral-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50',
                  'hover:bg-primary-50/40',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2.5 py-1.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-2xs text-neutral-400">
        Double-click any cell to edit inline. Press Enter to confirm.
      </p>
    </div>
  );
};
