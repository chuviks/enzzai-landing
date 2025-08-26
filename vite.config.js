// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
    hmr: {
      protocol: 'wss',
      host: 'https://raises-treasurer-catch-cod.trycloudflare.com', // твой текущий домен
      clientPort: 443,
    },
  },
  preview: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
  },
})
