import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['local.nutria.com'],
    // Docker Desktop sobre Windows/OneDrive puede no emitir eventos de archivos.
    // El polling se habilita solo en el servicio local del compose.
    watch: {
      usePolling: process.env.WATCH_POLLING === 'true',
      interval: 500,
    },
  },
})
