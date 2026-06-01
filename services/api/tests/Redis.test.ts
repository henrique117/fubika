import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPublish = vi.fn()

vi.mock('ioredis', () => ({
    default: class Redis {
        publish = mockPublish
        on = vi.fn()
    }
}))

vi.mock('../src/utils/errorHandler', () => ({
    Errors: {
        Internal: (msg: string) => ({ statusCode: 500, message: msg })
    }
}))

describe('sendIngameMessage', () => {
    beforeEach(() => {
        mockPublish.mockReset()
    })

    it('publica no canal correto com payload JSON válido', async () => {
        mockPublish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')

        await sendIngameMessage(42, 'Olá jogador!')

        expect(mockPublish).toHaveBeenCalledOnce()
        expect(mockPublish).toHaveBeenCalledWith(
            'api:notification',
            JSON.stringify({ target_id: 42, msg: 'Olá jogador!' })
        )
    })

    it('lança erro quando o Redis falha', async () => {
        mockPublish.mockRejectedValueOnce(new Error('Redis down'))

        const { sendIngameMessage } = await import('../src/utils/redis')

        await expect(sendIngameMessage(1, 'teste')).rejects.toMatchObject({
            statusCode: 500
        })
    })

    it('serializa corretamente userId e mensagem no payload', async () => {
        mockPublish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')
        await sendIngameMessage(99, 'mensagem teste')

        const [, payload] = mockPublish.mock.calls[0]
        const parsed = JSON.parse(payload)

        expect(parsed.target_id).toBe(99)
        expect(parsed.msg).toBe('mensagem teste')
    })

    it('funciona com userId 0', async () => {
        mockPublish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')
        await sendIngameMessage(0, 'msg')

        const [, payload] = mockPublish.mock.calls[0]
        expect(JSON.parse(payload).target_id).toBe(0)
    })
})