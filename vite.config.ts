import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { blameScopePlugin } from './src/plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [blameScopePlugin(), react()],
  resolve: {
    // Allows demo/ to import from 'blamescope' just like a real consumer would
    alias: {
      blamescope: path.resolve(__dirname, 'src/index.ts'),
    },
  },
})
