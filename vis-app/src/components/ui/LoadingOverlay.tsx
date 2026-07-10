import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
  subMessage,
  className,
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute inset-0 z-50 flex flex-col items-center justify-center',
          'bg-white/80 backdrop-blur-sm rounded-lg',
          className,
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-3 border-neutral-200 border-t-primary-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse-slow" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-800">{message}</p>
            {subMessage && <p className="text-xs text-neutral-500 mt-1">{subMessage}</p>}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
