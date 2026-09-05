import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  esbuild: {
    drop: ['debugger'],
  },
  build: {
    // Modern baseline — smaller output, no legacy transpilation for browsers
    // that already support what the app uses.
    target: 'es2020',
    cssCodeSplit: true,
    // Split heavy third-party libs into their own long-cached chunks so the
    // main bundle stays small and the browser can load/cache them in parallel.
    rollupOptions: {
      output: {
        // Only split clearly independent, heavy libraries into their own
        // chunks. React and everything that depends on it stay in Vite's
        // default grouping to avoid module-init ordering errors.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // React MUST get its own chunk. Without this it is a shared module
          // between the entry and the forced `charts` chunk, and Rollup
          // resolves that by folding react-dom INTO charts — which made every
          // visitor (storefront buyers included) download the whole 545 kB
          // recharts bundle before the first paint.
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/') || id.includes('/node_modules/object-assign/')) return 'react-vendor';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
          // lucide-react ships one module per icon; without grouping, Rollup
          // emitted ~50 separate 1 kB chunks and the browser paid a request
          // for each one.
          if (id.includes('lucide-react')) return 'icons';
          // framer-motion is ~100kB and is only needed once a page that
          // animates actually mounts — its own chunk keeps it out of the
          // critical path and lets it stay cached across deploys.
          if (id.includes('framer-motion') || id.includes('/popmotion') || id.includes('/@motionone')) return 'motion';
          // i18next + the translation tables are large and change rarely.
          if (id.includes('i18next')) return 'i18n';
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
