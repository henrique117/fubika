import IPlayer from "./player.interface";

export default interface IScore {
    id: number;
    pp: number;
    score: number;
    acc: number;
    mods_int: number;
    mods: string;
    n300: number;
    n100: number;
    n50: number;
    nmiss: number;
    grade: string;
    perfect: boolean;
    max_combo: number;

    map_md5: string;

    player: IPlayer;
}