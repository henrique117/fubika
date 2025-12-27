import { EMOJIS } from "../../constants"

const gradeMap: Record<string, string> = {
    'XH': EMOJIS.rankXH,
    'X':  EMOJIS.rankX,
    'SH': EMOJIS.rankSH,
    'S':  EMOJIS.rankS,
    'A':  EMOJIS.rankA,
    'B':  EMOJIS.rankB,
    'C':  EMOJIS.rankC,
    'D':  EMOJIS.rankD,
    'F':  EMOJIS.rankF
}

export function scoreGradeToEmoji(scoreGrade: string): string {
    return gradeMap[scoreGrade] ?? '';
}

export function applyModsToStats(bpm: number, lengthSeconds: number, mods: string) {
    let speedMultiplier = 1

    if (mods.includes('DT') || mods.includes('NC')) {
        speedMultiplier = 1.5
    } else if (mods.includes('HT')) {
        speedMultiplier = 0.75
    }

    return {
        bpm: Math.round(bpm * speedMultiplier),
        length: Math.round(lengthSeconds / speedMultiplier)
    };
}


export function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const min = Math.floor((seconds % 3600) / 60)
    const sec = seconds % 60

    const pad = (num: number): string => num.toString().padStart(2, '0')

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(min)}:${pad(sec)}`
    }

    return `${pad(min)}:${pad(sec)}`
}


export function capitalizeFirstLetter(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}