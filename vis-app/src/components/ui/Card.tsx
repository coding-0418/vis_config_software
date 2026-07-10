import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'inset' | 'bordered';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-surface shadow-card border border-border',
  raised:  'bg-surface shadow-md border border-border',
  inset:   'bg-workspace border border-border',
  bordered: 'bg-surface border border-border-strong',
};

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  xs:  'p-2',
  sm:  'p-3',
  md:  'p-4',
  lg:  'p-6',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg', variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-2 mb-3', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-sm font-semibold text-neutral-800 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);
