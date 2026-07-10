import React, { useEffect } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { useToastStore } from '@/stores/toastStore';
import type { ToastVariant } from '@/stores/toastStore';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />,
  error:   <AlertCircle  className="w-4 h-4 text-danger-600 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning-600 shrink-0" />,
  default: <Info className="w-4 h-4 text-primary-500 shrink-0" />,
};

// ─── Style map ────────────────────────────────────────────────────────────────
const STYLES: Record<ToastVariant, string> = {
  success: 'border-success-200 bg-success-50',
  error:   'border-danger-200 bg-danger-50',
  warning: 'border-warning-100 bg-warning-50',
  default: 'border-border bg-white',
};

const TITLE_STYLES: Record<ToastVariant, string> = {
  success: 'text-success-800',
  error:   'text-danger-800',
  warning: 'text-warning-800',
  default: 'text-neutral-800',
};

const DESC_STYLES: Record<ToastVariant, string> = {
  success: 'text-success-600',
  error:   'text-danger-600',
  warning: 'text-warning-600',
  default: 'text-neutral-500',
};

// ─── Individual toast item ────────────────────────────────────────────────────
const ToastItem: React.FC<{
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}> = ({ id, title, description, variant, duration }) => {
  const { remove } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => remove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, remove]);

  return (
    <ToastPrimitive.Root
      open
      onOpenChange={(open) => { if (!open) remove(id); }}
      asChild
    >
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.96 }}
        animate={{ opacity: 1, x: 0,  scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={cn(
          'flex items-start gap-3 w-72 rounded-lg border shadow-md p-3',
          STYLES[variant],
        )}
      >
        {ICONS[variant]}
        <div className="flex-1 min-w-0">
          <ToastPrimitive.Title
            className={cn('text-xs font-semibold leading-snug', TITLE_STYLES[variant])}
          >
            {title}
          </ToastPrimitive.Title>
          {description && (
            <ToastPrimitive.Description
              className={cn('text-2xs mt-0.5 leading-snug', DESC_STYLES[variant])}
            >
              {description}
            </ToastPrimitive.Description>
          )}
        </div>
        <ToastPrimitive.Close
          onClick={() => remove(id)}
          className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </ToastPrimitive.Close>
      </motion.div>
    </ToastPrimitive.Root>
  );
};

// ─── Toaster — renders all active toasts ─────────────────────────────────────
export const Toaster: React.FC = () => {
  const { toasts } = useToastStore();

  return (
    <ToastPrimitive.Provider>
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
};
