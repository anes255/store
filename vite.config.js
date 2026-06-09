import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  build: {
    // Split heavy third-party libs into their own long-cached chunks so the
    // main bundle stays small and the browser can load/cache them in parallel.
    rollupOptions: {
      output: {
        // Only split clearly independent, heavy libraries into their own
        // chunks. React and everything that depends on it stay in Vite's
        // default grouping to avoid module-init ordering errors.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
