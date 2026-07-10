import React from 'react';
import { cn } from '@/utils';
import type { InspectionStatus, ToleranceStatus } from '@/types';

type BadgeVariant = 'pass' | 'fail' | 'pending' | 'info' | 'warning' | 'offline' | 'live';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant | InspectionStatus | ToleranceStatus;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  pass:    'bg-success-100 text-success-700 border-success-500/30',
  fail:    'bg-danger-100 text-danger-700 border-danger-500/30',
  pending: 'bg-neutral-100 text-neutral-600 border-neutral-300',
  info:    'bg-primary-50 text-primary-700 border-primary-200',
  warning: 'bg-warning-100 text-warning-600 border-warning-300',
  offline: 'bg-neutral-200 text-neutral-600 border-neutral-300',
  live:    'bg-success-100 text-success-700 border-success-300',
};

const dotMap: Record<BadgeVariant, string> = {
  pass:    'bg-success-500',
  fail:    'bg-danger-500',
  pending: 'bg-neutral-400',
  info:    'bg-primary-500',
  warning: 'bg-warning-500',
  offline: 'bg-neutral-400',
  live:    'bg-success-500',
};

const sizeMap = {
  sm: 'text-2xs px-1.5 py-0.5 gap-1',
  md: 'text-xs  px-2   py-0.5 gap-1',
  lg: 'text-sm  px-3   py-1   gap-1.5',
};

function resolveVariant(v: StatusBadgeProps['variant']): BadgeVariant {
  const s = v as string;
  if (s === 'processing' || s === 'idle' || s === 'connecting') return 'pending';
  return v as BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  size = 'md',
  dot = true,
  pulse = false,
  className,
  children,
  ...props
}) => {
  const resolved = resolveVariant(variant);
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded border uppercase tracking-wide',
        variantMap[resolved],
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex shrink-0 h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotMap[resolved],
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotMap[resolved])} />
        </span>
      )}
      {children}
    </span>
  );
};
