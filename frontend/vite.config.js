import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiProxy = {
  '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:5000' },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  // REACT_APP_* keeps the existing Render environment working unchanged.
  envPrefix: ['VITE_', 'REACT_APP_'],
  // Same-origin API in development and local preview (see src/lib/api.js).
  server: { port: 3000, strictPort: true, proxy: apiProxy },
  preview: { port: 3000, strictPort: true, proxy: apiProxy },
  build: {
    // Same output folder as Create React App, so the deploy config still works.
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks that rarely change between deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Vite normalises module ids to forward slashes on every OS.
          if (
            /\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(
              id
            )
          )
            return 'react';
          if (/\/node_modules\/(radix-ui|@radix-ui|cmdk|sonner)\//.test(id))
            return 'ui';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
