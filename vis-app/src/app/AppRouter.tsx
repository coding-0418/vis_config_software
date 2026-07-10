import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoginPage } from '@/pages/LoginPage';
import { OperationSelectionPage } from '@/pages/OperationSelectionPage';
import { ConfigurePage } from '@/pages/ConfigurePage';
import { RunPage } from '@/pages/RunPage';
import { ProtectedRoute } from './ProtectedRoute';

const pageVariants = {
  initial: { opacity: 0, x: 6 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -6 },
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.18, ease: 'easeOut' }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageWrapper><OperationSelectionPage /></PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configure"
        element={
          <ProtectedRoute>
            <PageWrapper><ConfigurePage /></PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/run"
        element={
          <ProtectedRoute>
            <PageWrapper><RunPage /></PageWrapper>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
