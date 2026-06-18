import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      //새로고침시 우리가만든 api설계대로하려면 /api만남겨야한다. 
      '/api': 'http://localhost:8080'
    }
  }
})
