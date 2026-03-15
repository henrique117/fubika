import prisma from "../../utils/prisma";
import IPlayer from "../../interfaces/player.interface";
import { GetGlobalRankInput } from "./ranking.schema";
import { getPlayerPlaycount } from "../user/user.service";
import { calculateLevel } from "../../utils/level";
import { Errors } from "../../utils/errorHandler";

export const getGlobalLeaderboard = async (input: GetGlobalRankInput): Promise<IPlayer[]> => {
    const itemsPerPage = 50;
    const { page, mode } = input;
    
    if (page < 1) {
        throw Errors.BadRequest("A página deve ser maior ou igual a 1.");
    }
    
    const leaderboardRaw = await prisma.stats.findMany({
        where: {
            mode: mode,
            pp: { gt: 0 },
            user: {
                priv: { gt: 0 }
            }
        },
        orderBy: {
            pp: 'desc'
        },
        take: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
        include: {
            user: true
        }
    });

    if (!leaderboardRaw.length) {
        return [];
    }

    return await Promise.all(leaderboardRaw.map(async (row, index) => {
        const currentRank = ((page - 1) * itemsPerPage) + index + 1;
        const totalScoreNumber = Number(row.tscore);

        return {
            id: row.user.id,
            name: row.user.name,
            safe_name: row.user.safe_name,
            pfp: `https://a.${process.env.DOMAIN}/${row.user.id}`,
            banner: `https://assets.${process.env.DOMAIN}/user-profile-covers/${row.user.id}.jpg`,
            
            rank: currentRank,
            
            pp: row.pp,
            acc: row.acc,
            playtime: row.playtime,
            playcount: await getPlayerPlaycount(row.user.id),
            max_combo: row.max_combo,
            total_score: totalScoreNumber,
            ranked_score: Number(row.rscore),

            level: calculateLevel(totalScoreNumber),

            ss_count: row.x_count,
            ssh_count: row.xh_count,
            s_count: row.s_count,
            sh_count: row.sh_count,
            a_count: row.a_count,
        };
    }));
}