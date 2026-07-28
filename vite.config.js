import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/nasa-proxy': {
        target: 'https://apod.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nasa-proxy/, '')
      }
    }
  }
});
