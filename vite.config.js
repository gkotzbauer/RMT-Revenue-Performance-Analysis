import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/RMT-Revenue-Performance-Analysis/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html') },
      output: {
        manualChunks: {
          vendor: ['lodash', 'xlsx', 'chart.js']
        }
      }
    }
  },
  server: { 
    port: 3000, 
    open: true, 
    cors: true,
    headers: {
      'Content-Type': 'application/javascript',
      'X-Content-Type-Options': 'nosniff'
    }
  },
  assetsInclude: ['**/*.xlsx', '**/*.xls'],
  resolve: { 
    alias: { 
      '@': resolve(__dirname, 'src'),
      'src': resolve(__dirname, 'src')
    } 
  },
  optimizeDeps: { 
    include: ['lodash', 'xlsx', 'chart.js'],
    exclude: []
  }
});
