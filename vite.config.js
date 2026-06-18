import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
<<<<<<< HEAD
      '/api': 'http://localhost:8080',
=======
      //새로고침시 우리가만든 api설계대로하려면 /api만남겨야한다. 
      '/api': 'http://localhost:8080'
>>>>>>> 29d4819b412d44f8a9d839156e2b12b8f3e2f7af
    }
  }
})
