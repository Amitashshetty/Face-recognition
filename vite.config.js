import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,       // <--- Disables heavy debug files to save RAM
    chunkSizeWarningLimit: 1600,
  },
})

