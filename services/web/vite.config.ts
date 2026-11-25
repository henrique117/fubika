import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// O .env é ÚNICO e fica na RAIZ do repositório (dois níveis acima de
// services/web). Resolvemos o caminho a partir da URL deste arquivo em vez de
// process.cwd() para o config não depender de onde o comando foi disparado.
// Só variáveis com prefixo VITE_ chegam ao navegador.
const envDir = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig(({ mode }) => {
  // Dentro do vite.config não existe import.meta.env, então o domínio de dev
  // vem do loadEnv — apontando para o MESMO envDir, senão ele leria o .env
  // (inexistente) de services/web.
  const env = loadEnv(mode, envDir, 'VITE_')
  const devDomain = env.VITE_DEV_DOMAIN || 'staging.fubika.com.br'

  return {
    plugins: [react()],
    envDir,
    server: {
      proxy: {
        // Em dev o front chama '/api/v1/...' (src/config.ts devolve o caminho
        // relativo '/api/v1'). Sem rewrite o Vite repassa o caminho completo,
        // então o destino recebe '/api/v1/...' — exatamente o prefixo que o
        // Fastify registra (services/api/src/server.ts: API_PREFIX).
        // changeOrigin é obrigatório: sem ele o Host enviado seria 'localhost'
        // e o Caddy do staging não acharia o site de api.<domínio>.
        '/api': {
          target: `https://api.${devDomain}`,
          changeOrigin: true,
        },
      },
    },
  }
})
