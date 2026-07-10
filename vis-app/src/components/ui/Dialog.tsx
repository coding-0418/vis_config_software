import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

interface DialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  onClick: () => void;
}

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  actions?: DialogAction[];
  onClose?: () => void;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  description,
  actions = [],
  onClose,
  className,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 bg-white rounded-xl shadow-2xl border border-border',
          'w-full max-w-sm mx-4 p-5',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="dialog-title" className="text-sm font-semibold text-neutral-800 leading-snug">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0 -mt-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-neutral-600 leading-relaxed mb-4">{description}</p>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'secondary'}
                size="sm"
                onClick={action.onClick}
                className="w-full"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
