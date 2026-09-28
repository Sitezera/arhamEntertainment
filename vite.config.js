import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page. index.html is the scroll flight and mounts React; the rest are
// plain HTML documents, so they are crawlable and paint without waiting on
// any JavaScript. Add new pages to this map.
export default defineConfig({
  plugins: [react()],
  server: { port: 5190 },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        work: resolve(__dirname, 'work.html'),
        services: resolve(__dirname, 'services.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    }
  }
});
