import { describe, it, expect } from 'vitest'
import { getModString, OsuMods } from '../src/utils/getModString'

describe('getModString', () => {
    it('retorna "NM" quando mods é 0', () => {
        expect(getModString(0)).toBe('NM')
    })

    it('retorna "HD" para Hidden', () => {
        expect(getModString(OsuMods.Hidden)).toBe('HD')
    })

    it('retorna "HDHR" para Hidden + HardRock', () => {
        expect(getModString(OsuMods.Hidden | OsuMods.HardRock)).toBe('HDHR')
    })

    it('retorna "HDDT" para Hidden + DoubleTime (sem Nightcore)', () => {
        expect(getModString(OsuMods.Hidden | OsuMods.DoubleTime)).toBe('HDDT')
    })

    it('retorna "HDNC" para Hidden + Nightcore (NC tem prioridade sobre DT)', () => {
        expect(getModString(OsuMods.Hidden | OsuMods.Nightcore | OsuMods.DoubleTime)).toBe('HDNC')
    })

    it('retorna "PF" e não "SD" quando ambos estão ativos (PF tem prioridade)', () => {
        const mods = OsuMods.Perfect | OsuMods.SuddenDeath
        expect(getModString(mods)).toContain('PF')
        expect(getModString(mods)).not.toContain('SD')
    })

    it('retorna "SD" quando só SuddenDeath está ativo', () => {
        expect(getModString(OsuMods.SuddenDeath)).toBe('SD')
    })

    it('retorna "RX" para Relax', () => {
        expect(getModString(OsuMods.Relax)).toBe('RX')
    })

    it('retorna "AP" para Relax2 (Autopilot)', () => {
        expect(getModString(OsuMods.Relax2)).toBe('AP')
    })

    it('retorna "V2" para ScoreV2', () => {
        expect(getModString(OsuMods.ScoreV2)).toBe('V2')
    })

    it('retorna "HDDTFL" para Hidden + DoubleTime + Flashlight', () => {
        expect(getModString(OsuMods.Hidden | OsuMods.DoubleTime | OsuMods.Flashlight)).toBe('HDDTFL')
    })

    it('retorna "EZ" para Easy', () => {
        expect(getModString(OsuMods.Easy)).toBe('EZ')
    })

    it('retorna "HT" para HalfTime', () => {
        expect(getModString(OsuMods.HalfTime)).toBe('HT')
    })

    it('retorna "4K" para Key4', () => {
        expect(getModString(OsuMods.Key4)).toBe('4K')
    })

    it('retorna "9K" para Key9', () => {
        expect(getModString(OsuMods.Key9)).toBe('9K')
    })

    it('retorna "MR" para Mirror', () => {
        expect(getModString(OsuMods.Mirror)).toBe('MR')
    })

    it('retorna "NF" para NoFail', () => {
        expect(getModString(OsuMods.NoFail)).toBe('NF')
    })

    it('lida com combinação complexa: NFHDHRDTFL', () => {
        const mods = OsuMods.NoFail | OsuMods.Hidden | OsuMods.HardRock | OsuMods.DoubleTime | OsuMods.Flashlight
        const result = getModString(mods)
        expect(result).toContain('NF')
        expect(result).toContain('HD')
        expect(result).toContain('HR')
        expect(result).toContain('DT')
        expect(result).toContain('FL')
    })
})