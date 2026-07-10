import { useToastStore } from '@/stores/toastStore';
import type { ToastVariant } from '@/stores/toastStore';

const DURATIONS: Record<ToastVariant, number> = {
  default: 3000,
  success: 3000,
  warning: 4000,
  error:   5000,
};

/**
 * useToast — Convenience hook to fire toast notifications from any component.
 *
 * Usage:
 *   const { toast, success, error, warning } = useToast();
 *   success('Configuration saved', 'JSON script written to disk');
 */
export function useToast() {
  const { add } = useToastStore();

  const toast = (
    title: string,
    description?: string,
    variant: ToastVariant = 'default',
  ) => add({ title, description, variant, duration: DURATIONS[variant] });

  return {
    toast,
    success: (title: string, description?: string) => toast(title, description, 'success'),
    error:   (title: string, description?: string) => toast(title, description, 'error'),
    warning: (title: string, description?: string) => toast(title, description, 'warning'),
  };
}
