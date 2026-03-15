import { FastifyReply, FastifyRequest } from "fastify";
import { getGlobalLeaderboard } from "./ranking.service";
import { GetGlobalRankInput } from "./ranking.schema";

export const handleRankingGlobalReq = async (
    req: FastifyRequest<{ Querystring: GetGlobalRankInput }>,
    res: FastifyReply
) => {
    const leaderboard = await getGlobalLeaderboard(req.query);

    return res.send(leaderboard);
};