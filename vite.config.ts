/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Em produção a página é carregada via file:// pelo Electron. A CSP é injetada
 * somente no build para não bloquear o HMR do servidor de desenvolvimento.
 */
function politicaDeSegurancaDeConteudo(): Plugin {
  return {
    name: 'csp-producao',
    apply: 'build',
    transformIndexHtml(html) {
      const csp =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; " +
        "object-src 'none'; base-uri 'none'; form-action 'none'";
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      );
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), politicaDeSegurancaDeConteudo()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
