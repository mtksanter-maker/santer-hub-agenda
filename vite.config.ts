import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/santer-hub-agenda/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // O HMR é desativado no AI Studio através da env DISABLE_HMR.
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});
