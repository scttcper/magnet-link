import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 1024 * 100,
  },
});
