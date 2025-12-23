import IBeatmap from "./beatmap.interface";
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

    play_time: Date;

    beatmap: Omit<IBeatmap, 'scores'>

    player: IPlayer;
}