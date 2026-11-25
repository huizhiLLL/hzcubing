import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Discover the same Base UI dependencies before loading lazy routes.
    include: [
      '@base-ui/react/field',
      '@base-ui/react/input',
      '@base-ui/react/merge-props',
      '@base-ui/react/select',
      '@base-ui/react/use-render',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['hzcubing.fun'],
    proxy: {
      // Keep the browser Host so the Worker can compare it with Origin.
      '/api': { target: 'http://127.0.0.1:8795', changeOrigin: false },
      '/media': { target: 'http://127.0.0.1:8795', changeOrigin: false },
    },
  }
})
