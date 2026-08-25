import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * O `base` só existe por causa do GitHub Pages, que serve o site em
 * /santer-hub-agenda/ e não na raiz do domínio.
 *
 * Ele vale apenas no build: em desenvolvimento o site fica na raiz
 * (http://localhost:5173/), que é o endereço que se espera ao rodar
 * `npm run dev`. Com o base ligado no dev, abrir a raiz só redirecionava, e
 * qualquer endereço digitado à mão caía fora da aplicação.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/santer-hub-agenda/' : '/',
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
