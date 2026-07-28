import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// Base relativa: o app é servido de um servidor local embutido no Java (127.0.0.1).
export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1500 }
});
