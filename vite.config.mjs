import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
        crizpo: fileURLToPath(new URL('./projects/crizpo/index.html', import.meta.url)),
        engineering: fileURLToPath(new URL('./projects/ar-engineerings/index.html', import.meta.url))
      }
    }
  }
});
