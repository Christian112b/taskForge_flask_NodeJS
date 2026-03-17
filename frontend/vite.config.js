import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Copy _redirects to dist after build
        const srcRedirects = './public/_redirects'
        const destRedirects = './dist/_redirects'
        if (fs.existsSync(srcRedirects)) {
          fs.copyFileSync(srcRedirects, destRedirects)
          console.log('Copied _redirects to dist')
        }
        // Copy test.html to dist after build
        const srcTest = './public/test.html'
        const destTest = './dist/test.html'
        if (fs.existsSync(srcTest)) {
          fs.copyFileSync(srcTest, destTest)
          console.log('Copied test.html to dist')
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  // Configuración de producción
  build: {
    // En producción, las llamadas a /api se hacen al backend
    // Usar variable de entorno VITE_API_URL o assumir same-origin
  },
  // Variables de entorno
  envPrefix: ['VITE_', 'PUBLIC_'],
  define: {
    // Hacer disponible la URL del API en tiempo de build
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },
}))
