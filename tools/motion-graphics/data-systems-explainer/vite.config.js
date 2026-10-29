import { defineConfig } from 'vite';

// Relative base so `dist/` works from any path (GitHub Pages, a sub-folder, file server).
export default defineConfig({
  base: './',
  server: { open: true },
});
