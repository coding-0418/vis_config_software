import React from 'react';
import { AppRouter } from './app/AppRouter';
import { Toaster } from './components/ui/Toaster';

export const App: React.FC = () => (
  <>
    <AppRouter />
    <Toaster />
  </>
);

export default App;
