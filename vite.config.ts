import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // @coral-xyz/anchor reads process.env at module init; give it an empty env in the browser.
    'process.env': {},
    global: 'globalThis',
  },
})
