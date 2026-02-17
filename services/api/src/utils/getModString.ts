export enum OsuMods {
    None           = 0,
    NoFail         = 1,
    Easy           = 2,
    TouchDevice    = 4,
    Hidden         = 8,
    HardRock       = 16,
    SuddenDeath    = 32,
    DoubleTime     = 64,
    Relax          = 128,
    HalfTime       = 256,
    Nightcore      = 512,
    Flashlight     = 1024,
    Autoplay       = 2048,
    SpunOut        = 4096,
    Relax2         = 8192,
    Perfect        = 16384,
    Key4           = 32768,
    Key5           = 65536,
    Key6           = 131072,
    Key7           = 262144,
    Key8           = 524288,
    FadeIn         = 1048576,
    Random         = 2097152,
    Cinema         = 4194304,
    Target         = 8388608,
    Key9           = 16777216,
    KeyCoop        = 33554432,
    Key1           = 67108864,
    Key3           = 134217728,
    Key2           = 268435456,
    ScoreV2        = 536870912,
    Mirror         = 1073741824,
}

export const getModString = (mods: number): string => {
    if (mods === 0) return "NM";

    const modParts: string[] = [];

    if (mods & OsuMods.NoFail) modParts.push("NF");
    if (mods & OsuMods.Easy) modParts.push("EZ");
    if (mods & OsuMods.TouchDevice) modParts.push("TD");
    if (mods & OsuMods.Hidden) modParts.push("HD");
    if (mods & OsuMods.HardRock) modParts.push("HR");
    
    if (mods & OsuMods.Perfect) {
        modParts.push("PF");
    } else if (mods & OsuMods.SuddenDeath) {
        modParts.push("SD");
    }

    if (mods & OsuMods.Nightcore) {
        modParts.push("NC");
    } else if (mods & OsuMods.DoubleTime) {
        modParts.push("DT");
    }

    if (mods & OsuMods.HalfTime) modParts.push("HT");
    if (mods & OsuMods.Flashlight) modParts.push("FL");
    if (mods & OsuMods.SpunOut) modParts.push("SO");
    
    if (mods & OsuMods.Relax) modParts.push("RX");
    if (mods & OsuMods.Relax2) modParts.push("AP");
    if (mods & OsuMods.Autoplay) modParts.push("AT");
    if (mods & OsuMods.Cinema) modParts.push("CN");
    if (mods & OsuMods.ScoreV2) modParts.push("V2");
    if (mods & OsuMods.Mirror) modParts.push("MR");

    if (mods & OsuMods.Key1) modParts.push("1K");
    if (mods & OsuMods.Key2) modParts.push("2K");
    if (mods & OsuMods.Key3) modParts.push("3K");
    if (mods & OsuMods.Key4) modParts.push("4K");
    if (mods & OsuMods.Key5) modParts.push("5K");
    if (mods & OsuMods.Key6) modParts.push("6K");
    if (mods & OsuMods.Key7) modParts.push("7K");
    if (mods & OsuMods.Key8) modParts.push("8K");
    if (mods & OsuMods.Key9) modParts.push("9K");
    if (mods & OsuMods.FadeIn) modParts.push("FI");
    if (mods & OsuMods.Random) modParts.push("RD");

    return modParts.join("");
};