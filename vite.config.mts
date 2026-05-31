/* eslint-disable import/no-extraneous-dependencies */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '.env') });

const workerTarget = process.env.VITE_API_URL ?? 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
    // HMR target must be the public tunnel hostname when developing via
    // cloudflared, otherwise the browser tries to wss:// to localhost:5173
    // from inside the Shopify admin iframe (cross-origin, blocked).
    hmr: process.env.VITE_TUNNEL_HOST
      ? { protocol: 'wss', host: process.env.VITE_TUNNEL_HOST, clientPort: 443 }
      : undefined,
    // Allow Shopify's admin host plus the cloudflared tunnel host to load this
    // dev server inside an iframe (Vite blocks unknown Host headers by default).
    allowedHosts: process.env.VITE_TUNNEL_HOST
      ? [process.env.VITE_TUNNEL_HOST]
      : true,
    proxy: {
      '/api': { target: workerTarget, changeOrigin: true },
      '/shopify': { target: workerTarget, changeOrigin: true },
      '/health': { target: workerTarget, changeOrigin: true },
    },
  },
});
