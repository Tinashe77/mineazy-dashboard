import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Ensure this points to your `src` directory
    },
  },
  esbuild: {
    target: 'es2020' // This enables optional chaining
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://minings.onrender.com',
        changeOrigin: true,
        secure: true,
        credentials: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
        headers: {
      'Cache-Control': 'no-cache'  // Add this line
    },
      }
    }
  }
});
