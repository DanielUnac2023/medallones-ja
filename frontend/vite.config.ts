import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// GitHub Pages: el 'base' debe coincidir con el nombre del repositorio.
// Si el repo se llama "clubestja", base es '/clubestja/'.
// Se puede sobreescribir en CI con la variable REPO_BASE (ej. '/clubestja/').
export default defineConfig({
  plugins: [react()],
  base: process.env.REPO_BASE ?? '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})