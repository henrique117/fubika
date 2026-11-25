/**
 * Configuração de URLs do front.
 *
 * A MESMA imagem do web roda em staging e em produção, então NÃO existe
 * nenhuma URL embutida em build time (nada de ARG VITE_API_URL no Dockerfile).
 * Todos os endereços são derivados em runtime.
 *
 * CONTRATO ÚNICO (importante): API_BASE_URL JÁ inclui o prefixo '/api/v1',
 * porque toda a API vive sob ele (services/api/src/server.ts: API_PREFIX).
 * Quem consome este módulo NÃO concatena '/api/v1' de novo — use só o caminho
 * do recurso, ex.: api.get('/users/me').
 *
 * Em produção/staging o domínio base vem de window.location.hostname.
 * Em dev a API é um caminho RELATIVO (proxy do Vite) e avatares/assets apontam
 * para o domínio de VITE_DEV_DOMAIN.
 */

/**
 * Domínio usado em dev e também como fallback quando não há `window`
 * (o módulo é avaliado no import — api.ts cria o axios no topo do arquivo —
 * então ele nunca pode estourar 'window is not defined').
 *
 * Só variáveis VITE_* chegam ao navegador, e no build da imagem essa variável
 * nem existe (o .env fica na raiz do repo, fora do contexto do Docker):
 * o valor padrão cobre esse caso.
 */
const DEV_DOMAIN: string = import.meta.env.VITE_DEV_DOMAIN || 'staging.fubika.com.br'

/** Avatar exibido para quem não está logado / quando o avatar do usuário falha. */
const DEFAULT_AVATAR_ID = 0

/**
 * Domínio base do ambiente, sem o prefixo 'www.'.
 *
 * O Caddy atende '{$DOMAIN}, www.{$DOMAIN}', mas os subdomínios existem apenas
 * sobre o domínio nu: 'api.www.fubika.com.br' não resolve em nenhum ambiente.
 */
function resolveBaseDomain(): string {
    if (typeof window === 'undefined') {
        return DEV_DOMAIN
    }

    if (import.meta.env.DEV) {
        return DEV_DOMAIN
    }

    return window.location.hostname.replace(/^www\./, '')
}

/** Ex.: 'fubika.com.br' em produção, 'staging.fubika.com.br' em staging/dev. */
export const BASE_DOMAIN: string = resolveBaseDomain()

/**
 * Base de todas as chamadas à API, já com o prefixo '/api/v1'.
 *
 * - produção/staging: 'https://api.<domínio>/api/v1'
 * - dev: '/api/v1' — caminho relativo que começa com '/api' para casar com a
 *   chave do proxy em vite.config.ts. O proxy não faz rewrite, então o destino
 *   recebe '/api/v1/...' exatamente como a API espera.
 */
export const API_BASE_URL: string = import.meta.env.DEV
    ? '/api/v1'
    : `https://api.${BASE_DOMAIN}/api/v1`

/** Avatares servidos pelo Caddy em a.<domínio> (pasta ./volumes/avatars). */
export const AVATAR_BASE_URL = `https://a.${BASE_DOMAIN}`

/** Assets (medalhas, banners, etc) servidos pelo Caddy em assets.<domínio>. */
export const ASSETS_BASE_URL = `https://assets.${BASE_DOMAIN}`

/** URL do avatar de um usuário; sem argumento devolve o avatar padrão. */
export function avatarUrl(userId: number | string = DEFAULT_AVATAR_ID): string {
    return `${AVATAR_BASE_URL}/${userId}`
}
