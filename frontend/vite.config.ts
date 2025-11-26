import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@adapters': path.resolve(__dirname, 'src/adapters')
    }
  },
  server: {
    port: 5173
  },
  base: '/fueleu/'
});

