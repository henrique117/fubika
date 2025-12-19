import prisma from "../../utils/prisma";
import IPlayer from "../../interfaces/player.interface";
import { GetGlobalRankInput } from "./ranking.schema";

export const getGlobalLeaderboard = async (input: GetGlobalRankInput): Promise<IPlayer[]> => {
    
    const itemsPerPage = 50;
    const { page, mode } = input;
    
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

    return leaderboardRaw.map((row, index) => {
        const currentRank = ((page - 1) * itemsPerPage) + index + 1;

        return {
            id: row.user.id,
            name: row.user.name,
            safe_name: row.user.safe_name,
            pfp: `https://a.${process.env.DOMAIN}/${row.user.id}`,
            banner: `https://assets.ppy.sh/user-profile-covers/${row.user.id}.jpg`,
            
            rank: currentRank,
            
            pp: row.pp,
            acc: row.acc,
            playtime: row.playtime,
            max_combo: row.max_combo,
            total_score: Number(row.tscore),
            ranked_score: Number(row.rscore),

            ss_count: row.x_count,
            ssh_count: row.xh_count,
            s_count: row.s_count,
            sh_count: row.sh_count,
            a_count: row.a_count,
        };
    });
}