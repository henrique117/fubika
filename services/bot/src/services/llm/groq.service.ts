import { groqClient, llmConfig, getSystemPrompt } from '@/config/llm.config'

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

export class GroqService {
    private baseSystemPrompt: string

    constructor(customSystemPrompt?: string) {
        if (customSystemPrompt) {
            this.baseSystemPrompt = customSystemPrompt
        } else {
            this.baseSystemPrompt = getSystemPrompt()
        }
    }

    async processMessage(
        userMessage: string,
        tools: ToolDefinition[],
        userName?: string
    ): Promise<ProcessMessageResult> {
        try {
            const systemPrompt = this.baseSystemPrompt.includes('📋')
                ? this.baseSystemPrompt
                : getSystemPrompt(userName)

            const messages: Message[] = [
                {
                    role: 'system',
                    content: systemPrompt
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

    setSystemPrompt(prompt: string): void {
        this.baseSystemPrompt = prompt
    }
}

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

