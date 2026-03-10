import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/run': 'https://auto-trading-ml.onrender.com',
      '/run_csv': 'https://auto-trading-ml.onrender.com',
      '/notify': 'https://auto-trading-ml.onrender.com',
    }
  }
})
