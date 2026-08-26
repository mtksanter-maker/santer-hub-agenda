import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * O `base` relativo faz o mesmo build servir em qualquer endereço.
 *
 * O site é publicado em dois lugares: o Firebase Hosting, na raiz
 * (santer-hub.web.app), e o GitHub Pages, numa subpasta
 * (/santer-hub-agenda/). Com caminhos relativos o `index.html` acha os
 * arquivos nos dois — não é preciso um build por host.
 *
 * Em desenvolvimento o base fica na raiz, que é o endereço esperado ao rodar
 * `npm run dev` (http://localhost:5173/).
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
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
}));
