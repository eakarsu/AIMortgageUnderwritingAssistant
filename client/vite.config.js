import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const envDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [react()],
    server: {
      port: Number(env.FRONTEND_PORT || process.env.FRONTEND_PORT) || 3000,
      proxy: {
        '/api': {
          target: env.BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  }
})
