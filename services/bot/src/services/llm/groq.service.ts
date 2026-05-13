import { groqClient, llmConfig } from '@/config/llm.config'

export interface ToolDefinition {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: Record<string, any>
    }
}

export interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface ToolCall {
    name: string
    params: Record<string, any>
}

export interface ProcessMessageResult {
    toolCall?: ToolCall
    directResponse?: string
    error?: string
}

/**
 * Serviço de integração com Groq via OpenAI SDK
 * Processa mensagens com tool calling para executar comandos
 */

export class GroqService {
    private systemPrompt: string = `Você é um bot assistente amigável para o servidor de osu! Fubika. Você se chama Fubas.
Sempre responda em português (mesma língua do usuário).
Respostas CURTAS (máx 2 frases).
Se o usuário pedir um comando, use as ferramentas disponíveis.
Se for conversa normal, responda naturalmente.
Não execute comandos de admin ou ações destrutivas.
`

    constructor(customSystemPrompt?: string) {
        if (customSystemPrompt) {
            this.systemPrompt = customSystemPrompt
        }
    }

    /**
     * Processa uma mensagem com Groq e detecta tool calls
     */
    async processMessage(
        userMessage: string,
        tools: ToolDefinition[]
    ): Promise<ProcessMessageResult> {
        try {
            const messages: Message[] = [
                {
                    role: 'system',
                    content: this.systemPrompt
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ]

            const response = await groqClient.chat.completions.create({
                model: llmConfig.model,
                temperature: llmConfig.temperature,
                max_tokens: llmConfig.max_tokens,
                messages: messages,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: 'auto'
            })

            const choice = response.choices[0]

            // Verifica se há tool call
            if (choice?.message.tool_calls && choice.message.tool_calls.length > 0) {
                const toolCall = choice.message.tool_calls[0]

                if (toolCall) {
                    try {
                        const params = typeof (toolCall as any).function.arguments === 'string'
                            ? JSON.parse((toolCall as any).function.arguments)
                            : (toolCall as any).function.arguments

                        return {
                            toolCall: {
                                name: (toolCall as any).function.name,
                                params
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao parsear tool call arguments:', error)
                        return {
                            directResponse: 'Desculpe, houve um erro ao processar seu pedido.'
                        }
                    }
                }
            }

            // Se não há tool call, retorna resposta direta
            const responseText = choice?.message.content || ''

            return {
                directResponse: responseText
            }

        } catch (error: any) {
            console.error('Erro ao processar mensagem com Groq:', error)

            return {
                error: error.message || 'Erro ao processar sua mensagem. Tente novamente mais tarde.'
            }
        }
    }

    /**
     * Define um system prompt customizado
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt
    }
}

// Singleton instance
let groqServiceInstance: GroqService | null = null

export function initializeGroqService(customSystemPrompt?: string): GroqService {
    if (!groqServiceInstance) {
        groqServiceInstance = new GroqService(customSystemPrompt)
    }
    return groqServiceInstance
}

export function getGroqService(): GroqService {
    if (!groqServiceInstance) {
        groqServiceInstance = new GroqService()
    }
    return groqServiceInstance
}
