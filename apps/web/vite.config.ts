import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ai-study/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@ai-study/design-tokens': path.resolve(__dirname, '../../packages/design-tokens/src/index.ts'),
      '@ai-study/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@ai-study/shared-schemas': path.resolve(__dirname, '../../packages/shared-schemas/src/index.ts')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
