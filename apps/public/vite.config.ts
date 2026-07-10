import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        '../..',
        'C:/Users/abuus/DOWNLO~1/BANKOF~1/website',
        'C:/Users/abuus/Downloads/bank of somaliland/website',
      ],
    },
  },
})
