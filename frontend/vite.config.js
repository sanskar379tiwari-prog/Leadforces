import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://leadforces.onrender.com',
        changeOrigin: true,
        secure: false, // Prevents certificate issues in local dev
        // Ensure path remains correct
        rewrite: (path) => path,
      },
    },
  },
})
