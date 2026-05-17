import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3001'
  
  return {
    server:{
      proxy:{
        '/api':{
          target: backendUrl,
          secure:false,
          changeOrigin:true,
        },
      },
    },
    plugins: [react()],
    define: {
      // Make env variables available globally
      'process.env': env
    }
  }
})
