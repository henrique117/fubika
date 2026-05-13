import { Events, Message } from 'discord.js'

import {
    getGroqService
} from '@/services/llm/groq.service'

import {
    getQueue
} from '@/services/llm/queue.service'

import {
    allTools,
    executeTool
} from '@/services/mcp-tools'

import { ErrorFormatter } from '@/services/errorFormatter'

/**
 * Preprocessa o texto para extrair menções Discord
 * Converte <@ID> em {@username} e retorna o userName extraído
 */
function preprocessMentions(
    text: string
): { processedText: string; userName?: string } {
    const mentionRegex = /<@!?(\d+)>/g

    let userName: string | undefined
    let match

    // Extrair primeira menção (ID do usuário mencionado)
    while ((match = mentionRegex.exec(text)) !== null) {
        const userId = match[1]
        // Por enquanto, usar o ID como placeholder
        // Em uma versão futura, poderia resolver para o nome via API
        text = text.replace(match[0], `{@user:${userId}}`)
        if (!userName) {
            userName = userId // Usar ID como fallback
        }
    }

    // Também buscar @username (text mentions)
    const textMentionRegex = /@(\w+)/g
    while ((match = textMentionRegex.exec(text)) !== null) {
        const username = match[1]
        if (!userName) {
            userName = username
        }
    }

    return { processedText: text, userName }
}

export default {
    name: Events.MessageCreate,

    once: false,

    async execute(message: Message) {

        if (message.author.bot) return

        if (message.channel.isDMBased()) return

        if (!message.mentions.has(message.client.user!)) return

        try {

            const contentWithoutMention =
                message.content
                    .replace(
                        new RegExp(
                            `<@!?${message.client.user!.id}>`,
                            'g'
                        ),
                        ''
                    )
                    .trim()

            if (!contentWithoutMention) {

                await message.reply({
                    content:
                        '👋 Me mencione com alguma mensagem! Posso ajudar com comandos do osu! ou responder perguntas simples.'
                })

                return
            }

            await message.channel.sendTyping()

            await processMessageWithQueue(
                message,
                contentWithoutMention
            )

        } catch (error) {

            console.error(
                '[AI] Erro ao processar mensagem:',
                error
            )

            try {

                await message.reply({
                    content:
                        'Desculpe, ocorreu um erro ao processar sua mensagem.'
                })

            } catch (replyError) {

                console.error(
                    '[AI] Erro ao responder:',
                    replyError
                )
            }
        }
    }
}

async function processMessageWithQueue(
    message: Message,
    userMessage: string
) {

    const queue = getQueue()

    const groqService =
        getGroqService()

    // Preprocessar menções
    const { processedText, userName } =
        preprocessMentions(userMessage)

    queue.enqueueMessage(
        message.author.id,
        processedText,
        message.id,
        message.channelId
    )

    .then(async () => {

        try {

            const result =
                await groqService.processMessage(
                    processedText,
                    allTools,
                    userName || message.author.username
                )

            if (result.error) {

                const elaboratedError =
                    ErrorFormatter.elaborate(
                        result.error,
                        result.error
                    )

                await message.reply({
                    content: elaboratedError
                })

                return
            }

            if (result.toolCall) {

                await handleToolCall(
                    message,
                    result.toolCall
                )

                return
            }

            if (result.directResponse) {

                const response =
                    result.directResponse
                        .substring(0, 2000)

                await message.reply({
                    content: response
                })

                return
            }

        } catch (error) {

            console.error(
                '[AI] Erro ao processar com Groq:',
                error
            )

            const elaboratedError =
                ErrorFormatter.elaborate(
                    String(error),
                    error instanceof Error ? error.message : String(error)
                )

            await message.reply({
                content: elaboratedError
            })
        }

    })

    .catch(async (error) => {

        console.error(
            '[AI] Erro na queue:',
            error
        )

        await message.reply({
            content:
                '⚠️ Muitas requisições no momento. Tente novamente em alguns segundos.'
        })
    })
}

async function handleToolCall(
    message: Message,

    toolCall: {
        name: string
        params: Record<string, any>
    }
) {

    try {

        const blockedTools = [
            'generateApiKey',
            'sendInvite'
        ]

        if (
            blockedTools.includes(
                toolCall.name
            )
        ) {

            await message.reply({
                content:
                    `⛔ O comando \`${toolCall.name}\` só pode ser usado via slash command.`
            })

            return
        }

        const result =
            await executeTool(
                toolCall.name,
                toolCall.params,
                message.author.id
            )

        if (!result.success) {

            const elaboratedError =
                ErrorFormatter.elaborateToolError(
                    toolCall.name,
                    result.error,
                    result.message
                )

            await message.reply({
                content: elaboratedError
            })

            return
        }

        if (result.embed) {

            await message.reply({
                embeds: [result.embed]
            })

            return
        }

        if (result.embeds) {

            await message.reply({
                embeds:
                    result.embeds.slice(0, 10)
            })

            return
        }

        if (result.message) {

            await message.reply({
                content: result.message
            })

            return
        }

    } catch (error) {

        console.error(
            '[AI] Erro ao executar tool:',
            error
        )

        await message.reply({
            content:
                'Desculpe, ocorreu um erro ao executar esse comando.'
        })
    }
}