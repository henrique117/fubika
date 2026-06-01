








interface QueuedMessage {
    userId: string
    content: string
    messageId: string
    channelId: string
    resolve: (value: any) => void
    reject: (error: any) => void
}

class MessageQueue {
    private userQueues: Map<string, QueuedMessage[]> = new Map()
    private activeRequests: Set<string> = new Set() 
    private maxConcurrency: number = 10
    private timeout: number = 10000 

    constructor(maxConcurrency: number = 10, timeout: number = 10000) {
        this.maxConcurrency = maxConcurrency
        this.timeout = timeout
    }

    


    enqueueMessage(userId: string, content: string, messageId: string, channelId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const queuedMessage: QueuedMessage = {
                userId,
                content,
                messageId,
                channelId,
                resolve,
                reject
            }

            if (!this.userQueues.has(userId)) {
                this.userQueues.set(userId, [])
            }

            this.userQueues.get(userId)!.push(queuedMessage)

            
            this.processQueues()
        })
    }

    


    private async processQueues() {
        while (this.activeRequests.size < this.maxConcurrency) {
            
            let userWithMessages: string | null = null

            for (const [userId, queue] of this.userQueues) {
                if (queue.length > 0 && !this.activeRequests.has(userId)) {
                    userWithMessages = userId
                    break
                }
            }

            if (!userWithMessages) {
                break
            }

            const queue = this.userQueues.get(userWithMessages)!
            const message = queue.shift()!

            if (queue.length === 0) {
                this.userQueues.delete(userWithMessages)
            }

            
            this.activeRequests.add(message.userId)

            try {
                
                
                const result = await this.processMessageWithTimeout(message)
                message.resolve(result)
            } catch (error) {
                message.reject(error)
            } finally {
                this.activeRequests.delete(message.userId)
                
                this.processQueues()
            }
        }
    }

    


    private processMessageWithTimeout(message: QueuedMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout ao processar mensagem (${this.timeout}ms)`))
            }, this.timeout)

            // TODO: Integrar com groq.service.ts para processar a mensagem
            // Por enquanto, apenas resolvemos
            resolve({
                userId: message.userId,
                content: message.content,
                messageId: message.messageId,
                channelId: message.channelId,
            })

            clearTimeout(timeoutId)
        })
    }

    /**
     * Retorna número de requisições ativas
     */
    getCurrentConcurrency(): number {
        return this.activeRequests.size
    }

    /**
     * Retorna tamanho da fila de um usuário
     */
    getUserQueueSize(userId: string): number {
        return this.userQueues.get(userId)?.length ?? 0
    }

    /**
     * Retorna informações de debug
     */
    getStats() {
        return {
            activeConcurrency: this.activeRequests.size,
            maxConcurrency: this.maxConcurrency,
            userQueues: Array.from(this.userQueues.entries()).map(([userId, queue]) => ({
                userId,
                queueSize: queue.length
            }))
        }
    }
}

// Singleton instance
let queueInstance: MessageQueue | null = null

export function initializeQueue(maxConcurrency: number = 10, timeout: number = 10000): MessageQueue {
    if (!queueInstance) {
        queueInstance = new MessageQueue(maxConcurrency, timeout)
    }
    return queueInstance
}

export function getQueue(): MessageQueue {
    if (!queueInstance) {
        queueInstance = new MessageQueue()
    }
    return queueInstance
}
