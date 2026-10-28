import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, vite serves the UI and forwards /api and /photos to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/photos': 'http://localhost:3000',
    },
  },
});
