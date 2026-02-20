export const GUILD_CONFIG = {
    guild_id: "1450592028147712173",
    roles: {
        verificado: "1450593806079623168"
    },
    channels: {
        fubas_logs: "1450644955830943877",
        top_scores: "1463956240978673979"
    }
} as const

export const REGEX = {
    osuUrl: /(?:https?:\/\/)?osu\.ppy\.sh\/(?:b\/|beatmaps\/|beatmapsets\/\d+#(?:osu|taiko|fruits|mania)\/)(\d+)/,
    fubikaUrl: /(?:https?:\/\/)?fubika\.com\.br\/beatmap\/(\d+)/,
    rawId: /^\d+$/
}

export const URLS = {
    fubikaIcon: "https://i.imgur.com/F7FEYaG.png",
    std: "https://i.imgur.com/jhR2Swe.png",
    taiko: "https://i.imgur.com/D0asi8p.png",
    ctb: "https://i.imgur.com/FOA0rJP.png",
    mania: "https://i.imgur.com/aqP3Yjt.png",
    greenDot: "https://www.freepnglogos.com/uploads/dot-png/green-dot-clip-art-clkerm-vector-clip-art-online-10.png",
    redDot: "https://www.freepnglogos.com/uploads/dot-png/red-glossy-dot-clip-art-clkerm-vector-clip-art-18.png"
} as const

export const EMOJIS = {
    // Ranks
    rankXH: "<:rankingXHsmall2x:1451026695569281146>",
    rankX: "<:rankingXsmall2x:1451026724513906698>",
    rankSH: "<:rankingSHsmall2x:1451026620310753382>",
    rankS: "<:rankingSsmall2x:1451026644579127476>",
    rankA: "<:rankingAsmall2x:1451026496968986795>",
    rankB: "<:rankingBsmall2x:1451026536512753727>",
    rankC: "<:rankingCsmall2x:1451026570037956698>",
    rankD: "<:rankingDsmall2x:1451026596986355803>",
    rankF: "<:rankingFsmall2x:1453913665278316626>",

    // Others
    miss: "<:miss:1451028123553497281>",
    bpm: "<:bpm:1454506365614555240>"
} as const

export const COLORS = { // Cores utilizadas no fubika
    purple: "#773887",
    dark_blue: "#436990",
    blue: "#4189D3", 
    cyan: "#41D3BD",
    white: "#FFFFFF",
    black: "#191715",
    brown: "#2C2825"
} as const