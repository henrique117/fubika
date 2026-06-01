




interface ErrorContext {
    toolName?: string
    params?: Record<string, any>
    originalError?: string
}

export class ErrorFormatter {
    


    private static errorMap: Record<string, { message: string; suggestion?: string }> = {
        
        'não encontrado': {
            message: 'Ops! Não encontrei esse jogador.',
            suggestion: 'Verifique o nome e tente novamente, ou use `/ranking` para explorar.'
        },
        'Not Found': {
            message: 'Ops! Não encontrei esse jogador no ranking.',
            suggestion: 'Tente usar `/ranking` para ver o placar ou verificar o nome.'
        },
        'USER_NOT_FOUND': {
            message: 'Ops! Não achei o jogador mencionado.',
            suggestion: 'Verifique se o nome está correto ou use `/ranking`.'
        },
        'PLAYER_NOT_FOUND': {
            message: 'Ops! Não encontrei esse jogador.',
            suggestion: 'Talvez ele não tenha plays recentes ou o nome está errado.'
        },
        'Usuário não encontrado': {
            message: 'Ops! Não encontrei esse jogador.',
            suggestion: 'Verifique o nome e tente novamente.'
        },

        
        'index válido': {
            message: 'Ops! O número que você pediu não é válido.',
            suggestion: 'Use um número entre 1 e 200 para as scores recentes.'
        },

        
        'BEATMAP_NOT_FOUND': {
            message: 'Ops! Não encontrei esse mapa.',
            suggestion: 'Verifique o ID do mapa ou tente procurar novamente.'
        },
        'INVALID_BEATMAP_ID': {
            message: 'Ops! O ID do mapa não é válido.',
            suggestion: 'Use um número válido ou tente `/leaderboard` com outro mapa.'
        },

        
        'Unauthorized': {
            message: 'Você não tem permissão para acessar isso.',
            suggestion: 'Entre em contato com um admin se achar que isso é um erro.'
        },
        '401': {
            message: 'Autenticação falhou.',
            suggestion: 'Tente novamente mais tarde.'
        },

        
        'Timeout': {
            message: 'Demorou muito para buscar os dados... 😅',
            suggestion: 'Tente novamente em alguns segundos.'
        },
        'ECONNREFUSED': {
            message: 'Não consegui conectar ao servidor agora.',
            suggestion: 'Tente novamente em alguns instantes.'
        },
        'ENOTFOUND': {
            message: 'Problema de conexão com o servidor.',
            suggestion: 'Tente novamente mais tarde.'
        },
        'Network Error': {
            message: 'Problema de rede.',
            suggestion: 'Verifique sua conexão e tente novamente.'
        },

        
        'Invalid argument': {
            message: 'Ops! Algo está errado no comando.',
            suggestion: 'Verifique o formato e tente novamente.'
        },
        'INVALID_PARAMS': {
            message: 'Os parâmetros não são válidos.',
            suggestion: 'Revise o comando e tente novamente.'
        },

        
        '500': {
            message: 'Algo deu errado no servidor. 😕',
            suggestion: 'Tente novamente em alguns instantes.'
        },
        'Internal Server Error': {
            message: 'Erro no servidor. Não foi culpa sua!',
            suggestion: 'Tente novamente mais tarde.'
        }
    }

    






    static elaborate(
        error: string | undefined | null,
        originalMessage?: string,
        context?: ErrorContext
    ): string {
        if (!error) {
            return 'Ops! Algo deu errado, mas não tenho detalhes. Tente novamente.'
        }

        
        console.error(`[ErrorFormatter] Error: ${error}, Message: ${originalMessage}`, context)

        // Procura match exato
        if (this.errorMap[error]) {
            return this.formatMessage(this.errorMap[error])
        }

        // Procura match parcial (contains)
        for (const [key, value] of Object.entries(this.errorMap)) {
            if (error.includes(key) || originalMessage?.includes(key)) {
                return this.formatMessage(value)
            }
        }

        // Fallback: extrai informação útil da mensagem original
        if (originalMessage && originalMessage.length < 100) {
            return `Ops! ${originalMessage} Tente novamente.`
        }

        return 'Ops! Algo deu errado. Tente novamente em alguns segundos.'
    }

    /**
     * Formata a resposta do erro com sugestão (se houver)
     */
    private static formatMessage(error: { message: string; suggestion?: string }): string {
        if (error.suggestion) {
            return `${error.message}\n💡 ${error.suggestion}`
        }
        return error.message
    }

    /**
     * Trata erros de resposta HTTP
     */
    static elaborateHttpError(status: number, _data?: any): string {
        const statusMap: Record<number, { message: string; suggestion?: string }> = {
            400: {
                message: 'Requisição inválida.',
                suggestion: 'Verifique os parâmetros do comando.'
            },
            401: {
                message: 'Não autorizado.',
                suggestion: 'Você não tem permissão para isso.'
            },
            403: {
                message: 'Acesso proibido.',
                suggestion: 'Entre em contato com um admin.'
            },
            404: {
                message: 'Não encontrado.',
                suggestion: 'Verifique se o nome ou ID está correto.'
            },
            429: {
                message: 'Muitas requisições! Calma aí! 😅',
                suggestion: 'Aguarde alguns segundos e tente novamente.'
            },
            500: {
                message: 'Erro no servidor.',
                suggestion: 'Tente novamente em alguns instantes.'
            },
            503: {
                message: 'Servidor indisponível.',
                suggestion: 'O servidor está em manutenção. Tente mais tarde.'
            }
        }

        const error = statusMap[status] || {
            message: `Erro ${status} ao buscar dados.`,
            suggestion: 'Tente novamente.'
        }

        return this.formatMessage(error)
    }

    /**
     * Trata erros de execução de tools
     */
    static elaborateToolError(
        toolName: string,
        error: string | undefined,
        message?: string
    ): string {
        // Erros específicos de tool
        const toolErrorMap: Record<string, string> = {
            'user_profile': 'Jogador não encontrado.',
            'recent_scores': 'Não consegui buscar as scores recentes.',
            'top_scores': 'Não consegui buscar as melhores scores.',
            'leaderboard': 'Não consegui buscar o leaderboard.',
            'ranking': 'Não consegui buscar o ranking.',
            'compare_scores': 'Não consegui comparar as scores.'
        }

        // Se for erro genérico, tenta format normal
        const elaborated = this.elaborate(error, message)
        if (elaborated.includes('Ops!')) {
            return elaborated
        }

        // Se tem erro específico de tool, adiciona contexto
        const toolError = toolErrorMap[toolName]
        if (toolError) {
            return `${toolError} ${elaborated}`
        }

        return elaborated
    }
}
