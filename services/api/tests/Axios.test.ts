import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', async () => {
    const mockAxiosInstance = {
        post: vi.fn(),
        get: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    }

    return {
        default: {
            create: vi.fn(() => mockAxiosInstance),
        },
        __mockInstance: mockAxiosInstance,
    }
})

vi.mock('../src/utils/errorHandler', () => ({
    Errors: {
        Internal: (msg: string) => Object.assign(new Error(msg), { statusCode: 500 }),
        NotFound: (msg: string) => Object.assign(new Error(msg), { statusCode: 404 }),
        Unauthorized: (msg: string) => Object.assign(new Error(msg), { statusCode: 401 }),
    },
}))

describe('getApiAuthToken', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    it('obtém e armazena o token em cache', async () => {
        const mockAxios = (await import('axios')) as any
        const instance = mockAxios.__mockInstance

        instance.post.mockResolvedValueOnce({
            data: { access_token: 'token_abc123', expires_in: 86400 },
        })
        instance.interceptors.request.use.mockImplementation(() => { })
        instance.interceptors.response.use.mockImplementation(() => { })

        const { getApiAuthToken } = await import('../src/utils/axios')
        const token = await getApiAuthToken()

        expect(token).toBe('token_abc123')
        expect(instance.post).toHaveBeenCalledTimes(1)
    })

    it('usa o token em cache na segunda chamada (sem novo request)', async () => {
        const mockAxios = (await import('axios')) as any
        const instance = mockAxios.__mockInstance

        instance.post.mockResolvedValueOnce({
            data: { access_token: 'token_cached', expires_in: 86400 },
        })
        instance.interceptors.request.use.mockImplementation(() => { })
        instance.interceptors.response.use.mockImplementation(() => { })

        const { getApiAuthToken } = await import('../src/utils/axios')
        await getApiAuthToken()
        await getApiAuthToken()

        expect(instance.post).toHaveBeenCalledTimes(1)
    })

    it('lança erro interno quando a autenticação falha', async () => {
        const mockAxios = (await import('axios')) as any
        const instance = mockAxios.__mockInstance

        instance.post.mockRejectedValueOnce({
            response: { data: { error: 'invalid_client' } },
            message: 'Request failed',
        })
        instance.interceptors.request.use.mockImplementation(() => { })
        instance.interceptors.response.use.mockImplementation(() => { })

        const { getApiAuthToken } = await import('../src/utils/axios')

        await expect(getApiAuthToken()).rejects.toThrow()
    })

    it('não faz duas requisições simultâneas (deduplicação de tokenRequest)', async () => {
        const mockAxios = (await import('axios')) as any
        const instance = mockAxios.__mockInstance

        let resolvePost: (val: any) => void
        const delayed = new Promise((res) => { resolvePost = res })

        instance.post.mockReturnValueOnce(delayed)
        instance.interceptors.request.use.mockImplementation(() => { })
        instance.interceptors.response.use.mockImplementation(() => { })

        const { getApiAuthToken } = await import('../src/utils/axios')

        const p1 = getApiAuthToken()
        const p2 = getApiAuthToken()

        resolvePost!({ data: { access_token: 'token_dedup', expires_in: 86400 } })

        const [t1, t2] = await Promise.all([p1, p2])
        expect(t1).toBe('token_dedup')
        expect(t2).toBe('token_dedup')
        expect(instance.post).toHaveBeenCalledTimes(1)
    })
})