/*
 * Leitura centralizada das variáveis de ambiente do bot.
 *
 * De onde vêm os valores:
 *   - staging/produção: do bloco `environment:` do serviço `bot` no compose da
 *     raiz do repositório;
 *   - dev local: do .env da RAIZ, carregado pelo próprio Node via
 *     `tsx --env-file=../../.env` (não usamos a lib dotenv).
 *
 * Nenhum outro arquivo de src/ deve ler process.env direto.
 */

type Obrigatoria = 'DISCORD_TOKEN' | 'CLIENT_ID' | 'REDIS_URL'

const ler = (nome: string): string => process.env[nome]?.trim() ?? ''

/*
 * Em dev o bot roda na máquina do desenvolvedor e fala com o Redis do
 * `make deps` pela LOCAL_REDIS_URL; dentro do Docker só existe a REDIS_URL
 * montada pelo compose (o container nunca recebe LOCAL_REDIS_URL).
 */
const redisUrl = ler('LOCAL_REDIS_URL') || ler('REDIS_URL')

export const env = {
    DISCORD_TOKEN: ler('DISCORD_TOKEN'),
    CLIENT_ID: ler('CLIENT_ID'),
    // Preenchida = slash commands registrados só nessa guild (propagação instantânea).
    DISCORD_GUILD_ID: ler('DISCORD_GUILD_ID'),
    // URL BASE da API, sem /api: quem chama é que acrescenta /api/v1.
    API_URL: (ler('API_URL') || 'http://api:3000').replace(/\/+$/, ''),
    API_KEY: ler('API_KEY'),
    REDIS_URL: redisUrl,
    // Domínio público do ambiente, usado para montar os links do site.
    PUBLIC_DOMAIN: ler('PUBLIC_DOMAIN') || 'fubika.com.br',
    GROQ_API_KEY: ler('GROQ_API_KEY')
} as const

const DICAS: Record<Obrigatoria, string> = {
    DISCORD_TOKEN: 'token do bot (Discord Developer Portal)',
    CLIENT_ID: 'application id (client id) do mesmo bot',
    REDIS_URL: 'ex.: redis://default:<senha>@redis:6379/0 (em dev local use LOCAL_REDIS_URL)'
}

/*
 * Aborta o boot com mensagem clara quando falta variável obrigatória, em vez de
 * seguir adiante com undefined (que virava login silencioso no Discord).
 * Cada entrypoint valida só o que usa: o deploy-commands não precisa de Redis.
 */
export function validarEnv(obrigatorias: readonly Obrigatoria[]): void {
    const faltando = obrigatorias.filter(nome => env[nome] === '')

    if (faltando.length === 0) return

    console.error('💥 [env] Variáveis de ambiente obrigatórias ausentes:')
    for (const nome of faltando) {
        console.error(`   - ${nome}: ${DICAS[nome]}`)
    }
    console.error('💥 [env] Defina-as no .env da RAIZ do repositório (veja .env.example) e suba o bot novamente.')

    process.exit(1)
}
