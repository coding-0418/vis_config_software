import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils';
import type { ActivityEntry } from '@/types';

interface ActivityLogProps {
  entries: ActivityEntry[];
  className?: string;
}

/**
 * ActivityLog — "Selected Parameter" panel.
 *
 * A live chronological record of every operator action during configuration.
 * Newest entry is always at the TOP.
 *
 * Each entry renders as:
 *
 *   10:42:15
 *   R changed to 100
 *
 *   10:42:23
 *   Length selected
 *
 *   10:42:40
 *   Measured Length
 *   42.36 mm
 */
export const ActivityLog: React.FC<ActivityLogProps> = ({ entries, className }) => {
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  const ordered = [...entries].reverse();

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-neutral-50 shrink-0">
        <h2 className="text-2xs font-bold text-neutral-500 uppercase tracking-widest">
          Selected Parameter
        </h2>
      </div>

      {/* Entries — newest first */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div ref={topRef} />
        {ordered.length === 0 ? (
          <p className="text-2xs text-neutral-400 italic mt-2 leading-relaxed">
            Actions will appear here as you configure the inspection.
          </p>
        ) : (
          <div className="space-y-0">
            {ordered.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Entry ─────────────────────────────────────────────────────────────────────

const LogEntry: React.FC<{ entry: ActivityEntry }> = ({ entry }) => {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-GB', {
    hour12:  false,
    hour:    '2-digit',
    minute:  '2-digit',
    second:  '2-digit',
  });

  return (
    <div className="py-1.5 border-b border-neutral-100 last:border-0">
      {/* Timestamp on its own line */}
      <p className="text-2xs text-neutral-400 font-mono tabular-nums leading-none mb-0.5">
        {time}
      </p>
      {/* Action */}
      <p className="text-xs text-neutral-800 leading-snug">{entry.message}</p>
      {/* Value (if present) */}
      {entry.detail && (
        <p className="text-xs font-mono text-primary-700 leading-snug mt-0.5">
          {entry.detail}
        </p>
      )}
    </div>
  );
};
