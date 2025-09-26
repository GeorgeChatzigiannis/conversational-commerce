import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = env.VITE_CONVAI_API_URL?.replace('/api/agents/copilotAgent/stream', '')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: baseUrl,
          changeOrigin: true,
          secure: true,
          headers: {
            'Origin': baseUrl,
          }
        }
      }
    }
  }
})