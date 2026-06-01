import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../src/utils/hash'

describe('hashPassword', () => {
    it('retorna uma string não vazia', async () => {
        const hash = await hashPassword('senha123')
        expect(typeof hash).toBe('string')
        expect(hash.length).toBeGreaterThan(0)
    })

    it('retorna um hash bcrypt válido (começa com $2)', () => {
        return hashPassword('teste').then((hash) => {
            expect(hash).toMatch(/^\$2[ab]\$/)
        })
    })

    it('dois hashes da mesma senha são diferentes (salt aleatório)', async () => {
        const hash1 = await hashPassword('minhaSenha')
        const hash2 = await hashPassword('minhaSenha')
        expect(hash1).not.toBe(hash2)
    })

    it('senhas diferentes geram hashes diferentes', async () => {
        const hash1 = await hashPassword('senha1')
        const hash2 = await hashPassword('senha2')
        expect(hash1).not.toBe(hash2)
    })
})

describe('verifyPassword', () => {
    it('retorna true para senha correta', async () => {
        const password = 'minhasenhasecreta'
        const hash = await hashPassword(password)
        const result = await verifyPassword(password, hash)
        expect(result).toBe(true)
    })

    it('retorna false para senha errada', async () => {
        const hash = await hashPassword('senhaCorreta')
        const result = await verifyPassword('senhaErrada', hash)
        expect(result).toBe(false)
    })

    it('retorna false para string vazia', async () => {
        const hash = await hashPassword('senhaComConteudo')
        const result = await verifyPassword('', hash)
        expect(result).toBe(false)
    })

    it('verifica corretamente após múltiplos hashes', async () => {
        const passwords = ['abc123', 'admin', 'Test@1234', '!@#$%']
        for (const pw of passwords) {
            const hash = await hashPassword(pw)
            expect(await verifyPassword(pw, hash)).toBe(true)
            expect(await verifyPassword(pw + 'x', hash)).toBe(false)
        }
    })

    it('é case-sensitive', async () => {
        const hash = await hashPassword('Senha')
        expect(await verifyPassword('senha', hash)).toBe(false)
        expect(await verifyPassword('SENHA', hash)).toBe(false)
        expect(await verifyPassword('Senha', hash)).toBe(true)
    })
})