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

    queue.enqueueMessage(
        message.author.id,
        userMessage,
        message.id,
        message.channelId
    )

    .then(async () => {

        try {

            const result =
                await groqService.processMessage(
                    userMessage,
                    allTools
                )

            if (result.error) {

                await message.reply({
                    content: result.error
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

            await message.reply({
                content:
                    'Desculpe, houve um erro ao processar sua mensagem.'
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

            await message.reply({
                content:
                    result.message ||
                    result.error ||
                    'Erro ao executar comando.'
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