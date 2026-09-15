import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Pages are lazy-loaded so they already split, but the shared
          // runtime drags recharts and framer-motion into every chunk.
          // Isolate the chart library so the dashboard + savings paint in
          // ~200KB instead of waiting for the full recharts bundle.
          'charts-vendor': ['recharts'],
          // Framer Motion is used on Duplicates, Engine, Import and Dashboard.
          // It lands in the shared chunk today; isolating it lets pages that
          // don't animate start faster.
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
})