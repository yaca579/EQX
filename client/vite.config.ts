import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:8787'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/demo': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
