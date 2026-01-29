import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mammogram/',
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts: [
      'localhost',
      '10.184.3.15',
      'xraycad.bosschn.in',
      '.bosschn.in',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
