import { describe, it, expect } from 'vitest'
import { calculateLevel, getRequiredScoreForLevel } from '../src/utils/level'

describe('getRequiredScoreForLevel', () => {
    it('level 1 requer 0 ou muito pouco score', () => {
        expect(getRequiredScoreForLevel(1)).toBeGreaterThanOrEqual(0)
    })

    it('score requerido aumenta progressivamente com o level', () => {
        for (let lvl = 1; lvl < 100; lvl++) {
            expect(getRequiredScoreForLevel(lvl + 1)).toBeGreaterThan(
                getRequiredScoreForLevel(lvl)
            )
        }
    })

    it('level 60 usa fórmula com fator exponencial (1.8^n)', () => {
        const score60 = getRequiredScoreForLevel(60)
        const score59 = getRequiredScoreForLevel(59)
        expect(score60 - score59).toBeGreaterThan(0)
    })

    it('level 100 usa fórmula base correta', () => {
        expect(getRequiredScoreForLevel(100)).toBeCloseTo(26931190829, -3)
    })

    it('level 101 é exatamente level 100 + 100000000000', () => {
        const l100 = getRequiredScoreForLevel(100)
        const l101 = getRequiredScoreForLevel(101)
        expect(l101 - l100).toBe(100000000000)
    })

    it('levels acima de 100 crescem linearmente em 100B por level', () => {
        for (let lvl = 100; lvl < 110; lvl++) {
            const diff = getRequiredScoreForLevel(lvl + 1) - getRequiredScoreForLevel(lvl)
            expect(diff).toBe(100000000000)
        }
    })
})

describe('calculateLevel', () => {
    it('score 0 retorna level 1 (com progresso ~0)', () => {
        const level = calculateLevel(0)
        expect(Math.floor(level)).toBe(1)
    })

    it('retorna um número com parte fracionária (progresso dentro do level)', () => {
        const level = calculateLevel(1000000)
        expect(level % 1).toBeGreaterThanOrEqual(0)
        expect(level % 1).toBeLessThan(1)
    })

    it('progresso aumenta conforme o score aumenta dentro do mesmo level', () => {
        const level1 = calculateLevel(1000)
        const level2 = calculateLevel(2000)
        expect(level2).toBeGreaterThan(level1)
    })

    it('atingir exatamente o score do próximo level avança o level inteiro', () => {
        const scoreForLevel5 = getRequiredScoreForLevel(5)
        const level = calculateLevel(scoreForLevel5)
        expect(Math.floor(level)).toBeGreaterThanOrEqual(5)
    })

    it('score muito alto retorna level acima de 100', () => {
        const scoreFor101 = getRequiredScoreForLevel(101)
        const level = calculateLevel(scoreFor101)
        expect(Math.floor(level)).toBeGreaterThanOrEqual(101)
    })

    it('parte fracionária está sempre entre 0 e 1', () => {
        const testScores = [0, 5000, 100000, 999999, 26931190829, 126931190829]
        for (const score of testScores) {
            const level = calculateLevel(score)
            const fraction = level % 1
            expect(fraction).toBeGreaterThanOrEqual(0)
            expect(fraction).toBeLessThan(1)
        }
    })
})