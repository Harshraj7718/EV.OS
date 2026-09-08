import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), viteCompression({ algorithm: 'gzip' })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three';
            if (id.includes('gsap')) return 'gsap';
            if (id.includes('framer-motion')) return 'motion';
            // react-hook-form/zod are intentionally NOT grouped into a shared chunk here:
            // they're only used behind lazy boundaries (Contact, PaymentModal, LeadCaptureModal),
            // and a shared chunk across multiple lazy entry points gets modulepreloaded by Vite
            // on every page, defeating the lazy-loading. Each lazy chunk bundles its own copy.
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
