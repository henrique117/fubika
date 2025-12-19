import IPlayer from "./player.interface";

export default interface IScore {
    id: number;
    score: number;
    acc: number;
    mods_int: number;
    mods: string;
    n300: number;
    n100: number;
    n50: number;
    nmiss: number;
    grade: number;      // F = 0, D = 1, C = 2, B = 3, A = 4, S = 5, SS = 6, SH = 7, SSH = 8
    perfect: boolean;
    max_combo: number;

    map_md5: string;

    player: IPlayer;
}