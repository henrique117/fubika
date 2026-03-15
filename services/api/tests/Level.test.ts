import { describe, it, expect } from 'vitest'
import { getRequiredScoreForLevel, calculateLevel } from '../src/utils/level'

describe('getRequiredScoreForLevel', () => {
    it('level 1 requer 0 ou muito pouco score', () => {
        expect(getRequiredScoreForLevel(1)).toBeCloseTo(0, -5)
    })

    it('score requerido aumenta progressivamente com o level', () => {
        for (let i = 2; i <= 10; i++) {
            expect(getRequiredScoreForLevel(i)).toBeGreaterThan(getRequiredScoreForLevel(i - 1))
        }
    })

    it('level 60 usa fórmula com fator exponencial (1.8^n)', () => {
        const score = getRequiredScoreForLevel(60)
        const poly = (5000 / 3) * (4 * Math.pow(60, 3) - 3 * Math.pow(60, 2) - 60)
        expect(score).toBeGreaterThan(poly)
    })

    it('level 100 usa fórmula base correta', () => {
        const score = getRequiredScoreForLevel(100)
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThan(getRequiredScoreForLevel(101))
    })

    it('level 101 é exatamente level 100 + 100000000000', () => {
        const l100 = getRequiredScoreForLevel(100)
        const l101 = getRequiredScoreForLevel(101)
        expect(l101 - l100).toBeCloseTo(100000000000, -3)
    })

    it('levels acima de 100 crescem linearmente em 100B por level', () => {
        for (let lvl = 100; lvl < 110; lvl++) {
            const diff = getRequiredScoreForLevel(lvl + 1) - getRequiredScoreForLevel(lvl)
            expect(diff).toBeCloseTo(100000000000, -3)
        }
    })

    it('score 0 retorna level 1 (com progresso ~0)', () => {
        const level = calculateLevel(0)
        expect(Math.floor(level)).toBe(1)
    })

    it('retorna um número com parte fracionária (progresso dentro do level)', () => {
        const level = calculateLevel(1000)
        expect(level % 1).toBeGreaterThan(0)
    })

    it('progresso aumenta conforme o score aumenta dentro do mesmo level', () => {
        const l1 = calculateLevel(1000)
        const l2 = calculateLevel(5000)
        expect(l2).toBeGreaterThan(l1)
    })

    it('atingir exatamente o score do próximo level avança o level inteiro', () => {
        const scoreForLevel5 = getRequiredScoreForLevel(5)
        const level = calculateLevel(scoreForLevel5)
        expect(Math.floor(level)).toBe(5)
    })

    it('score muito alto retorna level acima de 100', () => {
        const bigScore = getRequiredScoreForLevel(150)
        const level = calculateLevel(bigScore)
        expect(Math.floor(level)).toBe(150)
    })

    it('parte fracionária está sempre entre 0 e 1', () => {
        [0, 100, 1000, 999999, 1e10, 1e13].forEach(score => {
            const level = calculateLevel(score)
            expect(level % 1).toBeGreaterThanOrEqual(0)
            expect(level % 1).toBeLessThan(1)
        })
    })
})