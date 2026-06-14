import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/index.js'),
        content: resolve(__dirname, 'src/content/index.js'),
        attendance: resolve(__dirname, 'src/content/attendance.js'),
        gpa: resolve(__dirname, 'src/content/gpa.js'),
        marks: resolve(__dirname, 'src/content/marks.js'),
      },
      output: {
        // Output format to prevent Vite from generating hashes for extension files 
        // which makes it harder to reference them in manifest.json dynamically.
        entryFileNames: 'src/[name]/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
