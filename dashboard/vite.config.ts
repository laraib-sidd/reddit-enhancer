import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from root directory (parent of dashboard)
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  return {
    plugins: [react(), tailwindcss()],
    base: '/reddit-enhancer/',  // GitHub Pages base path
    build: {
      outDir: 'dist',
    },
    define: {
      // Map root .env variables to VITE_ prefixed ones for browser access
      // This allows using GEMINI_API_KEY from root .env
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
        rootEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
      ),
    },
  }
})
