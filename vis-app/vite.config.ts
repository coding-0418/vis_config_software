import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Electron-compatible: use relative base path
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
