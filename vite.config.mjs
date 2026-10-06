import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const target = `http://127.0.0.1:${process.env.PORT || env.PORT || 3000}`

  return {
    root: fileURLToPath(new URL('./client', import.meta.url)),
    envDir: projectRoot,
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/campaigns': target,
        '/items': target,
        '/enemies': target,
        '/equip': target,
        '^/(auth(?:/|$)|data(?:[/?]|$)|add(?:[/?]|$)|update(?:[/?]|$)|delete(?:[/?]|$)|hp(?:[/?]|$))':
          target,
        '/css/bootstrap.min.css': target
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./client/index.html', import.meta.url)),
          campaign: fileURLToPath(
            new URL('./client/campaign.html', import.meta.url)
          )
        }
      },
      outDir: fileURLToPath(new URL('./dist', import.meta.url)),
      emptyOutDir: true
    }
  }
})
