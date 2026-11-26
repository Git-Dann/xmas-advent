import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API lives in Cloudflare Pages Functions. During `npm run dev`, Vite proxies
// /api to a running `wrangler pages dev` instance (see docs/DEPLOYMENT.md).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsDir: 'static',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: { '/api': 'http://127.0.0.1:8788' },
  },
});
