import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Сборка в один HTML-файл: его можно положить на GitHub Pages или опубликовать как артефакт.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2022' },
  test: { environment: 'node' }
});
