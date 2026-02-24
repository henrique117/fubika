import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('ioredis', () => {
    const mockRedis = {
        publish: vi.fn(),
        on: vi.fn(),
    }
    return { default: vi.fn(() => mockRedis) }
})

vi.mock('../src/utils/errorHandler', () => ({
    Errors: {
        Internal: (msg: string) => new Error(msg),
    },
}))

describe('sendIngameMessage', () => {
    let redisMock: { publish: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> }

    beforeEach(async () => {
        vi.resetModules()
        vi.clearAllMocks()

        const Redis = (await import('ioredis')).default as any
        redisMock = new Redis()
        redisMock.publish.mockReset()
    })

    it('publica no canal correto com payload JSON válido', async () => {
        redisMock.publish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')
        await sendIngameMessage(42, 'Bem-vindo ao servidor!')

        expect(redisMock.publish).toHaveBeenCalledWith(
            'api:notification',
            JSON.stringify({ target_id: 42, msg: 'Bem-vindo ao servidor!' })
        )
    })

    it('lança erro quando o Redis falha', async () => {
        redisMock.publish.mockRejectedValueOnce(new Error('conexão recusada'))

        const { sendIngameMessage } = await import('../src/utils/redis')

        await expect(sendIngameMessage(1, 'teste')).rejects.toThrow()
    })

    it('serializa corretamente userId e mensagem no payload', async () => {
        redisMock.publish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')
        await sendIngameMessage(999, 'score submetido!')

        const call = redisMock.publish.mock.calls[0]
        const payload = JSON.parse(call[1])

        expect(payload.target_id).toBe(999)
        expect(payload.msg).toBe('score submetido!')
    })

    it('funciona com userId 0', async () => {
        redisMock.publish.mockResolvedValueOnce(1)

        const { sendIngameMessage } = await import('../src/utils/redis')
        await expect(sendIngameMessage(0, 'msg')).resolves.not.toThrow()
    })
})