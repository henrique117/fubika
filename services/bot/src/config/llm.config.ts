import OpenAI from 'openai'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

if (!GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY não está definida no .env! O MCP não funcionará.')
}

export const groqClient = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
})

export const llmConfig = {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 150,
    timeout: 10000, // 10 segundos
}
